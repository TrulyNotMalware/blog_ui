import { create } from "zustand";

interface UIState {
  isSearchOpen: boolean;
  searchQuery: string;
  isMobileMenuOpen: boolean;
  openSearch: (query?: string) => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  searchQuery: "",
  isMobileMenuOpen: false,
  openSearch: (query) =>
    set((state) => ({ isSearchOpen: true, searchQuery: query ?? state.searchQuery })),
  closeSearch: () => set({ isSearchOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
}));
