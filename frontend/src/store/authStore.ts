import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';

// ── Helpers ───────────────────────────────────────────────────

function mockJwtToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  );
  const signature = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `${header}.${payload}.${signature}`;
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(trimmed)) return 'Please enter a valid email address';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

function mockDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Store interface ───────────────────────────────────────────

interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed (via get)
  isAuthenticated: () => boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

// ── Store ─────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      isAuthenticated: () => {
        const state = get();
        return state.token !== null && state.user !== null;
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          await mockDelay(800);

          const emailError = validateEmail(email);
          if (emailError) {
            set({ isLoading: false, error: emailError });
            return { success: false, error: emailError };
          }

          const passwordError = validatePassword(password);
          if (passwordError) {
            set({ isLoading: false, error: passwordError });
            return { success: false, error: passwordError };
          }

          const trimmedEmail = email.trim().toLowerCase();
          const nameFromEmail = trimmedEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
          const displayName =
            nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

          const user: User = {
            id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: displayName,
            email: trimmedEmail,
            avatar: undefined,
          };

          const token = mockJwtToken(user.id);

          set({ user, token, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'An unexpected error occurred';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          await mockDelay(800);

          const trimmedName = name.trim();
          if (!trimmedName) {
            set({ isLoading: false, error: 'Name is required' });
            return { success: false, error: 'Name is required' };
          }

          const emailError = validateEmail(email);
          if (emailError) {
            set({ isLoading: false, error: emailError });
            return { success: false, error: emailError };
          }

          const passwordError = validatePassword(password);
          if (passwordError) {
            set({ isLoading: false, error: passwordError });
            return { success: false, error: passwordError };
          }

          const trimmedEmail = email.trim().toLowerCase();

          const user: User = {
            id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: trimmedName,
            email: trimmedEmail,
            avatar: undefined,
          };

          const token = mockJwtToken(user.id);

          set({ user, token, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'An unexpected error occurred';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      logout: () => {
        set({ user: null, token: null, isLoading: false, error: null });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'second-brain-auth',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
