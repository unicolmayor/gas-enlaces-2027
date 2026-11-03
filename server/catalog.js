const { AppError } = require('./errors')
const { isNotDeleted } = require('./normalization')

const CATALOG_TABLES = {
  faculties: { sheet: 'Faculties', id: 'faculty_id', required: ['faculty_id', 'faculty_name', 'created_at', 'updated_at', 'deleted_at'] },
  programs: { sheet: 'Programs', id: 'program_id', required: ['program_id', 'program_name', 'faculty_id', 'created_at', 'updated_at', 'deleted_at'] },
  modules: { sheet: 'Modules', id: 'module_id', required: ['module_id', 'module_name', 'program_id', 'semester', 'created_at', 'updated_at', 'deleted_at'] },
  resources: { sheet: 'Resources', id: 'resource_id', required: ['resource_id', 'resource_type', 'module_id', 'resource_name', 'created_at', 'updated_at', 'deleted_at'] },
  resourceLinks: { sheet: 'ResourceLinks', id: 'link_id', required: ['link_id', 'resource_id', 'type', 'url', 'created_at', 'updated_at', 'deleted_at'] },
  folders: { sheet: 'Folders', id: 'folder_id', required: ['folder_id', 'path', 'created_at', 'updated_at', 'deleted_at'] },
  resourceFolderLinks: { sheet: 'ResourceFolderLinks', id: null, required: ['resource_id', 'folder_id'] }
}

function activeRows(rows) {
  return rows.filter((row) => isNotDeleted(row.deleted_at))
}

function indexBy(rows, key) {
  return rows.reduce((index, row) => {
    index[String(row[key])] = row
    return index
  }, {})
}

function buildCatalog(rows) {
  const faculties = activeRows(rows.faculties)
  const programs = activeRows(rows.programs)
  const modules = activeRows(rows.modules)
  const resources = activeRows(rows.resources)
  const resourceLinks = activeRows(rows.resourceLinks)
  const folders = activeRows(rows.folders)
  const resourceFolderLinks = rows.resourceFolderLinks
  const programsByFaculty = indexBy(programs, 'program_id')
  const modulesByProgram = indexBy(modules, 'module_id')
  const resourcesByModule = indexBy(resources, 'resource_id')
  const linksByResource = resourceLinks.reduce((index, link) => {
    const key = String(link.resource_id)
    if (!index[key]) index[key] = []
    index[key].push({ id: link.link_id, tipo: link.type, url: link.url })
    return index
  }, {})
  const foldersByResource = resourceFolderLinks.reduce((index, relation) => {
    const folder = folders.find((item) => String(item.folder_id) === String(relation.folder_id))
    if (!folder) return index
    const key = String(relation.resource_id)
    if (!index[key]) index[key] = []
    index[key].push({ id: folder.folder_id, ruta: folder.path })
    return index
  }, {})

  return {
    facultades: faculties.map((faculty) => ({
      id: faculty.faculty_id,
      nombre: faculty.faculty_name,
      programas: programs.filter((program) => String(program.faculty_id) === String(faculty.faculty_id)).map((program) => ({
        id: program.program_id,
        nombre: program.program_name,
        modulos: modules.filter((item) => String(item.program_id) === String(program.program_id)).map((item) => ({
          id: item.module_id,
          nombre: item.module_name,
          semestre: item.semester,
          recursos: resources.filter((resource) => String(resource.module_id) === String(item.module_id)).map((resource) => ({
            id: resource.resource_id,
            tipo: resource.resource_type,
            nombre: resource.resource_name,
            enlaces: linksByResource[String(resource.resource_id)] || [],
            carpetas: foldersByResource[String(resource.resource_id)] || []
          }))
        }))
      }))
    }))
  }
}

class CatalogRepository {
  constructor(spreadsheet, options = {}) {
    this.spreadsheet = spreadsheet
    this.cache = options.cache
    this.cacheKey = options.cacheKey || 'catalog:v1'
    this.cacheTtlSeconds = options.cacheTtlSeconds || 120
    this.ormFactory = options.ormFactory
  }

  readRows() {
    if (!this.spreadsheet || typeof this.spreadsheet.getSheetByName !== 'function') {
      throw new AppError(500, 'SHEET_UNAVAILABLE', 'No se pudo acceder al Spreadsheet')
    }
    return Object.entries(CATALOG_TABLES).reduce((result, [name, definition]) => {
      const sheet = this.spreadsheet.getSheetByName(definition.sheet)
      if (!sheet) throw new AppError(500, 'SHEET_UNAVAILABLE', `No existe la hoja ${definition.sheet}`)
      result[name] = this.ormFactory(sheet, { requiredColumns: definition.required }).all()
      return result
    }, {})
  }

  getCatalog() {
    const cached = this.cache && this.cache.get(this.cacheKey)
    if (cached) return JSON.parse(cached)
    const catalog = buildCatalog(this.readRows())
    if (this.cache) this.cache.put(this.cacheKey, JSON.stringify(catalog), this.cacheTtlSeconds)
    return catalog
  }

  invalidate() {
    if (this.cache && typeof this.cache.remove === 'function') this.cache.remove(this.cacheKey)
  }
}

module.exports = { CATALOG_TABLES, CatalogRepository, buildCatalog, activeRows }
