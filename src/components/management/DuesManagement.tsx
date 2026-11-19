'use client';

import { useMemo, useState } from 'react';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';

type PaymentStatus = 'Menunggu' | 'Lunas' | 'Belum Lunas';
type FilterTab = 'Semua' | PaymentStatus;

interface HouseholdPayment {
  id: number;
  name: string;
  phone: string;
  amount: number | null;
  date: string | null;
  status: PaymentStatus;
}

const initialPayments: HouseholdPayment[] = [
  { id: 1, name: 'Ian Mansur', phone: '0821 7895 8123', amount: 200000, date: '2026-08-15', status: 'Menunggu' },
  { id: 2, name: 'Ega Yunus', phone: '0821 6724 7818', amount: 500000, date: '2026-08-15', status: 'Menunggu' },
  { id: 3, name: 'Panca Mansur', phone: '0821 6712 6781', amount: null, date: null, status: 'Belum Lunas' },
  { id: 4, name: 'Junaedi Dartono', phone: '0823 7912 7923', amount: null, date: null, status: 'Belum Lunas' },
  { id: 5, name: 'Adriansyah Zulkarnain', phone: '0852 6789 9219', amount: 250000, date: '2026-08-14', status: 'Lunas' },
  { id: 6, name: 'Kemal Pranowo', phone: '0821 8989 7921', amount: 50000, date: '2026-08-14', status: 'Lunas' },
  { id: 7, name: 'Rina Suhartini', phone: '0812 3400 1122', amount: 100000, date: '2026-08-14', status: 'Lunas' },
  { id: 8, name: 'Bambang Santoso', phone: '0813 4567 8801', amount: 150000, date: '2026-08-13', status: 'Lunas' },
  { id: 9, name: 'Siti Aminah', phone: '0821 3344 5566', amount: null, date: null, status: 'Belum Lunas' },
  { id: 10, name: 'Agus Setiawan', phone: '0857 1122 3344', amount: 200000, date: '2026-08-13', status: 'Lunas' },
  { id: 11, name: 'Dewi Lestari', phone: '0812 9988 7766', amount: 100000, date: '2026-08-12', status: 'Lunas' },
  { id: 12, name: 'Hendra Wijaya', phone: '0819 2233 4455', amount: null, date: null, status: 'Belum Lunas' },
  { id: 13, name: 'Maya Puspita', phone: '0856 1234 5678', amount: 250000, date: '2026-08-12', status: 'Lunas' },
  { id: 14, name: 'Joko Prasetyo', phone: '0813 7654 3210', amount: 100000, date: '2026-08-11', status: 'Lunas' },
  { id: 15, name: 'Lestari Wulandari', phone: '0822 1000 3344', amount: null, date: null, status: 'Belum Lunas' },
  { id: 16, name: 'Faisal Rahman', phone: '0812 5566 7788', amount: 150000, date: '2026-08-11', status: 'Lunas' },
  { id: 17, name: 'Nining Haryanti', phone: '0852 9988 1100', amount: 200000, date: '2026-08-10', status: 'Lunas' },
  { id: 18, name: 'Wahyu Nugroho', phone: '0817 9000 1122', amount: null, date: null, status: 'Belum Lunas' },
  { id: 19, name: 'Putri Handayani', phone: '0813 8899 0011', amount: 100000, date: '2026-08-10', status: 'Lunas' },
  { id: 20, name: 'Surya Pranata', phone: '0821 3456 0099', amount: 250000, date: '2026-08-09', status: 'Lunas' },
  { id: 21, name: 'Yuni Astuti', phone: '0857 6789 2200', amount: null, date: null, status: 'Belum Lunas' },
  { id: 22, name: 'Hendra Kusuma', phone: '0812 4567 9900', amount: 100000, date: '2026-08-09', status: 'Lunas' },
  { id: 23, name: 'Sri Wahyuni', phone: '0819 7865 4321', amount: 150000, date: '2026-08-08', status: 'Lunas' },
  { id: 24, name: 'Dani Firmansyah', phone: '0823 9988 7766', amount: null, date: null, status: 'Belum Lunas' },
  { id: 25, name: 'Rudi Hartono', phone: '0851 1234 0987', amount: 200000, date: '2026-08-08', status: 'Lunas' },
];

