import { create } from 'zustand';
import { updateProfil, updateUsername, updatePassword } from '@/lib/api/profile';
import type { UpdateProfilRequest, UpdateUsernameRequest, UpdatePasswordRequest } from '@/lib/api/profile';
import { ApiRequestError } from '@/lib/api/client';

interface ProfileState {
  isSaving: boolean;
  error: string | null;
  saveProfile: (data: UpdateProfilRequest) => Promise<void>;
  saveUsername: (data: UpdateUsernameRequest) => Promise<void>;
  savePassword: (data: UpdatePasswordRequest) => Promise<void>;
  clearError: () => void;
}

const errorMessage = (error: unknown) =>
  error instanceof ApiRequestError ? error.message : 'Gagal menyimpan perubahan. Silakan coba lagi.';

export const useProfileStore = create<ProfileState>((set) => ({
  isSaving: false,
  error: null,

  saveProfile: async (data) => {
    set({ isSaving: true, error: null });
    try {
      await updateProfil(data);
      set({ isSaving: false });
    } catch (error) {
      set({ isSaving: false, error: errorMessage(error) });
      throw error;
    }
  },

  saveUsername: async (data) => {
    set({ isSaving: true, error: null });
    try {
      await updateUsername(data);
      set({ isSaving: false });
    } catch (error) {
      set({ isSaving: false, error: errorMessage(error) });
      throw error;
    }
  },

  savePassword: async (data) => {
    set({ isSaving: true, error: null });
    try {
      await updatePassword(data);
      set({ isSaving: false });
    } catch (error) {
      set({ isSaving: false, error: errorMessage(error) });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
