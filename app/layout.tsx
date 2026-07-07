import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'c0mpute changelog',
  description: 'repo updates translated into roadmap progress.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/kwe2dpm.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
