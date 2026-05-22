'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  sessionToken: string | null;
  setSessionToken: (token: string | null) => void;
  clearSession: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      sessionToken: null,
      setSessionToken: (token) => set({ sessionToken: token }),
      clearSession: () => set({ sessionToken: null }),
    }),
    {
      name: 'skybook-user-store',
      partialize: (state) => ({ sessionToken: state.sessionToken }),
    }
  )
);
