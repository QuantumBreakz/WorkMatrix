import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of our store
interface AppState {
  // Auth state
  isAuthenticated: boolean;
  user: any | null;
  setUser: (user: any | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Reset store
  reset: () => void;
}

// Create the store with persistence
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth state
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      // UI state
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      error: null,
      setError: (error) => set({ error }),

      // Theme state
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // Reset store
      reset: () =>
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
          theme: 'light',
        }),
    }),
    {
      name: 'app-storage', // unique name for localStorage
      partialize: (state) => ({
        theme: state.theme,
        // Don't persist sensitive data
        // isAuthenticated: state.isAuthenticated,
        // user: state.user,
      }),
    }
  )
); 
