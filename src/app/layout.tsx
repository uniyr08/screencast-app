import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScreenCast — Record, Share, Collaborate',
  description: 'Free screen recording tool for performance marketers. Record your screen, get AI insights, share with clients.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
