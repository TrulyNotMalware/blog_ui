"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      themes={["light", "dark"]}
      // The UI exposes a "system"/auto option (MobileMenu). With enableSystem the
      // "system" choice resolves to data-theme="light"|"dark" via prefers-color-scheme;
      // without it, next-themes wrote data-theme="system", which matched no token
      // block in tokens.css and left every --bg/--ink var undefined → broken colors.
      enableSystem
      disableTransitionOnChange
      storageKey="notypiedev-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
