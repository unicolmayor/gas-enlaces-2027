const { AppError } = require('./errors')
const { isEligibleUser } = require('./normalization')
const { publicUser } = require('./auth-service')

function listUsers(repository, currentUserId, query, maxPageSize = 100, defaultPageSize = 10) {
  const page = parsePositiveInteger(query.page, 1)
  const pageSize = parsePositiveInteger(query.pageSize, defaultPageSize)
  if (pageSize > maxPageSize) throw new AppError(400, 'INVALID_PAGINATION', `pageSize must be <= ${maxPageSize}`)
  const searchTerm = String(query.q || '').trim().toLowerCase()
  const filtered = repository.all()
    .filter(isEligibleUser)
    .filter((user) => String(user.id) !== String(currentUserId))
    .filter((user) => !searchTerm || [user.name, user.email, user.username].some((value) => String(value || '').toLowerCase().includes(searchTerm)))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }))
  const total = filtered.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const data = filtered.slice((page - 1) * pageSize, page * pageSize).map(publicUser)
  return { total, page, totalPages, data }
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) throw new AppError(400, 'INVALID_PAGINATION', 'Pagination values must be positive integers')
  return number
}

module.exports = { listUsers, parsePositiveInteger }
