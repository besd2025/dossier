import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO_ACCOUNTS, Role } from "@/config/permissions";

const DEFAULT_ACCOUNT = DEMO_ACCOUNTS[0]; // Chef de bureau (Colonel Alexandre Martin)

export const useSessionStore = create(
  persist(
    (set, get) => ({
      role: DEFAULT_ACCOUNT.role,
      user: DEFAULT_ACCOUNT.user,
      currentUser: DEFAULT_ACCOUNT.user,

      /**
       * Bascule vers l'un des 8 rôles/comptes de démonstration
       * @param {string} newRole
       */
      setRole: (newRole) => {
        const account = DEMO_ACCOUNTS.find((a) => a.role === newRole) || DEMO_ACCOUNTS[0];
        set({
          role: account.role,
          user: account.user,
          currentUser: account.user,
        });
      },

      /**
       * Définit explicitement l'utilisateur courant
       * @param {Object} user
       */
      setUser: (user) => {
        if (!user) return;
        set({
          user,
          currentUser: user,
          role: user.role || get().role,
        });
      },

      /**
       * Met à jour les informations du profil utilisateur
       * @param {Object} updates
       */
      updateUser: (updates) => {
        set((state) => {
          const updated = {
            ...state.user,
            ...updates,
          };
          return {
            user: updated,
            currentUser: updated,
          };
        });
      },

      /**
       * Réinitialise la session au profil par défaut
       */
      resetSession: () => {
        set({
          role: DEFAULT_ACCOUNT.role,
          user: DEFAULT_ACCOUNT.user,
          currentUser: DEFAULT_ACCOUNT.user,
        });
      },
    }),
    {
      name: "besd_session_storage",
    }
  )
);
