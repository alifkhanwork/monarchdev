import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Dev Monarch',
  description: 'Gamified life dashboard inspired by Solo Leveling',
  icons: {
    icon: '/crown.svg',
    shortcut: '/crown.svg',
    apple: '/crown.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
