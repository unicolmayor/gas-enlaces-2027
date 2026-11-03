const MESSAGES = {
  INVALID_CREDENTIALS: 'Las credenciales no son válidas',
  UNAUTHORIZED: 'Debes iniciar sesión para realizar esta operación',
  INVALID_TOKEN: 'El token de acceso no es válido',
  INVALID_JSON: 'La solicitud no contiene un JSON válido',
  INVALID_PAGINATION: 'Los parámetros de paginación no son válidos',
  NOT_FOUND: 'El recurso solicitado no existe',
  SHEET_UNAVAILABLE: 'No se pudo acceder a los datos',
  INVALID_HEADERS: 'La estructura de la hoja no es válida',
  CONFIGURATION_ERROR: 'La configuración del servidor no es válida',
  LOCK_UNAVAILABLE: 'El bloqueo de escritura no está disponible',
  WRITE_LOCK_TIMEOUT: 'El recurso está ocupado. Intenta nuevamente'
}

function success(data, status = 200) {
  return { status, body: { success: true, data } }
}

function failure(error) {
  const status = Number.isInteger(error.status) ? error.status : 500
  return {
    status,
    body: {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: status >= 500 ? 'Ocurrió un error interno' : (MESSAGES[error.code] || error.message),
        ...(error.details ? { details: error.details } : {})
      }
    }
  }
}

function jsonResponse(result, headers = {}) {
  return {
    status: result.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      ...headers
    },
    body: JSON.stringify(result.body)
  }
}

module.exports = { success, failure, jsonResponse }
