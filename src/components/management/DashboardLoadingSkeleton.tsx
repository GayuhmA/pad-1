import type { ReactNode } from 'react';

export function SkeletonBone({ className = '' }: { className?: string }) {
  return <div className={`motion-safe:animate-pulse rounded bg-neutral-200/75 ${className}`} />;
}

export function DashboardSkeletonFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function DashboardMetricSkeleton({
  count = 4,
  merged = false,
  columnsClass = 'grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4',
}: {
  count?: number;
  merged?: boolean;
  columnsClass?: string;
}) {
  if (merged) {
    return (
      <section className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)] lg:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className={`flex min-h-[96px] flex-col justify-center gap-2.5 px-5 py-5 sm:px-7 ${
              index > 0 ? 'border-l border-primary-100' : ''
            } ${index > 1 ? 'border-t border-primary-100 lg:border-t-0' : ''}`}
          >
            <SkeletonBone className="h-3.5 w-24 rounded-md" />
            <SkeletonBone className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className={`mb-6 grid ${columnsClass}`}>
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <SkeletonBone className="h-4 w-28 rounded-md" />
            <SkeletonBone className="size-8 rounded-xl bg-neutral-100" />
          </div>
          <SkeletonBone className="mt-3 h-7 w-24 rounded-lg" />
        </article>
      ))}
    </section>
  );
}

