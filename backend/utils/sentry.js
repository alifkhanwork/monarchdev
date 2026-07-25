const Sentry = require('@sentry/node');

const SENSITIVE_KEYS = new Set([
  'journal',
  'journalEntry',
  'journals',
  'plaintext',
  'ciphertext',
  'password',
  'token',
  'authorization',
  'cookie',
  'email',
  'mongo_uri',
  'monogouri',
  'resend_api_key',
  'cron_secret',
  'dsn',
]);

function scrubValue(key, value, depth = 0) {
  if (depth > 6) return '[Truncated]';
  const k = String(key || '').toLowerCase();
  if (SENSITIVE_KEYS.has(k) || k.includes('token') || k.includes('secret') || k.includes('password')) {
    return '[Filtered]';
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v, i) => scrubValue(i, v, depth + 1));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [ck, cv] of Object.entries(value)) {
      out[ck] = scrubValue(ck, cv, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) {
    return `${value.slice(0, 500)}…`;
  }
  return value;
}

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request) {
        if (event.request.headers) {
          event.request.headers = scrubValue('headers', event.request.headers);
        }
        if (event.request.data) {
          event.request.data = scrubValue('data', event.request.data);
        }
        if (event.request.cookies) {
          event.request.cookies = '[Filtered]';
        }
      }
      if (event.extra) event.extra = scrubValue('extra', event.extra);
      if (event.contexts) event.contexts = scrubValue('contexts', event.contexts);
      return event;
    },
  });
  return true;
}

module.exports = { initSentry, scrubValue, Sentry };
