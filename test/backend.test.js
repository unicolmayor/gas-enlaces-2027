const test = require('node:test')
const assert = require('node:assert/strict')
const { hashPassword } = require('../server/password')
const { signJwt, verifyJwt } = require('../server/jwt')
const { isEligibleUser } = require('../server/normalization')
const { listUsers } = require('../server/users-service')
const { LockService } = require('../server/lock-service')
const { SheetORM } = require('../server/sheet-orm')
const { readConfig } = require('../server/config')
const { extractToken } = require('../server/router')
const { buildCatalog } = require('../server/catalog')

const config = { jwtSecret: 'test-secret', jwtIssuer: 'issuer', jwtAudience: 'audience', tokenTtlSeconds: 60, maxPageSize: 10, defaultPageSize: 2 }

test('normalizes active, unlocked, and deleted_at values', () => {
  assert.equal(isEligibleUser({ is_active: 'TRUE', is_lock: false, deleted_at: '' }), false)
  assert.equal(isEligibleUser({ is_active: true, is_lock: false, deleted_at: null }), false)
  assert.equal(isEligibleUser({ is_active: false, is_lock: false, deleted_at: '' }), true)
  assert.equal(isEligibleUser({ is_active: false, is_lock: false, deleted_at: '2026-01-01' }), false)
})

test('hashes and verifies passwords with per-user salts', () => {
  const encoded = hashPassword('secret')
  assert.equal(encoded.startsWith('sha256-iterated$'), true)
  assert.notEqual(hashPassword('secret'), encoded)
})

test('signs and validates HS256 JWT claims', () => {
  const token = signJwt({ sub: '1' }, config, 100)
  assert.equal(verifyJwt(token, config, 101).sub, '1')
  assert.throws(() => verifyJwt(token, config, 161), /Invalid token/)
})

test('extracts bearer tokens from GAS-compatible request fields', () => {
  assert.equal(extractToken({ token: 'abc' }), 'abc')
  assert.equal(extractToken({ accessToken: 'def' }), 'def')
  assert.equal(extractToken({}), '')
  assert.equal(extractToken({}, 'Bearer ghi'), 'ghi')
})

test('builds the public catalog and excludes deleted relations', () => {
  const catalog = buildCatalog({
    faculties: [{ faculty_id: 1, faculty_name: 'Administración', deleted_at: '' }],
    programs: [{ program_id: 1, program_name: 'Marketing', faculty_id: 1, deleted_at: '' }],
    modules: [{ module_id: 1, module_name: 'Módulo 1', program_id: 1, semester: 'I', deleted_at: '' }],
    resources: [
      { resource_id: 1, resource_type: 'OA', module_id: 1, resource_name: 'Recurso activo', deleted_at: '' },
      { resource_id: 2, resource_type: 'OA', module_id: 1, resource_name: 'Recurso eliminado', deleted_at: '2026-01-01' }
    ],
    resourceLinks: [{ link_id: 1, resource_id: 1, type: 'Preview', url: 'https://example.com', deleted_at: '' }],
    folders: [{ folder_id: 1, path: 'https://drive.google.com/folders/1', deleted_at: '' }],
    resourceFolderLinks: [{ resource_id: 1, folder_id: 1 }]
  })
  assert.equal(catalog.facultades[0].programas[0].modulos[0].recursos.length, 1)
  assert.equal(catalog.facultades[0].programas[0].modulos[0].recursos[0].enlaces[0].tipo, 'Preview')
  assert.equal(catalog.facultades[0].programas[0].modulos[0].recursos[0].carpetas[0].ruta, 'https://drive.google.com/folders/1')
})

test('filters, searches, sorts and paginates users without sensitive fields', () => {
  const repository = { all: () => [
    { id: '1', name: 'Zoe', username: 'zoe', is_active: false, is_lock: false, deleted_at: '', password_hash: 'secret' },
    { id: '2', name: 'Ana', username: 'ana', is_active: false, is_lock: false, deleted_at: '' },
    { id: '3', name: 'Locked', username: 'locked', is_active: false, is_lock: true, deleted_at: '' }
  ] }
  assert.deepEqual(listUsers(repository, '99', { page: 1, pageSize: 1, q: 'a' }), {
    total: 1, page: 1, totalPages: 1, data: [{ id: '2', name: 'Ana', username: 'ana' }]
  })
})

test('releases the lock when a write succeeds or fails', () => {
  let released = 0
  const service = new LockService({ tryLock: () => true, releaseLock: () => { released += 1 } })
  assert.throws(() => service.runExclusive(() => { throw new Error('failure') }), /failure/)
  assert.equal(released, 1)
})

test('maps sheet headers to records and rejects missing required columns', () => {
  const rows = [['id', 'name'], ['1', 'Ana'], ['', '']]
  const sheet = {
    getDataRange: () => ({ getValues: () => rows })
  }
  assert.deepEqual(new SheetORM(sheet, { requiredColumns: ['id', 'name'] }).all(), [
    { __rowNumber: 2, id: '1', name: 'Ana' }
  ])
  assert.throws(() => new SheetORM(sheet, { requiredColumns: ['email'] }).all(), /Missing required column/)
})

test('requires backend properties and accepts configured pagination limits', () => {
  const properties = {
    getProperty(name) {
      return {
        SPREADSHEET_ID: 'sheet',
        JWT_SECRET: 'secret',
        MAX_PAGE_SIZE: '20'
      }[name] || null
    }
  }
  assert.equal(readConfig(properties).maxPageSize, 20)
  assert.throws(() => readConfig({ getProperty: () => null }), /Missing required property/)
})
