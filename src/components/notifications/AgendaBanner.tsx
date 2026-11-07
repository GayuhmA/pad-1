import { Fragment } from 'react';
import { formatAgendaTime, getCountdown } from '@/lib/notifications';

interface AgendaBannerProps {
  agenda: { title: string; location: string; startsAt: string; endsAt: string };
  now: number;
}

export function AgendaBanner({ agenda, now }: AgendaBannerProps) {
  const { hours, minutes, seconds, hasStarted } = getCountdown(agenda.startsAt, now);

  return (
    <section aria-labelledby="next-agenda-title" className="flex flex-col justify-between gap-8 rounded-xl bg-primary-600 px-6 py-8 text-white shadow-xl lg:min-h-54 lg:flex-row lg:items-center">
      <div className="min-w-0 space-y-4">
        <p className="text-body-1 font-semibold md:text-h7">
          {hasStarted ? 'Agenda anda telah dimulai' : 'Agenda anda selanjutnya'}
        </p>
        <h2 id="next-agenda-title" className="text-h6 font-bold md:text-h4">{agenda.title}</h2>
        <p className="text-body-3 font-medium md:text-body-1">
          {agenda.location} | {formatAgendaTime(agenda.startsAt)} - {formatAgendaTime(agenda.endsAt)} WIB
        </p>
      </div>

      <div
        role="timer"
        aria-live="off"
        aria-label={hasStarted ? 'Agenda telah dimulai' : `Dimulai dalam ${hours} jam ${minutes} menit ${seconds} detik`}
        className="flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-neutral-50 p-3 text-primary-600 sm:gap-3 sm:p-5 lg:self-center"
      >
        {[hours, minutes, seconds].map((value, index) => (
          <Fragment key={index}>
            {index > 0 && <span aria-hidden="true" className="text-h5 font-bold sm:text-h3">:</span>}
            <span aria-hidden="true" className="flex h-16 min-w-14 items-center justify-center rounded-xl bg-primary-600 px-1 text-h5 font-bold text-white tabular-nums sm:h-25 sm:min-w-25 sm:text-h1">
              {String(value).padStart(2, '0')}
            </span>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
