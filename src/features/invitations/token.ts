import crypto from 'crypto'

/** Generates a 64-character hex token (32 random bytes). */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/** SHA-256 hash of a raw token hex string. */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex')
}

/**
 * Constant-time comparison of a candidate raw token against a stored hash.
 * Uses crypto.timingSafeEqual to prevent timing oracle attacks.
 */
export function verifyToken(candidateRaw: string, storedHash: string): boolean {
  const candidateHash = hashToken(candidateRaw)
  const a = Buffer.from(candidateHash, 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Returns a Date 7 days from now. */
export function defaultExpiresAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d
}

/** Returns true if the given date is in the past. */
export function isExpired(expiresAt: Date): boolean {
  return expiresAt < new Date()
}
