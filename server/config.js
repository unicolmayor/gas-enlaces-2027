const { AppError } = require('./errors')

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_MAX_PAGE_SIZE = 100
const DEFAULT_TOKEN_TTL_SECONDS = 3600

function getProperties(properties) {
  if (properties && typeof properties.getProperty === 'function') return properties
  if (typeof PropertiesService !== 'undefined') return PropertiesService.getScriptProperties()
  return {
    getProperty(name) {
      return process.env[name] || null
    }
  }
}

function readConfig(properties) {
  const source = getProperties(properties)
  const required = ['SPREADSHEET_ID', 'JWT_SECRET']
  const values = {}

  required.forEach((name) => {
    values[name] = source.getProperty(name)
    if (!values[name]) throw new AppError(500, 'CONFIGURATION_ERROR', `Missing required property: ${name}`)
  })

  const numberProperty = (name, fallback, minimum) => {
    const raw = source.getProperty(name)
    const value = raw === null || raw === '' ? fallback : Number(raw)
    if (!Number.isInteger(value) || value < minimum) {
      throw new AppError(500, 'CONFIGURATION_ERROR', `Invalid property: ${name}`)
    }
    return value
  }

  return {
    spreadsheetId: values.SPREADSHEET_ID,
    jwtSecret: values.JWT_SECRET,
    tokenTtlSeconds: numberProperty('JWT_TTL_SECONDS', DEFAULT_TOKEN_TTL_SECONDS, 60),
    defaultPageSize: numberProperty('DEFAULT_PAGE_SIZE', DEFAULT_PAGE_SIZE, 1),
    maxPageSize: numberProperty('MAX_PAGE_SIZE', DEFAULT_MAX_PAGE_SIZE, 1),
    jwtIssuer: source.getProperty('JWT_ISSUER') || 'gas-enlaces-2027',
    jwtAudience: source.getProperty('JWT_AUDIENCE') || 'admin'
  }
}

module.exports = { readConfig }
