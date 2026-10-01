'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

const navItems = [
  { name: 'Beranda', href: '/' },
  { name: 'Lomba', href: '/lomba' },
  { name: 'Pendaftaran', href: '/pendaftaran' },
  { name: 'Iuran', href: '/iuran' },
  { name: 'Histori', href: '/histori' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="w-full bg-white flex justify-center sticky top-0 z-50">
      <nav className="w-full max-w-360 h-28 px-5 md:px-15 flex items-center">

        {/* Logo */}
        <div className="flex-1 flex justify-start items-center">
          <Link href="/" className="block">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Nav Items */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return isActive ? (
              <Button
                key={item.href}
                variant="ghost"
                color="primary"
                size="L"
                onClick={() => router.push(item.href)}
                className="bg-primary-100! text-primary-600! relative overflow-hidden"
              >
                <span className="text-h7! font-bold invisible" aria-hidden="true">{item.name}</span>
                <span className="absolute inset-0 flex items-center justify-center text-body-1! font-bold">{item.name}</span>
              </Button>
            ) : (
              <Button
                key={item.href}
                variant="ghost"
                color="primary"
                size="L"
                onClick={() => router.push(item.href)}
                className="text-primary-600! hover:bg-primary-10! relative overflow-hidden"
              >
                <span className="text-h7! font-bold invisible" aria-hidden="true">{item.name}</span>
                <span className="absolute inset-0 flex items-center justify-center text-body-1! font-semibold transition-all">{item.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Right section */}
        <div className="flex-1 flex justify-end items-center gap-6">
          <button className="relative hover:bg-neutral-100 p-2 rounded-full transition-colors flex items-center justify-center">
            <Image src="/icons/notification.svg" alt="Notification" width={28} height={28} className="w-7 h-7" />
          </button>
          <button className="w-12 h-12 rounded-full border border-neutral-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
            <Image
              src="https://placecats.com/neo/100/100"
              alt="Profile"
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </button>

          {/* Hamburger (mobile) */}
          <button className="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg" aria-label="Buka Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        </div>

      </nav>
    </header>
  );
}