const PAGE_SIZE = 6;
const tabs: FilterTab[] = ['Semua', 'Menunggu', 'Lunas', 'Belum Lunas'];
type DialogAction = 'approve' | 'reject' | 'cancel';

function formatCurrency(amount: number | null) {
  if (amount === null) return 'Rp–';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return '–';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    Menunggu: 'bg-secondary-100 text-secondary-600',
    Lunas: 'bg-[#C8F0E3] text-[#16866A]',
    'Belum Lunas': 'bg-[#FFD2CE] text-primary-600',
  };
  return <span className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function ConfirmDialog({ payment, action, onClose, onConfirm }: { payment: HouseholdPayment; action: DialogAction; onClose: () => void; onConfirm: () => void }) {
  const title = action === 'approve' ? 'Konfirmasi pembayaran' : action === 'reject' ? 'Tolak pembayaran' : 'Batalkan pembayaran';
  const description = action === 'approve'
    ? `Tandai pembayaran ${payment.name} sebesar ${formatCurrency(payment.amount)} sebagai lunas?`
    : action === 'reject'
      ? `Tolak bukti pembayaran dari ${payment.name}? Status iuran akan dikembalikan menjadi belum lunas.`
      : `Batalkan status pembayaran iuran ${payment.name}?`;
  return <div role="dialog" aria-modal="true" aria-labelledby="payment-confirm-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button type="button" aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-neutral-900/40" />
    <section className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <h2 id="payment-confirm-title" className="text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Kembali</button>
        <button type="button" onClick={onConfirm} className="min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">{action === 'approve' ? 'Konfirmasi lunas' : action === 'reject' ? 'Tolak pembayaran' : 'Batalkan iuran'}</button>
      </div>
    </section>
  </div>;
}

