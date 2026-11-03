const { AppError } = require('./errors')

class SheetORM {
  constructor(sheet, options = {}) {
    this.sheet = sheet
    this.requiredColumns = options.requiredColumns || []
    this.lockService = options.lockService
    this.cache = options.cache
    this.cacheTtlSeconds = options.cacheTtlSeconds || 60
  }

  headers() {
    if (!this.sheet || typeof this.sheet.getDataRange !== 'function') {
      throw new AppError(500, 'SHEET_UNAVAILABLE', 'Sheet is unavailable')
    }
    const values = this.sheet.getDataRange().getValues()
    const headers = values.length ? values[0].map((value) => String(value).trim()) : []
    if (!headers.length || headers.some((header) => !header)) {
      throw new AppError(500, 'INVALID_HEADERS', 'Sheet headers are missing or invalid')
    }
    this.requiredColumns.forEach((column) => {
      if (!headers.includes(column)) throw new AppError(500, 'INVALID_HEADERS', `Missing required column: ${column}`)
    })
    return { headers, values }
  }

  all() {
    const cached = this.cache && this.cache.get()
    if (cached) return JSON.parse(cached)
    const { headers, values } = this.headers()
    const records = values.slice(1).filter((row) => row.some((value) => value !== '' && value !== null)).map((row, index) => {
      const record = { __rowNumber: index + 2 }
      headers.forEach((header, column) => { record[header] = row[column] ?? null })
      return record
    })
    if (this.cache) this.cache.put(JSON.stringify(records), this.cacheTtlSeconds)
    return records
  }

  findById(id) {
    return this.all().find((record) => String(record.id) === String(id)) || null
  }

  create(record) {
    return this.withWrite(() => {
      const { headers } = this.headers()
      const unknown = Object.keys(record).filter((key) => key !== '__rowNumber' && !headers.includes(key))
      if (unknown.length) throw new AppError(400, 'INVALID_FIELDS', `Unknown fields: ${unknown.join(', ')}`)
      this.sheet.appendRow(headers.map((header) => record[header] ?? ''))
      this.invalidate()
      return this.findById(record.id)
    })
  }

  updateById(id, changes) {
    return this.withWrite(() => {
      const current = this.findById(id)
      if (!current) throw new AppError(404, 'NOT_FOUND', 'Record not found')
      const { headers } = this.headers()
      const unknown = Object.keys(changes).filter((key) => key !== '__rowNumber' && !headers.includes(key))
      if (unknown.length) throw new AppError(400, 'INVALID_FIELDS', `Unknown fields: ${unknown.join(', ')}`)
      const updated = { ...current, ...changes }
      this.sheet.getRange(current.__rowNumber, 1, 1, headers.length).setValues([headers.map((header) => updated[header] ?? '')])
      this.invalidate()
      return this.findById(id)
    })
  }

  withWrite(callback) {
    if (!this.lockService) return callback()
    return this.lockService.runExclusive(callback)
  }

  invalidate() {
    if (this.cache && typeof this.cache.remove === 'function') this.cache.remove()
  }
}

module.exports = { SheetORM }
