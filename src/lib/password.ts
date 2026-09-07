import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from "node:crypto";

const SCRYPT_KEYLEN = 32;

function scryptAsync(
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const N = 16_384;
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${N}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4 || parts[0] !== "scrypt") return false;
    const salt = parts[2];
    const expected = Buffer.from(parts[3], "hex");
    const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN);
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}