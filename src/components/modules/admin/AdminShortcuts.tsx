"use client";

import { useRouter } from "next/navigation";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";

/**
 * Registers admin keyboard shortcuts globally.
 * Renders nothing — pure side-effect client component.
 */
export function AdminShortcuts(): null {
  const router = useRouter();
  useGlobalShortcut("n", () => router.push("/admin/new"));
  return null;
}
