import {
  DashboardCompetitionsSkeleton,
  DashboardDocumentationSkeleton,
  DashboardDuesSkeleton,
  DashboardHistorySkeleton,
  DashboardMessageSkeleton,
  DashboardOverviewSkeleton,
  DashboardPanitiaSkeleton,
  DashboardRegistrationsSkeleton,
  DashboardWargaSkeleton,
} from '@/components/management/DashboardLoadingSkeleton';

export type PageSkeletonVariant =
  | 'home'
  | 'lomba'
  | 'pendaftaran'
  | 'iuran'
  | 'histori'
  | 'notifikasi'
  | 'profile'
  | 'management'
  | 'generic';

export type ManagementSkeletonPage =
  | 'dashboard'
  | 'competitions'
  | 'registrations'
  | 'dues'
  | 'warga'
  | 'panitia'
  | 'messages'
  | 'documentation'
  | 'history';

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  managementPage?: ManagementSkeletonPage;
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
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12 px-5 py-10 md:px-15">
        <section className="flex flex-col gap-6">
          <SkeletonBlock className="h-9 w-72 max-w-full rounded-xl bg-white/80 md:h-11 md:w-88" />
          <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex w-fit items-center gap-1 rounded-2xl bg-white p-1.5 shadow-xs">
              {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-9 w-24 rounded-xl" />)}
            </div>
            <SkeletonBlock className="h-11 w-full rounded-xl bg-white/90 sm:w-80" />
          </div>
          <div className="overflow-hidden rounded-2xl bg-white/60 shadow-xs">
            <div className="grid grid-cols-4 gap-4 bg-neutral-50 px-8 py-4.5">
              {[1, 2, 3, 4].map((col) => <SkeletonBlock key={col} className="h-5 w-28 rounded-md" />)}
            </div>
            <div className="divide-y divide-white/60">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="grid grid-cols-4 gap-4 px-8 py-6">
                  <SkeletonBlock className="h-5 w-40 rounded-md" />
                  <SkeletonBlock className="h-5 w-28 rounded-md" />
                  <SkeletonBlock className="h-5 w-24 rounded-md" />
                  <SkeletonBlock className="h-5 w-32 rounded-md" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-neutral-50 px-8 py-4.5">
              <SkeletonBlock className="h-4 w-44 rounded-md" />
              <div className="flex gap-2">
                {[1, 2, 3].map((item) => <SkeletonBlock key={item} className="size-7 rounded-md" />)}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SkeletonBlock className="h-9 w-64 max-w-full rounded-xl bg-white/80 md:h-11" />
          <div className="grid items-stretch gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-xs md:p-8 lg:col-span-7">
              <SkeletonBlock className="h-12 w-full rounded-xl" />
              <SkeletonBlock className="mx-auto aspect-square w-60 rounded-2xl" />
              <SkeletonBlock className="h-12 w-full rounded-xl" />
            </div>
            <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-xs md:p-8 lg:col-span-5">
              <SkeletonBlock className="h-7 w-52 rounded-lg" />
              {[1, 2, 3].map((field) => (
                <div key={field} className="space-y-2">
                  <SkeletonBlock className="h-4 w-36 rounded-md" />
                  <SkeletonBlock className="h-12 w-full rounded-xl" />
                </div>
              ))}
              <SkeletonBlock className="h-32 w-full rounded-xl" />
              <SkeletonBlock className="mt-auto h-12 w-full rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HistoriSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-10 px-5 py-10 md:gap-12 md:px-15">
        <div className="flex w-fit items-center gap-2 rounded-2xl bg-white p-1.5 shadow-xs">
          <SkeletonBlock className="h-10 w-24 rounded-xl" />
          <SkeletonBlock className="size-10 rounded-xl" />
        </div>

        <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-xs md:p-8 lg:p-10">
          <SkeletonBlock className="h-4 w-44 rounded-md" />
          <SkeletonBlock className="h-10 w-3/4 max-w-2xl rounded-xl" />
          <SkeletonBlock className="h-4 w-56 rounded-md" />
          <div className="space-y-2.5 pt-2">
            <SkeletonBlock className="h-4 w-full rounded-md" />
            <SkeletonBlock className="h-4 w-5/6 rounded-md" />
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <SkeletonBlock className="h-9 w-56 rounded-xl bg-white/80" />
            <SkeletonBlock className="h-11 w-full rounded-xl bg-white/90 sm:w-80" />
          </div>
          <div className="overflow-hidden rounded-2xl bg-white/60 shadow-xs">
            <div className="grid grid-cols-4 gap-4 bg-neutral-50 px-6 py-4">
              {[1, 2, 3, 4].map((col) => <SkeletonBlock key={col} className="h-5 w-24 rounded-md" />)}
            </div>
            <div className="divide-y divide-white/60">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="grid grid-cols-4 gap-4 px-6 py-5">
                  <SkeletonBlock className="h-5 w-36 rounded-md" />
                  <SkeletonBlock className="h-5 w-24 rounded-md" />
                  <SkeletonBlock className="h-5 w-32 rounded-md" />
                  <SkeletonBlock className="h-5 w-44 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <SkeletonBlock className="h-9 w-52 rounded-xl bg-white/80" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((card) => (
              <div key={card} className="overflow-hidden rounded-2xl bg-white shadow-xs">
                <SkeletonBlock className="aspect-4/3 w-full rounded-none" />
                <div className="space-y-2.5 p-5">
                  <SkeletonBlock className="h-4 w-28 rounded-md" />
                  <SkeletonBlock className="h-6 w-3/4 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function NotifikasiSkeleton() {
  return (
    <div className="min-h-screen grow bg-linear-to-b from-primary-100 to-white">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-14 px-5 py-12 md:gap-24 md:px-15 md:py-24">
        <section className="mx-auto w-full max-w-240">
          <SkeletonBlock className="mx-auto mb-10 h-13 max-w-188 rounded-xl bg-white/90 shadow-lg sm:mb-12" />
          <div className="mb-5 flex flex-wrap gap-2 sm:px-5">
            <SkeletonBlock className="h-11 w-36 rounded-xl bg-white" />
            <SkeletonBlock className="h-11 w-36 rounded-xl bg-white" />
          </div>
          <div className="space-y-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-6">
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-5 w-48 rounded-md" />
                  <SkeletonBlock className="h-4 w-24 rounded-md" />
                </div>
                <SkeletonBlock className="h-4 w-3/4 rounded-md" />
                <SkeletonBlock className="h-3.5 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className="min-h-screen grow bg-neutral-50">
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

function ManagementMainSkeleton({ page = 'dashboard' }: { page?: ManagementSkeletonPage }) {
  if (page === 'competitions') return <DashboardCompetitionsSkeleton />;
  if (page === 'registrations') return <DashboardRegistrationsSkeleton />;
  if (page === 'dues') return <DashboardDuesSkeleton />;
  if (page === 'warga') return <DashboardWargaSkeleton />;
  if (page === 'panitia') return <DashboardPanitiaSkeleton />;
  if (page === 'messages') return <DashboardMessageSkeleton />;
  if (page === 'documentation') return <DashboardDocumentationSkeleton />;
  if (page === 'history') return <DashboardHistorySkeleton />;
  return <DashboardOverviewSkeleton />;
}

function ManagementSkeleton({ page = 'dashboard' }: { page?: ManagementSkeletonPage }) {
  return (
    <div className="min-h-screen bg-[#FCF4F3] text-neutral-900">
      <div className="min-h-screen lg:pl-69">
        <aside aria-hidden="true" className="fixed inset-y-0 left-0 hidden w-69 flex-col border-r border-primary-100 bg-white lg:flex">
          <div className="flex h-25 items-center gap-3 px-7">
            <SkeletonBlock className="size-13.5 rounded-xl" />
            <div className="space-y-2"><SkeletonBlock className="h-3 w-20 rounded" /><SkeletonBlock className="h-3 w-14 rounded" /></div>
          </div>
          <div className="flex-1 space-y-8 px-7 py-7">
            {[4, 3].map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <SkeletonBlock className="mb-4 h-3 w-28 rounded" />
                {Array.from({ length: group }, (_, item) => <SkeletonBlock key={item} className="h-12 w-full rounded-xl" />)}
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 p-5"><SkeletonBlock className="h-14 w-full rounded-xl" /></div>
        </aside>

        <header aria-hidden="true" className="flex h-18 items-center justify-between border-b border-primary-100/80 bg-white px-4 sm:px-7 lg:h-20.5 lg:px-9">
          <div className="flex items-center gap-3"><SkeletonBlock className="size-9 rounded-lg lg:hidden" /><div className="space-y-2"><SkeletonBlock className="h-4 w-28 rounded" /><SkeletonBlock className="h-3 w-24 rounded" /></div></div>
          <div className="flex items-center gap-4"><SkeletonBlock className="hidden h-4 w-36 rounded md:block" /><SkeletonBlock className="h-10 w-28 rounded-xl" /></div>
        </header>

        <main aria-hidden="true" className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9 lg:py-10">
          <section className="mb-7 space-y-2.5 sm:mb-8">
            <SkeletonBlock className="h-4 w-36 rounded" />
            <SkeletonBlock className="h-8 w-64 max-w-full rounded-lg sm:h-9" />
          </section>
          <ManagementMainSkeleton page={page} />
        </main>
      </div>
    </div>
  );
}

function PageContent({ variant, managementPage }: { variant: PageSkeletonVariant; managementPage?: ManagementSkeletonPage }) {
  if (variant === 'home') return <HomeSkeleton />;
  if (variant === 'lomba') return <LombaSkeleton />;
  if (variant === 'pendaftaran') return <PendaftaranSkeleton />;
  if (variant === 'iuran') return <IuranSkeleton />;
  if (variant === 'histori') return <HistoriSkeleton />;
  if (variant === 'notifikasi') return <NotifikasiSkeleton />;
  if (variant === 'profile') return <ProfileSkeleton />;
  if (variant === 'management') return <ManagementSkeleton page={managementPage} />;
  return <GenericSkeleton />;
}

export function PageSkeleton({ variant = 'generic', managementPage, includeShell = false }: PageSkeletonProps) {
  const content = <PageContent variant={variant} managementPage={managementPage} />;
  if (variant === 'management') {
    return (
      <div role="status" aria-live="polite" className="min-h-screen">
        <span className="sr-only">Memuat dashboard</span>
        <div aria-hidden="true">{content}</div>
      </div>
    );
  }
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
