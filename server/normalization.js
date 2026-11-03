function isTrue(value) {
  return value === true || String(value).trim().toUpperCase() === 'TRUE'
}

function isFalse(value) {
  return value === false || value === null || value === undefined || String(value).trim().toUpperCase() === 'FALSE'
}

function isNotDeleted(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function isEligibleUser(user) {
  return !isTrue(user.is_active ?? user.isActive)
    && !isTrue(user.is_lock ?? user.isLock)
    && isNotDeleted(user.deleted_at ?? user.deletedAt)
}

module.exports = { isTrue, isFalse, isNotDeleted, isEligibleUser }
