import * as Sentry from '@sentry/nextjs';

const SENSITIVE = /journal|password|token|secret|authorization|cookie|email|mongo/i;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.request?.headers) {
      const scrubbed: Record<string, string> = {};
      for (const [k, v] of Object.entries(event.request.headers)) {
        scrubbed[k] = SENSITIVE.test(k) ? '[Filtered]' : String(v);
      }
      event.request.headers = scrubbed;
    }
    if (event.request?.data && typeof event.request.data === 'object') {
      event.request.data = '[Filtered body]';
    }
    return event;
  },
});
