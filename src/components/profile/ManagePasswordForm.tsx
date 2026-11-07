'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { EditableField, inputClassName } from '@/components/profile/ProfileFormField';

interface ManagePasswordFormProps {
  username: string;
  onCancel: () => void;
}

export function ManagePasswordForm({ username, onCancel }: ManagePasswordFormProps) {
  const [draftUsername, setDraftUsername] = useState(username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftUsername.trim()) {
      setError('Username wajib diisi.');
      return;
    }

    // The API currently exposes login/logout/me only. Never persist credentials
    // in the profile draft store or report a successful update without an API.
    setCurrentPassword('');
    setError('Perubahan belum dapat disimpan. Layanan pengubahan akun belum tersedia.');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <EditableField id="account-username" label="Username">
        <input
          id="account-username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={200}
          value={draftUsername}
          onChange={(event) => { setDraftUsername(event.target.value); setError(''); }}
          className={inputClassName}
        />
      </EditableField>

      <EditableField id="account-current-password" label="Sandi saat ini">
        <input
          id="account-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          placeholder="********"
          value={currentPassword}
          onChange={(event) => { setCurrentPassword(event.target.value); setError(''); }}
          className={`${inputClassName} placeholder:font-bold! placeholder:text-neutral-900!`}
        />
      </EditableField>

      {error && <p role="alert" className="text-body-3 text-error-100">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-0.5">
        <Button size="S" variant="ghost" color="neutral" onClick={onCancel} className="font-semibold text-neutral-900! focus-visible:outline-2 focus-visible:outline-primary-600">Batalkan</Button>
        <Button size="S" type="submit" className="px-5! font-bold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Simpan Perubahan</Button>
      </div>
    </form>
  );
}
