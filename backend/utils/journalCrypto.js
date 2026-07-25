const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

function getJournalKey() {
  const raw = process.env.JOURNAL_ENCRYPTION_KEY;
  if (!raw || !String(raw).trim()) {
    const err = new Error(
      'JOURNAL_ENCRYPTION_KEY is not configured. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
    err.statusCode = 503;
    throw err;
  }
  let key;
  try {
    key = Buffer.from(String(raw).trim(), 'base64');
  } catch {
    key = null;
  }
  if (!key || key.length !== KEY_BYTES) {
    const err = new Error(
      'JOURNAL_ENCRYPTION_KEY must be a 32-byte key encoded as base64 (44 characters).'
    );
    err.statusCode = 503;
    throw err;
  }
  return key;
}

/**
 * Encrypt plaintext journal body.
 * Returns { ciphertext, iv, tag } as base64 strings (AES-256-GCM).
 */
function encryptJournalText(plaintext) {
  const key = getJournalKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypt an encrypted journal payload.
 */
function decryptJournalText({ ciphertext, iv, tag }) {
  const key = getJournalKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

/** True if the document looks like an encrypted v1 journal row. */
function isEncryptedDoc(doc) {
  return Boolean(doc && doc.ciphertext && doc.iv && doc.tag && doc.encrypted !== false);
}

/**
 * Resolve plaintext from a JournalEntry doc (encrypted or legacy plaintext).
 */
function resolveJournalPlaintext(doc) {
  if (!doc) return '';
  if (isEncryptedDoc(doc)) {
    return decryptJournalText({
      ciphertext: doc.ciphertext,
      iv: doc.iv,
      tag: doc.tag,
    });
  }
  if (typeof doc.plaintext === 'string' && doc.plaintext) {
    return doc.plaintext;
  }
  return '';
}

module.exports = {
  encryptJournalText,
  decryptJournalText,
  resolveJournalPlaintext,
  isEncryptedDoc,
  getJournalKey,
};
