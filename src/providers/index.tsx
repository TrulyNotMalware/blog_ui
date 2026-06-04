"use client";

import type { ReactNode } from "react";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchModal } from "@/components/layout/SearchModal";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <KeyboardShortcuts />
        <SearchModal />
        <MobileMenu />
      </QueryProvider>
    </ThemeProvider>
  );
}
