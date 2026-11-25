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
import { useAuthStore } from '@/stores/auth-store';
import { getNavbarRightAction } from '@/lib/management-role';

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
  const hasUnreadNotifications = useNotificationStore((state) => state.unreadCount > 0);
  const isNotificationPage = pathname === '/notifikasi';
  const isProfilePage = pathname === '/profile';
  const { profile } = useResidentProfile();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);
  const rightAction = user ? getNavbarRightAction(user.role) : null;
  const isGuest = !user && authStatus !== 'initializing' && authStatus !== 'logging-out';

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
            const targetHref = isGuest && item.href !== '/' ? '/login' : item.href;
            return isActive ? (
              <Button
                key={item.href}
                variant="ghost"
                color="primary"
                size="L"
                onClick={() => router.push(targetHref)}
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
                onClick={() => router.push(targetHref)}
                className="text-primary-600! hover:bg-primary-10! relative overflow-hidden"
              >
                <span className="text-h7! font-bold invisible" aria-hidden="true">{item.name}</span>
                <span className="absolute inset-0 flex items-center justify-center text-body-1! font-semibold transition-all">{item.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Right section */}
        <div className="flex-1 flex justify-end items-center gap-3 sm:gap-6">
          {rightAction === 'dashboard' ? (
            <Link
              href="/dashboard"
              onClick={closeMobileMenu}
              aria-label="Kembali ke Dashboard"
              className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] sm:rounded-[10px] bg-primary-600 px-3.5 sm:px-5 text-body-3 sm:text-body-2 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-[inset_0px_6px_10px_rgba(0,0,0,0.4)] active:bg-primary-700 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4.5 shrink-0">
                <path d="M4 4h6v6H4z" />
                <path d="M14 4h6v6h-6z" />
                <path d="M4 14h6v6H4z" />
                <path d="M14 14h6v6h-6z" />
              </svg>
              <span className="sm:hidden">Dashboard</span>
              <span className="hidden sm:inline">Kembali ke Dashboard</span>
            </Link>
          ) : profile ? (
            <>
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
            </>
          ) : isGuest ? (
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="inline-flex h-10 sm:h-11 items-center justify-center whitespace-nowrap rounded-[8px] sm:rounded-[10px] bg-primary-600 px-5 sm:px-6 text-body-3 sm:text-body-2 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-[inset_0px_6px_10px_rgba(0,0,0,0.4)] active:bg-primary-700 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Masuk
            </Link>
          ) : (
            <div className="flex items-center gap-4" aria-hidden="true">
              <div className="size-10 rounded-full bg-neutral-100 animate-pulse" />
              <div className="size-11 rounded-full bg-neutral-200 animate-pulse" />
            </div>
          )}

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
                const targetHref = isGuest && item.href !== '/' ? '/login' : item.href;
                return (
                  <Link
                    key={item.href}
                    href={targetHref}
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
