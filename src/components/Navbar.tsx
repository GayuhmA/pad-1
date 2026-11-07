'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { useAppStore } from '@/stores/app-store';
import { useNotificationStore } from '@/stores/notification-store';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useResidentProfile } from '@/hooks/use-resident-profile';

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
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useAppStore();
  const hasUnreadNotifications = useNotificationStore((state) => state.notifications.some((item) => !item.isRead));
  const isNotificationPage = pathname === '/notifikasi';
  const isProfilePage = pathname === '/profile';
  const { profile } = useResidentProfile();

  if (!profile) return null;

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
          <Link
            href="/notifikasi"
            onClick={closeMobileMenu}
            aria-label={hasUnreadNotifications ? 'Notifikasi, ada pesan belum dibaca' : 'Notifikasi'}
            aria-current={isNotificationPage ? 'page' : undefined}
            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${isNotificationPage ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' : 'text-neutral-400 hover:bg-neutral-100'}`}
          >
            <Icon name="notification" className="size-7" />
          </Link>
          <Link
            href="/profile"
            onClick={closeMobileMenu}
            aria-label={`Profil ${profile.name}`}
            title={`${profile.name} (@${profile.username})`}
            aria-current={isProfilePage ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center rounded-full border-2 p-0.5 transition-colors hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${isProfilePage ? 'border-primary-300' : 'border-transparent'}`}
          >
            <Avatar name={profile.name} className="size-11 text-body-2" />
          </Link>

          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
            aria-label={isMobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" x2="6" y1="6" y2="18"/>
                <line x1="6" x2="18" y1="6" y2="18"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12"/>
                <line x1="4" x2="20" y1="6" y2="6"/>
                <line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            )}
          </button>
        </div>

      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-28 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeMobileMenu}
          />

          <div className="relative bg-white border-t border-neutral-100 shadow-lg">
            <div className="flex flex-col p-4 gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`px-5 py-3.5 rounded-xl text-body-1 font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-600 font-bold'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
