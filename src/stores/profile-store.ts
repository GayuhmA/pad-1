import { create } from 'zustand';
import type { ResidentProfile } from '@/lib/data/profile';

interface ProfileState {
  drafts: Record<string, ResidentProfile>;
  saveDraft: (accountKey: string, profile: ResidentProfile) => void;
  clearDrafts: () => void;
}

// Session-only drafts until a profile update endpoint is available.
export const useProfileStore = create<ProfileState>((set) => ({
  drafts: {},
  saveDraft: (accountKey, profile) => set((state) => ({
    drafts: { ...state.drafts, [accountKey]: { ...profile } },
  })),
  clearDrafts: () => set({ drafts: {} }),
}));
