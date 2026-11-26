export function formatDuesCurrency(amount: number | null) {
  if (amount === null) return 'Rp–';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuesDate(date: string | null) {
  if (!date) return '–';
  const normalized = date.slice(0, 10);
  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function buildPaginationPages(currentPage: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages: (number | '…')[] = [1];
  if (currentPage > 3) pages.push('…');
  for (
    let number = Math.max(2, currentPage - 1);
    number <= Math.min(pageCount - 1, currentPage + 1);
    number++
  ) {
    pages.push(number);
  }
  if (currentPage < pageCount - 2) pages.push('…');
  pages.push(pageCount);
  return pages;
}

