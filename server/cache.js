function createAppsScriptCache() {
  if (typeof globalThis === 'undefined' || !globalThis.CacheService) return null
  return globalThis.CacheService.getScriptCache()
}

module.exports = { createAppsScriptCache }
