"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CatchEntry,
  DiagnosisResult,
  Goal,
  MaintenanceSession,
  ToolUsageEntry,
  UserSegment,
  VoiceKey,
} from "@/types";

interface AppState {
  // onboarding
  segment: UserSegment | null;
  setSegment: (s: UserSegment) => void;
  hasOnboarded: boolean;
  setOnboarded: (v: boolean) => void;

  // diagnosis history
  diagnosisHistory: DiagnosisResult[];
  addDiagnosis: (d: DiagnosisResult) => void;
  latestDiagnosis: () => DiagnosisResult | undefined;

  // tool usage
  toolUsage: ToolUsageEntry[];
  addToolUsage: (u: ToolUsageEntry) => void;

  // catches log
  catches: CatchEntry[];
  addCatch: (c: CatchEntry) => void;

  // weekly maintenance
  maintenance: MaintenanceSession[];
  addMaintenance: (m: MaintenanceSession) => void;

  // goals
  goals: Goal[];
  addGoal: (g: Goal) => void;
  completeGoal: (id: string) => void;

  // station progress
  completedStations: number[];
  completeStation: (id: number) => void;

  // privacy
  analyticsConsent: boolean | null;
  setAnalyticsConsent: (v: boolean) => void;

  // utility
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      segment: null,
      setSegment: (s) => set({ segment: s }),
      hasOnboarded: false,
      setOnboarded: (v) => set({ hasOnboarded: v }),

      diagnosisHistory: [],
      addDiagnosis: (d) =>
        set((state) => ({
          diagnosisHistory: [d, ...state.diagnosisHistory].slice(0, 20),
        })),
      latestDiagnosis: () => get().diagnosisHistory[0],

      toolUsage: [],
      addToolUsage: (u) =>
        set((state) => ({ toolUsage: [u, ...state.toolUsage].slice(0, 200) })),

      catches: [],
      addCatch: (c) =>
        set((state) => ({ catches: [c, ...state.catches].slice(0, 200) })),

      maintenance: [],
      addMaintenance: (m) =>
        set((state) => ({ maintenance: [m, ...state.maintenance].slice(0, 100) })),

      goals: [],
      addGoal: (g) => set((state) => ({ goals: [g, ...state.goals].slice(0, 50) })),
      completeGoal: (id) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, doneAt: new Date().toISOString() } : g,
          ),
        })),

      completedStations: [],
      completeStation: (id) =>
        set((state) =>
          state.completedStations.includes(id)
            ? state
            : { completedStations: [...state.completedStations, id] },
        ),

      analyticsConsent: null,
      setAnalyticsConsent: (v) => set({ analyticsConsent: v }),

      reset: () =>
        set({
          segment: null,
          hasOnboarded: false,
          diagnosisHistory: [],
          toolUsage: [],
          catches: [],
          maintenance: [],
          goals: [],
          completedStations: [],
        }),
    }),
    {
      name: "midatim-leahavah-app",
      version: 1,
    },
  ),
);

export function countCatches(catches: CatchEntry[]) {
  return {
    before: catches.filter((c) => c.when === "before").length,
    during: catches.filter((c) => c.when === "during").length,
    after: catches.filter((c) => c.when === "after").length,
  };
}

export function dominantVoiceFromHistory(
  history: DiagnosisResult[],
): VoiceKey | null {
  return history[0]?.dominantVoice ?? null;
}