export function DashboardTableSkeleton({
  columns = 6,
  rows = 5,
  tabCount = 4,
  hasSelectFilter = false,
}: {
  columns?: number;
  rows?: number;
  tabCount?: number;
  hasSelectFilter?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:p-5">
        {(tabCount > 0 || hasSelectFilter) && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {tabCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: tabCount }, (_, idx) => (
                  <SkeletonBone key={idx} className="h-9 w-22 rounded-xl" />
                ))}
              </div>
            )}
            {hasSelectFilter && <SkeletonBone className="h-9 w-36 rounded-xl" />}
          </div>
        )}
        <SkeletonBone className="h-11 w-full max-w-[460px] rounded-xl" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className="bg-neutral-50">
            <tr>
              {Array.from({ length: columns }, (_, idx) => (
                <th key={idx} className="px-4 py-4 first:pl-5 last:pr-5">
                  <SkeletonBone className="h-3.5 w-20 rounded-md" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }, (_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4 first:pl-5 last:pr-5">
                    {colIndex === 0 ? (
                      <div className="space-y-2">
                        <SkeletonBone className="h-4 w-36 rounded-md" />
                        <SkeletonBone className="h-3 w-24 rounded-md bg-neutral-100" />
                      </div>
                    ) : colIndex === columns - 1 ? (
                      <SkeletonBone className="h-8 w-16 rounded-lg" />
                    ) : (
                      <SkeletonBone className="h-4 w-24 rounded-md" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonBone className="h-4 w-44 rounded-md" />
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonBone key={item} className="size-8 rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardCardGridSkeleton({
  titleWidth = 'w-48',
  cards = 3,
  gridClass = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3',
}: {
  titleWidth?: string;
  cards?: number;
  gridClass?: string;
}) {
  return (
    <section className="mt-9 sm:mt-11">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBone className="h-3.5 w-28 rounded-md" />
          <SkeletonBone className={`h-7 ${titleWidth} rounded-lg`} />
        </div>
        <SkeletonBone className="h-5 w-28 rounded-md" />
      </div>
      <div className={gridClass}>
        {Array.from({ length: cards }, (_, idx) => (
          <article key={idx} className="rounded-xl border border-primary-100 bg-white p-4">
            <SkeletonBone className="h-4 w-32 rounded-md" />
            <SkeletonBone className="mt-2.5 h-3.5 w-24 rounded-md bg-neutral-100" />
            <SkeletonBone className="mt-4 h-2 w-full rounded-full" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <DashboardSkeletonFrame label="Memuat data dashboard…">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <article key={item} className="rounded-2xl border border-primary-100/90 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <SkeletonBone className="h-4 w-28 rounded-md" />
              <SkeletonBone className="size-9 rounded-xl bg-neutral-100" />
            </div>
            <SkeletonBone className="mt-4 h-9 w-20 rounded-lg" />
          </article>
        ))}
      </div>
      <div className="mt-6 grid items-start gap-5 2xl:grid-cols-[1fr_1.02fr]">
        {[1, 2].map((panel) => (
          <section key={panel} className="rounded-2xl border border-primary-100/90 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SkeletonBone className="h-6 w-44 rounded-lg" />
              <SkeletonBone className="h-5 w-32 rounded-md" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((row) => (
                <div key={row} className="rounded-xl border border-neutral-100 p-4">
                  <SkeletonBone className="h-4 w-40 rounded-md" />
                  <SkeletonBone className="mt-2 h-3.5 w-56 rounded-md bg-neutral-100" />
                  <SkeletonBone className="mt-3 h-9 w-full rounded-xl bg-neutral-100" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardSkeletonFrame>
  );
}

export function DashboardDuesSkeleton() {
  return (
    <DashboardSkeletonFrame label="Memuat data iuran…">
      <DashboardMetricSkeleton count={4} />
      <section className="mb-6 rounded-xl border border-primary-100 bg-white p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SkeletonBone className="h-4 w-44 rounded-md" />
          <SkeletonBone className="h-3.5 w-36 rounded-md" />
        </div>
        <SkeletonBone className="h-2.5 w-full rounded-full" />
      </section>
      <div className="mb-6 h-[72px] rounded-2xl bg-primary-100/50 motion-safe:animate-pulse" />
      <DashboardTableSkeleton columns={6} rows={5} tabCount={4} />
    </DashboardSkeletonFrame>
  );
}

export function DashboardDocumentationSkeleton() {
  return (
    <DashboardSkeletonFrame label="Memuat album dokumentasi…">
      <DashboardMetricSkeleton count={3} columnsClass="grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5" />
      <section className="rounded-2xl border border-primary-100 bg-white p-4 sm:p-5 lg:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBone className="h-12 w-full max-w-md rounded-xl" />
          <SkeletonBone className="h-12 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <article key={item} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <SkeletonBone className="aspect-[1.45/1] w-full rounded-none" />
              <div className="space-y-2.5 p-4">
                <SkeletonBone className="h-3 w-24 rounded-md bg-neutral-100" />
                <SkeletonBone className="h-5 w-4/5 rounded-md" />
                <SkeletonBone className="h-3.5 w-20 rounded-md bg-neutral-100" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardSkeletonFrame>
  );
}

export function DashboardHistoryDetailSkeleton() {
  return (
    <DashboardSkeletonFrame label="Memuat detail histori perayaan…">
      <div className="space-y-7 lg:space-y-9">
        <section className="rounded-2xl border border-primary-100 bg-white p-5 sm:p-7">
          <SkeletonBone className="h-6 w-56 rounded-lg" />
          <div className="mt-4 space-y-2.5">
            <SkeletonBone className="h-4 w-full rounded-md" />
            <SkeletonBone className="h-4 w-11/12 rounded-md" />
            <SkeletonBone className="h-4 w-3/4 rounded-md" />
          </div>
        </section>
        <DashboardTableSkeleton columns={6} rows={4} tabCount={0} />
      </div>
    </DashboardSkeletonFrame>
  );
}

export function DashboardHistorySkeleton() {
  return (
    <DashboardSkeletonFrame label="Memuat data histori perayaan…">
      <div className="space-y-7 lg:space-y-9">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white px-4 py-4 sm:px-5">
          <SkeletonBone className="h-10 w-52 rounded-xl" />
          <SkeletonBone className="h-4 w-36 rounded-md" />
        </section>
        <section className="rounded-2xl border border-primary-100 bg-white p-5 sm:p-7">
          <SkeletonBone className="h-6 w-56 rounded-lg" />
          <div className="mt-4 space-y-2.5">
            <SkeletonBone className="h-4 w-full rounded-md" />
            <SkeletonBone className="h-4 w-11/12 rounded-md" />
            <SkeletonBone className="h-4 w-3/4 rounded-md" />
          </div>
        </section>
        <DashboardTableSkeleton columns={6} rows={4} tabCount={0} />
      </div>
    </DashboardSkeletonFrame>
  );
}

export function DashboardMessageSkeleton() {
  return (
    <DashboardSkeletonFrame label="Memuat pesan…">
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-wrap gap-2 rounded-xl border border-primary-100 bg-white p-3 sm:p-4">
          {[1, 2, 3].map((item) => (
            <SkeletonBone key={item} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
        <section className="grid min-h-[min(68vh,760px)] gap-5 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.3fr)]">
          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-primary-100 bg-white">
            <div className="border-b border-primary-100 p-4 sm:p-5">
              <SkeletonBone className="h-11 w-full rounded-xl" />
            </div>
            <div className="divide-y divide-primary-100">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="space-y-2.5 px-5 py-4 sm:px-6">
                  <SkeletonBone className="ml-auto h-3 w-20 rounded-md bg-neutral-100" />
                  <SkeletonBone className="h-4 w-4/5 rounded-md" />
                  <SkeletonBone className="h-3.5 w-full rounded-md bg-neutral-100" />
                  <SkeletonBone className="h-3 w-16 rounded-md bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex min-h-[560px] flex-col gap-5 rounded-xl border border-primary-100 bg-white p-6 sm:p-7">
            <div className="flex justify-between">
              <SkeletonBone className="h-3.5 w-28 rounded-md" />
              <SkeletonBone className="h-3.5 w-20 rounded-md" />
            </div>
            <SkeletonBone className="mx-auto h-7 w-3/5 rounded-lg" />
            <div className="space-y-3 border-t border-neutral-100 pt-5">
              <SkeletonBone className="h-4 w-full rounded-md" />
              <SkeletonBone className="h-4 w-11/12 rounded-md" />
              <SkeletonBone className="h-4 w-5/6 rounded-md" />
              <SkeletonBone className="h-4 w-2/3 rounded-md" />
            </div>
          </div>
        </section>
      </div>
    </DashboardSkeletonFrame>
  );
}

