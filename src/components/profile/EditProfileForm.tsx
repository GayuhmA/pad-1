'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import type { ResidentProfile } from '@/lib/data/profile';
import { formatBirthDetails } from '@/lib/profile';
import { EditableField, EditIcon, inputClassName } from '@/components/profile/ProfileFormField';

interface EditProfileFormProps {
  profile: ResidentProfile;
  onSave: (profile: ResidentProfile) => void;
  onCancel: () => void;
}

export function EditProfileForm({ profile, onSave, onCancel }: EditProfileFormProps) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState('');
  const [editingBirth, setEditingBirth] = useState(false);

  function updateField(name: keyof ResidentProfile, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      birthPlace: draft.birthPlace.trim(),
      address: draft.address.trim(),
      locality: draft.locality.trim(),
      phone: draft.phone.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <EditableField id="profile-name" label="Nama Lengkap Sesuai KTP">
        <input id="profile-name" name="name" autoComplete="name" required maxLength={200} value={draft.name} onChange={(event) => updateField('name', event.target.value)} className={inputClassName} />
      </EditableField>

      <fieldset className="min-w-0">
        <legend className="mb-1 text-body-4 text-primary-600">Tempat Tanggal Lahir</legend>
        {editingBirth ? (
          <div className="grid gap-2 rounded-lg bg-neutral-100 p-2.5 sm:grid-cols-2">
            <label className="sr-only" htmlFor="profile-birth-place">Tempat lahir</label>
            <input id="profile-birth-place" name="birthPlace" autoFocus maxLength={200} placeholder="Tempat lahir" value={draft.birthPlace} onChange={(event) => updateField('birthPlace', event.target.value)} className={`${inputClassName} rounded-sm focus-visible:ring-2 focus-visible:ring-primary-600`} />
            <label className="sr-only" htmlFor="profile-birth-date">Tanggal lahir</label>
            <input id="profile-birth-date" name="birthDate" type="date" autoComplete="bday" value={draft.birthDate} onChange={(event) => updateField('birthDate', event.target.value)} className={`${inputClassName} rounded-sm focus-visible:ring-2 focus-visible:ring-primary-600`} />
          </div>
        ) : (
          <button type="button" onClick={() => setEditingBirth(true)} aria-label="Edit tempat tanggal lahir" className="flex min-h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-neutral-100 py-1.5 pr-2 pl-2.5 text-left text-body-3 font-bold text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-600">
            <span>{formatBirthDetails(draft.birthPlace, draft.birthDate)}</span>
            <span className="shrink-0 text-neutral-500"><EditIcon /></span>
          </button>
        )}
      </fieldset>

      <EditableField id="profile-address" label="Alamat Sesuai KTP">
        <input id="profile-address" name="address" autoComplete="address-line1" maxLength={200} placeholder="Alamat" value={draft.address} onChange={(event) => updateField('address', event.target.value)} className={inputClassName} />
        <label htmlFor="profile-locality" className="sr-only">Kelurahan, Kecamatan, dan Kota</label>
        <input id="profile-locality" name="locality" autoComplete="address-line2" maxLength={200} placeholder="Kelurahan, Kecamatan, dan Kota" value={draft.locality} onChange={(event) => updateField('locality', event.target.value)} className={`${inputClassName} font-normal!`} />
      </EditableField>

      <EditableField id="profile-phone" label="Nomor WhatsApp / Telepon">
        <input id="profile-phone" name="phone" type="tel" autoComplete="tel" maxLength={16} pattern="[+]?[0-9]{10,15}" title="Masukkan 10–15 digit nomor telepon, boleh diawali tanda +." value={draft.phone} onChange={(event) => updateField('phone', event.target.value)} className={inputClassName} />
      </EditableField>

      {error && <p role="alert" className="text-body-3 text-error-100">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-0.5">
        <Button size="S" variant="ghost" color="neutral" onClick={onCancel} className="font-semibold text-neutral-900! focus-visible:outline-2 focus-visible:outline-primary-600">Batalkan</Button>
        <Button size="S" type="submit" className="px-5! font-bold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Simpan Perubahan</Button>
      </div>
    </form>
  );
}
