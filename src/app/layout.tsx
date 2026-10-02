import type { Metadata } from 'next';
import './globals.css';

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
      <body suppressHydrationWarning>
        <div className="min-h-screen flex flex-col font-outfit bg-neutral-50">
          {children}
        </div>
      </body>
    </html>
  );
}
