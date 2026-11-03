const { readConfig } = require('./config')
const { parseInput, createRouter } = require('./router')
const { failure, jsonResponse } = require('./response')
const { AppError } = require('./errors')

function createApp({ config, authService, userRepository, catalogRepository }) {
  const router = createRouter({ authService, userRepository, catalogRepository, config })
  return {
    doPost(event = {}) {
      try {
        const body = parseInput(event.postData && event.postData.contents)
        return router.dispatch(body, event.headers && (event.headers.Authorization || event.headers.authorization))
      } catch (error) {
        return jsonResponse(failure(error))
      }
    },
    doGet(event = {}) {
      try {
        const params = event.parameter || {}
        return router.dispatch({ action: params.action || 'catalog.get', ...params }, event.headers && (event.headers.Authorization || event.headers.authorization))
      } catch (error) {
        return jsonResponse(failure(error))
      }
    }
  }
}

function requireAppsScriptConfig(properties) {
  return readConfig(properties)
}

module.exports = { createApp, requireAppsScriptConfig, AppError }
