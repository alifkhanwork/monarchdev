import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The System',
  description: 'Gamified life dashboard inspired by Solo Leveling',
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
