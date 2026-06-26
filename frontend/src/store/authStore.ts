import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { useAppStore } from './index';
import { apiLogin, apiRegister } from '@/api/client';

// ── Helpers ───────────────────────────────────────────────────

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

          const data = await apiLogin(email.trim().toLowerCase(), password);

          const user: User = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          };

          set({ user, token: data.token, isLoading: false, error: null });

          // Hydrate app data after login
          useAppStore.getState().hydrate();

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

          const data = await apiRegister(trimmedName, email.trim().toLowerCase(), password);

          const user: User = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          };

          set({ user, token: data.token, isLoading: false, error: null });

          // Hydrate app data after registration
          useAppStore.getState().hydrate();

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
        // Clear app data to prevent data leakage between users
        useAppStore.setState({
          items: [],
          categories: [
            { id: 'cat-1', name: 'Work', color: '#3b82f6', icon: 'briefcase', createdAt: new Date().toISOString() },
            { id: 'cat-2', name: 'Personal', color: '#10b981', icon: 'user', createdAt: new Date().toISOString() },
            { id: 'cat-3', name: 'Learning', color: '#f59e0b', icon: 'book-open', createdAt: new Date().toISOString() },
            { id: 'cat-4', name: 'Health', color: '#ef4444', icon: 'heart', createdAt: new Date().toISOString() },
            { id: 'cat-5', name: 'Finance', color: '#8b5cf6', icon: 'dollar-sign', createdAt: new Date().toISOString() },
            { id: 'cat-6', name: 'Home', color: '#ec4899', icon: 'home', createdAt: new Date().toISOString() },
            { id: 'cat-7', name: 'Travel', color: '#06b6d4', icon: 'map', createdAt: new Date().toISOString() },
          ],
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'second-brain-auth',
      version: 2,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
