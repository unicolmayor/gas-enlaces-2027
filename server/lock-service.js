const { AppError } = require('./errors')

class ScriptLockService {
  constructor(lock, timeoutMs = 5000) {
    this.lock = lock
    this.timeoutMs = timeoutMs
  }

  runExclusive(callback) {
    if (!this.lock || typeof this.lock.tryLock !== 'function' || typeof this.lock.releaseLock !== 'function') {
      throw new AppError(500, 'LOCK_UNAVAILABLE', 'LockService is not configured')
    }
    if (!this.lock.tryLock(this.timeoutMs)) {
      throw new AppError(409, 'WRITE_LOCK_TIMEOUT', 'The resource is busy')
    }
    try {
      return callback()
    } finally {
      this.lock.releaseLock()
    }
  }
}

function createAppsScriptLockService(timeoutMs) {
  const appsScriptLockService = typeof globalThis !== 'undefined' ? globalThis.LockService : undefined
  if (!appsScriptLockService || typeof appsScriptLockService.getScriptLock !== 'function') {
    throw new AppError(500, 'LOCK_UNAVAILABLE', 'Apps Script LockService is unavailable')
  }
  return new ScriptLockService(appsScriptLockService.getScriptLock(), timeoutMs)
}

module.exports = { LockService: ScriptLockService, ScriptLockService, createAppsScriptLockService }
