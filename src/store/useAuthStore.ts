"use client";

import { create } from "zustand";

interface AuthState {
  userId: string | null;
  email: string | null;
  isReady: boolean; // האם בדקנו פעם אחת מי המשתמש
  setSession: (s: { userId: string | null; email: string | null }) => void;
  setReady: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  isReady: false,
  setSession: (s) => set({ ...s }),
  setReady: (v) => set({ isReady: v }),
  clear: () => set({ userId: null, email: null }),
}));
