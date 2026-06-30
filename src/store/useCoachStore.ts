"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CoachIntent, CoachMessage } from "@/types";

interface CoachState {
  intent: CoachIntent | null;
  setIntent: (i: CoachIntent | null) => void;

  messages: CoachMessage[];
  addMessage: (m: CoachMessage) => void;
  clearMessages: () => void;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      intent: null,
      setIntent: (i) => set({ intent: i }),
      messages: [],
      addMessage: (m) =>
        set((state) => ({ messages: [...state.messages, m].slice(-100) })),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: "midatim-coach", version: 1 },
  ),
);
