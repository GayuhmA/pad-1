export interface AgendaDateTab {
  date: string;
  label: 'Hari Ini' | 'Besok' | '17 Agustus';
}

export interface ScheduleDateTime {
  tanggal: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
}

export type ScheduleTimingStatus = 'Segera' | 'Selesai';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function addDays(dateString: string, days: number): string {
  if (!isValidIsoDate(dateString)) throw new TypeError('Tanggal harus menggunakan format YYYY-MM-DD.');
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function jakartaToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function jakartaTime(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part('hour')}:${part('minute')}:${part('second')}`;
}

/** Derives the public schedule state without relying on a potentially stale backend label. */
export function getScheduleTimingStatus(
  schedule: ScheduleDateTime,
  now = new Date(),
): ScheduleTimingStatus {
  const today = jakartaToday(now);
  if (schedule.tanggal < today) return 'Selesai';
  if (schedule.tanggal > today) return 'Segera';

  const endTime = schedule.waktu_selesai ?? schedule.waktu_mulai;
  if (!endTime) return 'Segera';
  return endTime.slice(0, 8) <= jakartaTime(now) ? 'Selesai' : 'Segera';
}

function isAugust17(date: string): boolean {
  return date.slice(5) === '08-17';
}

/**
 * Builds stable calendar shortcuts. Available dates determine the event year,
 * but never hide a shortcut; an empty date is represented by the UI empty state.
 * On 17 August the dedicated label wins so the same date never appears twice.
 */
export function buildAgendaDateTabs(availableDates: string[], today: string): AgendaDateTab[] {
  if (!isValidIsoDate(today)) throw new TypeError('Tanggal hari ini tidak valid.');
  const tomorrow = addDays(today, 1);
  const validAvailableDates = availableDates.filter(isValidIsoDate).sort();
  const august17FromApi = validAvailableDates.find(isAugust17);
  const eventYear = (august17FromApi ?? validAvailableDates[0] ?? today).slice(0, 4);
  const august17 = august17FromApi ?? `${eventYear}-08-17`;

  if (today === august17) {
    return [
      { date: august17, label: '17 Agustus' },
      { date: tomorrow, label: 'Besok' },
    ];
  }
  if (tomorrow === august17) {
    return [
      { date: today, label: 'Hari Ini' },
      { date: august17, label: '17 Agustus' },
    ];
  }
  return [
    { date: today, label: 'Hari Ini' },
    { date: tomorrow, label: 'Besok' },
    { date: august17, label: '17 Agustus' },
  ];
}

export function formatTanggalIndonesia(dateString: string): string {
  if (!isValidIsoDate(dateString)) return dateString;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatWaktu(value: string | null): string {
  return value ? value.slice(0, 5).replace(':', '.') : '--.--';
}
