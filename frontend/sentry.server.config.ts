import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.request?.cookies) event.request.cookies = {};
    if (event.request?.data) event.request.data = '[Filtered]';
    return event;
  },
});
