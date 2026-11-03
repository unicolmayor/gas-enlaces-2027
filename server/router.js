const { AppError } = require('./errors')
const { success, failure, jsonResponse } = require('./response')

function createRouter({ authService, userRepository, catalogRepository, config }) {
  function dispatch(input, authorization) {
    try {
      const action = input && input.action
      if (action === 'auth.login') {
        return jsonResponse(success(authService.login(input.username, input.password)))
      }
      if (action === 'catalog.get') {
        return jsonResponse(success(catalogRepository.getCatalog()))
      }
      if (action === 'users.list') {
        const token = extractToken(input, authorization)
        const user = authService.authenticate(token)
        const { listUsers } = require('./users-service')
        return jsonResponse(success(listUsers(userRepository, user.id, input, config.maxPageSize, config.defaultPageSize)))
      }
      throw new AppError(404, 'NOT_FOUND', 'La acción solicitada no existe')
    } catch (error) {
      return jsonResponse(failure(error))
    }
  }

  return { dispatch }
}

function extractToken(input = {}, authorization) {
  const supplied = input.accessToken || input.token || authorization || ''
  return String(supplied).replace(/^Bearer\s+/i, '').trim()
}

function parseInput(body) {
  if (body && typeof body === 'object') return body
  try {
    return JSON.parse(String(body || '{}'))
  } catch (error) {
    throw new AppError(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }
}

module.exports = { createRouter, parseInput, extractToken }
