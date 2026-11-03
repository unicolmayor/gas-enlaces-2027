const { AppError } = require('./errors')
const { hmacSha256, base64UrlEncode, base64UrlDecode, constantTimeEqual } = require('./crypto-adapter')

function signJwt(payload, config, now = Math.floor(Date.now() / 1000)) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const claims = { ...payload, iss: config.jwtIssuer, aud: config.jwtAudience, iat: now, exp: now + config.tokenTtlSeconds }
  const encoded = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`
  return `${encoded}.${base64UrlEncode(hmacSha256(encoded, config.jwtSecret))}`
}

function verifyJwt(token, config, now = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string') throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
  const parts = token.split('.')
  if (parts.length !== 3) throw new AppError(401, 'UNAUTHORIZED', 'Invalid token')
  let header
  let claims
  try {
    header = JSON.parse(base64UrlDecode(parts[0], true))
    claims = JSON.parse(base64UrlDecode(parts[1], true))
  } catch (error) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token')
  }
  if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new AppError(401, 'UNAUTHORIZED', 'Invalid token')
  const expected = hmacSha256(`${parts[0]}.${parts[1]}`, config.jwtSecret)
  const actual = base64UrlDecode(parts[2])
  if (!constantTimeEqual(actual, expected)) throw new AppError(401, 'UNAUTHORIZED', 'Invalid token')
  if (claims.iss !== config.jwtIssuer || claims.aud !== config.jwtAudience || !claims.sub || !Number.isInteger(claims.exp) || claims.exp <= now) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token')
  }
  return claims
}

module.exports = { signJwt, verifyJwt }
