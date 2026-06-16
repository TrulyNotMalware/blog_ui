"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      themes={["light", "dark"]}
      // enableSystem lets next-themes resolve the "system"/auto choice to
      // data-theme="light"|"dark" via prefers-color-scheme before paint.
      // tokens.css uses :root,[data-theme="dark"] as dark fallback so an unknown
      // data-theme never leaves --bg/--ink undefined.
      enableSystem
      disableTransitionOnChange
      storageKey="notypiedev-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
