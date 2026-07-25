'use client';

import { useEffect } from 'react';

/** Registers the installable service worker (static asset cache only — no push). */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Avoid SW in Next.js HMR chaos during local `next dev`
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // ignore registration failures (private mode, etc.)
    });
  }, []);

  return null;
}
