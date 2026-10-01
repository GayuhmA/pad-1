import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'PAD',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-neutral-50 flex flex-col font-outfit">
          <Navbar />
          <main className="grow">{children}</main>
        </div>
      </body>
    </html>
  );
}