export function DuesManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [payments, setPayments] = useState(initialPayments);
  const [activeTab, setActiveTab] = useState<FilterTab>('Semua');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ payment: HouseholdPayment; action: DialogAction } | null>(null);
  const [proof, setProof] = useState<HouseholdPayment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID');
    return payments.filter((payment) => (activeTab === 'Semua' || payment.status === activeTab) &&
      (!search || payment.name.toLocaleLowerCase('id-ID').includes(search)));
  }, [payments, activeTab, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const waitingCount = payments.filter((item) => item.status === 'Menunggu').length;
  const paidCount = payments.filter((item) => item.status === 'Lunas').length;
  const unpaidCount = payments.filter((item) => item.status === 'Belum Lunas').length;

  function changeTab(tab: FilterTab) { setActiveTab(tab); setPage(1); }
  function changeQuery(value: string) { setQuery(value); setPage(1); }
  function confirmAction() {
    if (!dialog) return;
    setPayments((current) => current.map((item) => item.id === dialog.payment.id
      ? { ...item, status: dialog.action === 'approve' ? 'Lunas' : 'Belum Lunas' }
      : item));
    setDialog(null);
  }
  function paginationPages(): (number | '…')[] {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
    const pages: (number | '…')[] = [1];
    if (currentPage > 3) pages.push('…');
    for (let number = Math.max(2, currentPage - 1); number <= Math.min(pageCount - 1, currentPage + 1); number++) pages.push(number);
    if (currentPage < pageCount - 2) pages.push('…');
    pages.push(pageCount);
    return pages;
  }

  return <ManagementLayout role={role} userName={userName} title="Kelola Iuran" activeItem="dues">
    <section className="mb-7 sm:mb-8">
      <p className="mb-1 text-sm font-medium text-primary-600">Ruang {role === 'admin' ? 'Admin' : 'Panitia'}</p>
      <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Kelola Iuran</h1>
    </section>

    <section aria-label="Ringkasan pembayaran iuran" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5"><p className="text-sm font-medium text-neutral-500">Iuran terkumpul</p><p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">Rp2.500.000</p></article>
      <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5"><p className="text-sm font-medium text-neutral-500">Menunggu konfirmasi</p><p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{waitingCount}</p></article>
      <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5"><p className="text-sm font-medium text-neutral-500">Pembayaran lunas</p><p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{paidCount + 16}</p></article>
      <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5"><p className="text-sm font-medium text-neutral-500">Belum pembayaran</p><p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{unpaidCount + 6}</p></article>
    </section>

    <section aria-label="Progres penerimaan iuran" className="mb-6 rounded-xl border border-primary-100 bg-white p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-neutral-800">Progres penerimaan iuran</h2><span className="text-xs font-semibold text-neutral-400">69% dari total kepala keluarga</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-neutral-50"><div className="h-full w-[69%] rounded-full bg-primary-600" /></div>
    </section>

    <button type="button" onClick={() => setSettingsOpen(true)} className="mb-6 flex min-h-[72px] w-full items-center justify-between rounded-2xl bg-primary-100/70 px-5 text-left text-base font-semibold text-primary-600 transition hover:bg-primary-100 sm:px-6 sm:text-lg">
      <span>Pengaturan Rekening dan QRIS</span><Icon name="arrow" className="size-6" />
    </button>

    <section aria-labelledby="dues-table-title" className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]">
      <h2 id="dues-table-title" className="sr-only">Daftar pembayaran iuran</h2>
      <div className="flex flex-col gap-4 border-b border-neutral-100 p-4 sm:p-5">
        <div role="tablist" aria-label="Filter status pembayaran" className="flex flex-wrap gap-2">
          {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => changeTab(tab)} className={`min-h-9 rounded-xl px-4 text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-primary-100 text-primary-700' : 'border border-neutral-200 bg-white text-neutral-500 hover:border-primary-200 hover:text-primary-700'}`}>{tab}</button>)}
        </div>
        <div className="relative max-w-[460px]">
          <label htmlFor="dues-search" className="sr-only">Cari nama kepala keluarga</label>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" />
          <input id="dues-search" type="search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Cari nama kepala keluarga" className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead className="bg-neutral-50 text-xs font-semibold text-neutral-700"><tr>{['Kepala Keluarga', 'Nominal', 'Tanggal Pembayaran', 'Bukti Pembayaran', 'Status', 'Aksi'].map((heading) => <th key={heading} scope="col" className="px-4 py-4 first:pl-5 last:pr-5">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-neutral-100">
            {pageItems.map((payment) => <tr key={payment.id} className="hover:bg-primary-50/40">
              <td className="px-4 py-3.5 pl-5"><p className="text-sm font-semibold text-neutral-900">{payment.name}</p><p className="mt-0.5 text-xs text-neutral-400">{payment.phone}</p></td>
              <td className={`whitespace-nowrap px-4 py-3.5 text-sm ${payment.amount === null ? 'text-neutral-300' : 'text-neutral-500'}`}>{formatCurrency(payment.amount)}</td>
              <td className={`whitespace-nowrap px-4 py-3.5 text-sm ${payment.date ? 'text-neutral-500' : 'text-neutral-300'}`}>{formatDate(payment.date)}</td>
              <td className="px-4 py-3.5">{payment.date ? <button type="button" onClick={() => setProof(payment)} className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">Lihat Bukti</button> : <span className="text-sm text-neutral-300">Belum Diunggah</span>}</td>
              <td className="px-4 py-3.5"><StatusBadge status={payment.status} /></td>
              <td className="px-4 py-3.5 pr-5">
                {payment.status === 'Menunggu' ? <div className="flex items-center gap-2">
                  <button type="button" aria-label={`Konfirmasi pembayaran ${payment.name}`} title="Konfirmasi" onClick={() => setDialog({ payment, action: 'approve' })} className="flex size-8 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600 transition hover:bg-primary-50"><Icon name="check" className="size-4" /></button>
                  <button type="button" aria-label={`Tolak pembayaran ${payment.name}`} title="Tolak" onClick={() => setDialog({ payment, action: 'reject' })} className="flex size-8 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600 transition hover:bg-primary-50"><Icon name="close" className="size-4" /></button>
                </div> : payment.status === 'Belum Lunas' ? <span className="text-sm text-neutral-300">Batalkan</span> : <button type="button" onClick={() => setDialog({ payment, action: 'cancel' })} className="text-sm font-medium text-primary-600 hover:text-primary-700">Batalkan</button>}
              </td>
            </tr>)}
            {pageItems.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-neutral-400">Tidak ada pembayaran ditemukan</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-400">Menampilkan {pageItems.length} dari {filtered.length} kepala keluarga</p>
        <nav aria-label="Navigasi halaman iuran" className="flex items-center gap-1">
          <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-neutral-300"><Icon name="chevron" className="size-4 rotate-180" /></button>
          {paginationPages().map((item, index) => item === '…' ? <span key={`ellipsis-${index}`} className="px-1 text-sm text-primary-600">…</span> : <button key={item} type="button" aria-current={currentPage === item ? 'page' : undefined} onClick={() => setPage(item)} className={`flex size-8 items-center justify-center rounded-lg text-sm font-semibold ${currentPage === item ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50'}`}>{item}</button>)}
          <button type="button" aria-label="Halaman berikutnya" disabled={currentPage === pageCount} onClick={() => setPage((value) => value + 1)} className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-neutral-300"><Icon name="chevron" className="size-4" /></button>
        </nav>
      </div>
    </section>

    {dialog && <ConfirmDialog payment={dialog.payment} action={dialog.action} onClose={() => setDialog(null)} onConfirm={confirmAction} />}
    {proof && <div role="dialog" aria-modal="true" aria-labelledby="proof-title" className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Tutup" onClick={() => setProof(null)} className="absolute inset-0 bg-neutral-900/40" /><section className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="proof-title" className="text-lg font-semibold text-neutral-900">Bukti pembayaran</h2><p className="mt-1 text-sm text-neutral-500">{proof.name} · {formatCurrency(proof.amount)}</p></div><button type="button" aria-label="Tutup" onClick={() => setProof(null)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50"><Icon name="close" className="size-5" /></button></div><div className="mt-5 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-center"><div><Icon name="image" className="mx-auto size-10 text-neutral-300" /><p className="mt-3 text-sm font-medium text-neutral-500">Pratinjau bukti pembayaran</p><p className="mt-1 text-xs text-neutral-400">Tampilan contoh untuk slicing UI</p></div></div></section></div>}
    {settingsOpen && <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Tutup" onClick={() => setSettingsOpen(false)} className="absolute inset-0 bg-neutral-900/40" /><section className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="settings-title" className="text-lg font-semibold text-neutral-900">Pengaturan Rekening dan QRIS</h2><p className="mt-1 text-sm text-neutral-500">Informasi pembayaran iuran warga</p></div><button type="button" aria-label="Tutup" onClick={() => setSettingsOpen(false)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50"><Icon name="close" className="size-5" /></button></div><div className="mt-5 space-y-4"><label className="block space-y-1.5"><span className="text-sm font-medium text-neutral-700">Nama bank</span><input defaultValue="Bank BRI" className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400" /></label><label className="block space-y-1.5"><span className="text-sm font-medium text-neutral-700">Nomor rekening</span><input defaultValue="0123 01 000000 30 1" className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400" /></label><label className="block space-y-1.5"><span className="text-sm font-medium text-neutral-700">Atas nama</span><input defaultValue="Panitia HUT RI" className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400" /></label><div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center"><Icon name="image" className="mx-auto size-8 text-neutral-300" /><p className="mt-2 text-sm text-neutral-500">Unggah gambar QRIS</p></div></div><div className="mt-6 flex justify-end"><button type="button" onClick={() => setSettingsOpen(false)} className="min-h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">Simpan</button></div></section></div>}
  </ManagementLayout>;
}
