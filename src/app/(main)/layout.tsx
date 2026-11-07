import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthBoundary } from '@/components/AuthBoundary';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthBoundary>
      <Navbar />
      <main className="grow">{children}</main>
      <Footer />
    </AuthBoundary>
  );
}

