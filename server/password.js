const { randomHex, sha256, constantTimeEqual } = require('./crypto-adapter')

function hashPassword(password, salt = randomHex()) {
  let derived = `${salt}:${String(password)}`
  for (let index = 0; index < 10000; index += 1) derived = sha256(derived)
  return `sha256-iterated$${salt}$${derived}`
}

function verifyPassword(password, encoded) {
  if (typeof encoded !== 'string') return false
  const [algorithm, salt, expected] = encoded.split('$')
  if (algorithm !== 'sha256-iterated' || !salt || !expected) return false
  const actual = hashPassword(password, salt).split('$')[2]
  return constantTimeEqual(actual, expected)
}

module.exports = { hashPassword, verifyPassword }
