import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const SALT_LEN = 16
const KEY_LEN = 32

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN)
  const hash = scryptSync(password, salt, KEY_LEN)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const storedHash = Buffer.from(hashHex, 'hex')
  const hash = scryptSync(password, salt, KEY_LEN)
  return timingSafeEqual(hash, storedHash)
}
