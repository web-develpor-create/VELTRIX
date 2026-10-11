"use client";

import { create } from "zustand";

export type ViewId =
  | "landing"
  | "dashboard"
  | "editor"
  | "templates"
  | "domains"
  | "settings"
  | "support"
  | "admin"
  | "pricing"
  | "docs";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
}

interface AppState {
  // Auth
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  authLoading: boolean;
  setAuthLoading: (b: boolean) => void;

  // Navigation
  view: ViewId;
  setView: (v: ViewId) => void;

  // Editor state
  editingWebsiteId: string | null;
  setEditingWebsiteId: (id: string | null) => void;

  // Auth modal
  authModalOpen: boolean;
  authModalMode: "login" | "signup" | "reset";
  openAuth: (mode?: "login" | "signup" | "reset") => void;
  closeAuth: () => void;

  // Toast for global events
  toast: { id: number; message: string; variant: "default" | "success" | "error" } | null;
  showToast: (message: string, variant?: "default" | "success" | "error") => void;
  clearToast: () => void;

  // Mobile nav
  mobileNavOpen: boolean;
  setMobileNavOpen: (b: boolean) => void;
}

let toastId = 0;

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  authLoading: true,
  setAuthLoading: (b) => set({ authLoading: b }),

  view: "landing",
  setView: (v) => set({ view: v }),

  editingWebsiteId: null,
  setEditingWebsiteId: (id) => set({ editingWebsiteId: id }),

  authModalOpen: false,
  authModalMode: "login",
  openAuth: (mode = "login") => set({ authModalOpen: true, authModalMode: mode }),
  closeAuth: () => set({ authModalOpen: false }),

  toast: null,
  showToast: (message, variant = "default") =>
    set({ toast: { id: ++toastId, message, variant } }),
  clearToast: () => set({ toast: null }),

  mobileNavOpen: false,
  setMobileNavOpen: (b) => set({ mobileNavOpen: b }),
}));

/** Fetch the current user on first page load. */
export async function bootstrapUser() {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      useAppStore.getState().setUser(data.user);
    }
  } catch {
    // ignore
  } finally {
    useAppStore.getState().setAuthLoading(false);
  }
}
