function utf8Bytes(value) {
  if (typeof Utilities !== 'undefined') return Utilities.newBlob(String(value)).getBytes()
  return Buffer.from(String(value), 'utf8')
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('')
}

function sha256(value) {
  if (typeof Utilities !== 'undefined') {
    return bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, utf8Bytes(value)))
  }
  return eval('require')('crypto').createHash('sha256').update(String(value)).digest('hex')
}

function hmacSha256(value, secret) {
  if (typeof Utilities !== 'undefined') {
    return Utilities.computeHmacSha256Signature(utf8Bytes(value), String(secret))
  }
  return eval('require')('crypto').createHmac('sha256', secret).update(value).digest()
}

function base64UrlEncode(value) {
  if (typeof Utilities !== 'undefined') {
    const bytes = typeof value === 'string' ? utf8Bytes(value) : value
    return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '')
  }
  return eval('require')('buffer').Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value, asText = false) {
  if (typeof Utilities !== 'undefined') {
    const bytes = Utilities.base64DecodeWebSafe(value)
    if (asText) return Utilities.newBlob(bytes).getDataAsString()
    return bytes
  }
  const buffer = eval('require')('buffer').Buffer.from(value, 'base64url')
  return asText ? buffer.toString('utf8') : buffer
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index]
  }
  return result === 0
}

function randomHex(length = 16) {
  if (typeof Utilities !== 'undefined') return bytesToHex(Utilities.getUuid().replace(/-/g, '').match(/.{2}/g).slice(0, length))
  return eval('require')('crypto').randomBytes(length).toString('hex')
}

module.exports = {
  sha256,
  hmacSha256,
  base64UrlEncode,
  base64UrlDecode,
  constantTimeEqual,
  randomHex
}
