import { create } from 'zustand';
import { ThemeMode } from '../constants/colors';

export type TaskSortOption = 'my_order' | 'date' | 'title';

interface UIState {
  theme: ThemeMode;
  selectedListId: string;
  selectedTaskId: string | null;
  isSidebarOpen: boolean;
  isMobileDrawerOpen: boolean;
  isCreateListModalOpen: boolean;
  isRepeatModalOpen: boolean;
  isSettingsModalOpen: boolean;
  searchQuery: string;
  sortBy: TaskSortOption;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSelectedListId: (listId: string) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setCreateListModalOpen: (open: boolean) => void;
  setRepeatModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: TaskSortOption) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cleartasks_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  selectedListId: '',
  selectedTaskId: null,
  isSidebarOpen: true,
  isMobileDrawerOpen: false,
  isCreateListModalOpen: false,
  isRepeatModalOpen: false,
  isSettingsModalOpen: false,
  searchQuery: '',
  sortBy: 'my_order',

  setTheme: (theme) => {
    localStorage.setItem('cleartasks_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('cleartasks_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: next };
    }),

  setSelectedListId: (selectedListId) => set({ selectedListId }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setMobileDrawerOpen: (isMobileDrawerOpen) => set({ isMobileDrawerOpen }),
  setCreateListModalOpen: (isCreateListModalOpen) => set({ isCreateListModalOpen }),
  setRepeatModalOpen: (isRepeatModalOpen) => set({ isRepeatModalOpen }),
  setSettingsModalOpen: (isSettingsModalOpen) => set({ isSettingsModalOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
