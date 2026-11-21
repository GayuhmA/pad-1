'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { EditableField, inputClassName } from '@/components/profile/ProfileFormField';
import { useProfileStore } from '@/stores/profile-store';
import { useAuthStore } from '@/stores/auth-store';

interface ManagePasswordFormProps {
  username: string;
  onCancel: () => void;
  onSave: () => void;
}

export function ManagePasswordForm({ username, onCancel, onSave }: ManagePasswordFormProps) {
  const [draftUsername, setDraftUsername] = useState(username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { isSaving, saveUsername, savePassword } = useProfileStore();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftUsername.trim()) {
      setError('Username wajib diisi.');
      return;
    }
    if (!currentPassword) {
      setError('Sandi saat ini wajib diisi.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('Konfirmasi sandi baru tidak cocok.');
      return;
    }

    try {
      const usernameChanged = draftUsername.trim() !== username;
      if (usernameChanged) {
        await saveUsername({ username: draftUsername.trim(), current_password: currentPassword });
      }
      if (newPassword) {
        await savePassword({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        });
      }
      await fetchUser(true);
      onSave();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan. Silakan coba lagi.';
      setError(message);
    }
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

      <EditableField id="account-new-password" label="Sandi baru (opsional)">
        <input
          id="account-new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Kosongkan jika tidak ingin ubah sandi"
          value={newPassword}
          onChange={(event) => { setNewPassword(event.target.value); setError(''); }}
          className={`${inputClassName} placeholder:font-normal! placeholder:text-neutral-400!`}
        />
      </EditableField>

      {newPassword && (
        <EditableField id="account-confirm-password" label="Konfirmasi sandi baru">
          <input
            id="account-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="********"
            value={confirmPassword}
            onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }}
            className={`${inputClassName} placeholder:font-bold! placeholder:text-neutral-900!`}
          />
        </EditableField>
      )}

      {error && <p role="alert" className="text-body-3 text-error-100">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-0.5">
        <Button size="S" variant="ghost" color="neutral" onClick={onCancel} disabled={isSaving} className="font-semibold text-neutral-900! focus-visible:outline-2 focus-visible:outline-primary-600">Batalkan</Button>
        <Button size="S" type="submit" disabled={isSaving} className="px-5! font-bold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">{isSaving ? 'Menyimpan…' : 'Simpan Perubahan'}</Button>
      </div>
    </form>
  );
}
