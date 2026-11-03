const { readConfig } = require('./config')
const { SheetORM } = require('./sheet-orm')
const { ensureUsersSheet, USERS_COLUMNS } = require('./users')
const { AuthService } = require('./auth-service')
const { createApp } = require('./index')
const { createAppsScriptLockService } = require('./lock-service')
const { CatalogRepository } = require('./catalog')
const { createAppsScriptCache } = require('./cache')

function buildAppsScriptApp() {
  const config = readConfig()
  const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId)
  const usersSheet = ensureUsersSheet(spreadsheet)
  const userRepository = new SheetORM(usersSheet, {
    requiredColumns: USERS_COLUMNS,
    lockService: createAppsScriptLockService()
  })
  const cache = createAppsScriptCache()
  const ormFactory = (sheet, options) => new SheetORM(sheet, { ...options, cache: null })
  const catalogRepository = new CatalogRepository(spreadsheet, {
    cache,
    ormFactory
  })
  return createApp({ config, authService: new AuthService(userRepository, config), userRepository, catalogRepository })
}

function toContentService(response) {
  return ContentService.createTextOutput(response.body)
    .setMimeType(ContentService.MimeType.JSON)
}

function doGet(event) {
  return toContentService(buildAppsScriptApp().doGet(event))
}

function doPost(event) {
  return toContentService(buildAppsScriptApp().doPost(event))
}

module.exports = { buildAppsScriptApp, doGet, doPost }

if (typeof globalThis !== 'undefined') {
  globalThis.doGet = doGet
  globalThis.doPost = doPost
}
