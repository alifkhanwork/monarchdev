import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  // Avoid upload failures when no Sentry auth token is present
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
