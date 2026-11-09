type PageSkeletonVariant = 'home' | 'lomba' | 'pendaftaran' | 'iuran' | 'profile' | 'generic';

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  includeShell?: boolean;
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`motion-safe:animate-pulse bg-neutral-200/80 ${className}`} />;
}

function NavigationSkeleton() {
  return (
    <header className="h-20 shrink-0 bg-white shadow-xs">
      <div className="mx-auto flex h-full w-full max-w-360 items-center justify-between gap-8 px-5 md:px-15">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-full" />
          <SkeletonBlock className="hidden h-5 w-28 rounded-md sm:block" />
        </div>
        <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {['w-20', 'w-24', 'w-20', 'w-28', 'w-20'].map((widthClass, index) => (
            <SkeletonBlock key={index} className={`h-4 ${widthClass} rounded-md`} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="hidden h-4 w-24 rounded-md sm:block" />
          <SkeletonBlock className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </header>
  );
}

function FooterSkeleton() {
  return (
    <footer className="mt-auto bg-neutral-900/10">
      <div className="mx-auto grid min-h-40 w-full max-w-360 gap-8 px-5 py-8 md:grid-cols-3 md:px-15">
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-40 rounded-md" />
          <SkeletonBlock className="h-3 w-full max-w-64 rounded-md" />
          <SkeletonBlock className="h-3 w-4/5 max-w-52 rounded-md" />
        </div>
        <div className="hidden space-y-3 md:block">
          <SkeletonBlock className="h-5 w-28 rounded-md" />
          <SkeletonBlock className="h-3 w-44 rounded-md" />
        </div>
        <div className="hidden space-y-3 md:block">
          <SkeletonBlock className="h-5 w-32 rounded-md" />
          <SkeletonBlock className="h-3 w-52 rounded-md" />
        </div>
      </div>
    </footer>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12 px-5 py-10 md:px-15">
        <section className="space-y-4">
          <SkeletonBlock className="h-8 w-44 rounded-md bg-white/80" />
          <div className="flex min-h-100 items-center rounded-lg bg-white p-10 md:p-16">
            <div className="w-full max-w-2xl space-y-5">
              <SkeletonBlock className="h-14 w-4/5 rounded-xl md:h-20" />
              <SkeletonBlock className="h-6 w-3/5 rounded-lg" />
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1 space-y-4">
              <div className="flex gap-4">
                <SkeletonBlock className="h-7 w-36 rounded-full" />
                <SkeletonBlock className="h-5 w-40 rounded-md" />
              </div>
              <SkeletonBlock className="h-9 w-3/5 rounded-lg" />
              <SkeletonBlock className="h-4 w-4/5 rounded-md" />
            </div>
            <SkeletonBlock className="h-11 w-32 rounded-lg" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-7 w-7 rounded-full" />
            <SkeletonBlock className="h-8 w-56 rounded-lg" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div key={item} className="space-y-5 rounded-lg bg-white p-6">
                <SkeletonBlock className="ml-auto h-4 w-32 rounded-md" />
                <SkeletonBlock className="h-10 w-1/2 rounded-lg" />
                <SkeletonBlock className="h-24 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-300 rounded-lg bg-white p-8 md:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <SkeletonBlock className="h-11 w-64 rounded-lg" />
            <div className="flex gap-2 rounded-xl bg-neutral-50 p-1.5">
              {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-10 w-28 rounded-lg" />)}
            </div>
          </div>
          <div className="mt-10 space-y-8">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center gap-6">
                <SkeletonBlock className="h-20 w-20 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <SkeletonBlock className="h-4 w-40 rounded-md" />
                  <SkeletonBlock className="h-8 w-2/5 rounded-lg" />
                  <SkeletonBlock className="h-4 w-52 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LombaSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8 px-5 py-10 md:px-15">
        <header className="space-y-3">
          <SkeletonBlock className="h-12 w-72 rounded-xl md:h-18 md:w-96" />
          <SkeletonBlock className="h-5 w-64 rounded-md" />
        </header>

        <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <SkeletonBlock className="h-12 flex-1 rounded-xl" />
            <div className="flex gap-2 rounded-xl bg-neutral-100 p-1.5">
              {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-9 w-24 rounded-lg" />)}
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {['w-24', 'w-28', 'w-24', 'w-20'].map((widthClass, index) => (
              <SkeletonBlock key={index} className={`h-10 ${widthClass} shrink-0 rounded-xl`} />
            ))}
          </div>
        </section>

        <section className="mt-2 space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <SkeletonBlock className="h-10 w-80 max-w-full rounded-lg" />
            <div className="flex gap-2 rounded-xl bg-white p-1.5">
              {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-10 w-28 rounded-lg" />)}
            </div>
          </div>
          {[1, 2].map((item) => (
            <div key={item} className="flex flex-col items-center gap-6 rounded-2xl bg-white p-6 md:flex-row">
              <SkeletonBlock className="h-16 w-full rounded-xl md:w-48" />
              <div className="flex-1 space-y-3">
                <SkeletonBlock className="h-9 w-2/5 rounded-lg" />
                <SkeletonBlock className="h-6 w-48 rounded-full" />
              </div>
              <SkeletonBlock className="h-5 w-44 rounded-md" />
            </div>
          ))}
        </section>

        <section className="mt-10 space-y-6">
          <SkeletonBlock className="h-10 w-72 rounded-lg" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex min-h-80 flex-col gap-5 rounded-2xl bg-white p-6">
                <div className="flex justify-between">
                  <SkeletonBlock className="h-6 w-24 rounded-full" />
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="h-10 w-3/4 rounded-lg" />
                <SkeletonBlock className="h-4 w-36 rounded-md" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="mt-auto h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto w-full max-w-360 space-y-8 px-5 py-10 md:px-15">
        <section className="flex flex-col gap-5 rounded-xl bg-white p-6 sm:flex-row sm:items-center">
          <SkeletonBlock className="h-24 w-24 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-10 w-64 max-w-full rounded-lg" />
            <SkeletonBlock className="h-5 w-40 rounded-md" />
          </div>
          <SkeletonBlock className="h-11 w-28 rounded-lg" />
        </section>
        <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
          <section className="space-y-6 rounded-xl bg-white p-6">
            <SkeletonBlock className="h-11 w-48 rounded-lg" />
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-2">
                <SkeletonBlock className="h-4 w-32 rounded-md" />
                <SkeletonBlock className="h-6 w-3/5 rounded-md" />
              </div>
            ))}
          </section>
          <section className="space-y-5 rounded-xl bg-white p-6">
            <SkeletonBlock className="mx-auto h-8 w-48 rounded-lg" />
            <SkeletonBlock className="h-20 w-full rounded-xl" />
            <SkeletonBlock className="h-14 w-full rounded-xl" />
          </section>
        </div>
      </div>
    </div>
  );
}

function PendaftaranSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8 px-5 py-10 md:px-15">
        <header className="space-y-3">
          <SkeletonBlock className="h-12 w-72 max-w-full rounded-xl" />
          <SkeletonBlock className="h-5 w-96 max-w-full rounded-md" />
        </header>
        <SkeletonBlock className="h-14 w-full rounded-2xl bg-white/80" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-10 w-28 shrink-0 rounded-xl bg-white/80" />)}
        </div>
        {[1, 2, 3].map((item) => (
          <section key={item} className="space-y-5 rounded-2xl bg-white p-6 md:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row">
              <div className="space-y-4">
                <SkeletonBlock className="h-7 w-44 rounded-full" />
                <SkeletonBlock className="h-10 w-64 max-w-full rounded-lg" />
              </div>
              <div className="space-y-3 sm:flex sm:flex-col sm:items-end">
                <SkeletonBlock className="h-5 w-40 rounded-md" />
                <SkeletonBlock className="h-5 w-32 rounded-md" />
                <SkeletonBlock className="h-5 w-44 rounded-md" />
              </div>
            </div>
            <SkeletonBlock className="h-14 w-full rounded-xl" />
          </section>
        ))}
      </div>
    </div>
  );
}

function IuranSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-10 px-5 py-10 md:px-15">
        <header className="space-y-3">
          <SkeletonBlock className="h-12 w-64 max-w-full rounded-xl" />
          <SkeletonBlock className="h-5 w-112 max-w-full rounded-md" />
        </header>
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div className="space-y-2">
              <SkeletonBlock className="h-10 w-60 rounded-lg" />
              <SkeletonBlock className="h-4 w-72 rounded-md" />
            </div>
            <div className="flex gap-2 rounded-xl bg-white/70 p-1.5">
              {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-9 w-28 rounded-lg" />)}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-5 rounded-2xl bg-white p-6">
                <SkeletonBlock className="h-6 w-32 rounded-full" />
                <SkeletonBlock className="h-8 w-3/4 rounded-lg" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-11 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
          <SkeletonBlock className="h-150 rounded-2xl bg-white/80" />
          <SkeletonBlock className="h-96 rounded-2xl bg-white/80" />
        </section>
      </div>
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto w-full max-w-360 space-y-8 px-5 py-10 md:px-15">
        <div className="space-y-3">
          <SkeletonBlock className="h-14 w-72 max-w-full rounded-xl" />
          <SkeletonBlock className="h-5 w-96 max-w-full rounded-md" />
        </div>
        <SkeletonBlock className="h-20 w-full rounded-2xl bg-white/80" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-64 rounded-2xl bg-white/80" />)}
        </div>
      </div>
    </div>
  );
}

function PageContent({ variant }: { variant: PageSkeletonVariant }) {
  if (variant === 'home') return <HomeSkeleton />;
  if (variant === 'lomba') return <LombaSkeleton />;
  if (variant === 'pendaftaran') return <PendaftaranSkeleton />;
  if (variant === 'iuran') return <IuranSkeleton />;
  if (variant === 'profile') return <ProfileSkeleton />;
  return <GenericSkeleton />;
}

export function PageSkeleton({ variant = 'generic', includeShell = false }: PageSkeletonProps) {
  const content = <PageContent variant={variant} />;
  if (!includeShell) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Memuat halaman</span>
        <div aria-hidden="true">{content}</div>
      </div>
    );
  }
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen flex-col">
      <span className="sr-only">Memuat halaman</span>
      <div aria-hidden="true" className="flex min-h-screen flex-col">
        <NavigationSkeleton />
        {content}
        <FooterSkeleton />
      </div>
    </div>
  );
}
