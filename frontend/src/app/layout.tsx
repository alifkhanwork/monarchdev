import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Monarch Dev',
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
