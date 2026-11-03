const { AppError } = require('./errors')
const { isEligibleUser } = require('./normalization')
const { verifyPassword } = require('./password')
const { signJwt, verifyJwt } = require('./jwt')

class AuthService {
  constructor(userRepository, config) {
    this.userRepository = userRepository
    this.config = config
  }

  login(username, password) {
    const user = this.userRepository.all().find((candidate) => (
      String(candidate.username || '').toLowerCase() === String(username || '').toLowerCase()
      || String(candidate.email || '').toLowerCase() === String(username || '').toLowerCase()
    ))
    if (!user || !isEligibleUser(user) || !verifyPassword(password, user.password_hash)) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials')
    }
    return {
      token: signJwt({ sub: String(user.id) }, this.config),
      user: publicUser(user)
    }
  }

  authenticate(token) {
    const claims = verifyJwt(token, this.config)
    const user = this.userRepository.findById(claims.sub)
    if (!user || !isEligibleUser(user)) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    return user
  }
}

function publicUser(user) {
  return Object.fromEntries(Object.entries({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username
  }).filter(([, value]) => value !== undefined && value !== null))
}

module.exports = { AuthService, publicUser }
