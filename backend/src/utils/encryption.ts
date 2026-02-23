import crypto from "crypto";

const KEY_ENV = "BYOK_ENCRYPTION_KEY";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

let cachedKey: Buffer | null = null;

const loadKey = (): Buffer => {
  if (cachedKey) return cachedKey;

  const raw = process.env[KEY_ENV];
  if (!raw) {
    throw new Error("BYOK encryption key is not configured");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error("BYOK encryption key must be 32 bytes (base64-encoded)");
  }

  cachedKey = key;
  return key;
};

export type EncryptedPayload = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export const encryptSecret = (plainText: string): EncryptedPayload => {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
};

export const decryptSecret = (payload: EncryptedPayload): string => {
  const key = loadKey();
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const encrypted = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};
