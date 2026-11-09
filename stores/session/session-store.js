import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEMO_ACCOUNTS } from "@/config/permissions";

const browserSessionStorage = {
  getItem(name) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name) || window.sessionStorage.getItem(name);
  },
  setItem(name, value) {
    if (typeof window === "undefined") return;
    const stored = JSON.parse(value);
    if (!stored.state?.isAuthenticated) {
      window.localStorage.removeItem(name);
      window.sessionStorage.removeItem(name);
      return;
    }
    if (stored.state.rememberMe) {
      window.localStorage.setItem(name, value);
      window.sessionStorage.removeItem(name);
    } else {
      window.sessionStorage.setItem(name, value);
      window.localStorage.removeItem(name);
    }
  },
  removeItem(name) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);
  },
};

const initialState = {
  role: null,
  user: null,
  currentUser: null,
  isAuthenticated: false,
  rememberMe: false,
};

export const useSessionStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      login: (user, rememberMe = false) => {
        if (!user?.id || !user?.role) {
          throw new Error("Un compte utilisateur valide est nécessaire.");
        }
        set({
          role: user.role,
          user,
          currentUser: user,
          isAuthenticated: true,
          rememberMe: Boolean(rememberMe),
        });
      },
      setRole: (newRole) => {
        const account = DEMO_ACCOUNTS.find((item) => item.role === newRole);
        if (!account) return;
        const currentUser = get().user;
        const user = currentUser?.role === newRole
          ? currentUser
          : account.user;
        set({
          role: account.role,
          user,
          currentUser: user,
          isAuthenticated: true,
        });
      },
      setUser: (user) => {
        if (!user) return;
        set({
          user,
          currentUser: user,
          role: user.role || get().role,
          isAuthenticated: true,
        });
      },
      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, ...updates };
          return {
            user: updated,
            currentUser: updated,
            role: updated.role || state.role,
          };
        });
      },
      logout: () => set({ ...initialState }),
      resetSession: () => set({ ...initialState }),
    }),
    {
      name: "besd_session_storage",
      storage: createJSONStorage(() => browserSessionStorage),
      partialize: (state) => ({
        role: state.role,
        user: state.user,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
    },
  ),
);
