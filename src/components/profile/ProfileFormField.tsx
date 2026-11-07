'use client';

import { useRef, type ReactNode } from 'react';

export const inputClassName = 'min-w-0 w-full bg-transparent text-body-3 font-bold text-neutral-900 placeholder:font-normal placeholder:text-neutral-500 focus:outline-none';

export function EditIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m14.5 5.5 4 4M4 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m5 14 10.8-10.8a2.8 2.8 0 0 1 4 4L9 18l-5 1 1-5Z" fill="currentColor" />
    </svg>
  );
}

export function EditableField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-body-4 text-primary-600">{label}</label>
      <div ref={containerRef} className="relative rounded-lg bg-neutral-100 py-1.5 pr-10 pl-2.5 focus-within:ring-2 focus-within:ring-primary-600">
        {children}
        <button
          type="button"
          aria-label={`Edit ${label.toLowerCase()}`}
          onClick={() => containerRef.current?.querySelector('input')?.focus()}
          className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center rounded-r-lg text-neutral-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
        >
          <EditIcon />
        </button>
      </div>
    </div>
  );
}

