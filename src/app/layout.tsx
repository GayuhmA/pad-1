import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/SessionProvider';

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
    <html lang="id">
      <body className="font-outfit bg-neutral-50" suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <SessionProvider>{children}</SessionProvider>
        </div>
      </body>
    </html>
  );
}
