import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Rajdhani, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import PwaRegister from '@/components/PwaRegister';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Dev Monarch',
  description: 'Gamified life dashboard inspired by Solo Leveling',
  applicationName: 'The Dev Monarch',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dev Monarch',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/crown.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#00e5ff',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <PwaRegister />
        <Analytics />
      </body>
    </html>
  );
}
