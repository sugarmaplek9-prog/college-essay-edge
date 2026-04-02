import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'College Essay Edge',
  description: 'Find the angle before you write the essay.',
  openGraph: {
    title: 'College Essay Edge',
    description: 'Find the angle before you write the essay.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
