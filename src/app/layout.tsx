import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Click Thrive Marketing — Video Reviews & Client Collaboration',
  description: 'Record ad account reviews, campaign walkthroughs, and strategy videos. Share with clients and get feedback in one place.',
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