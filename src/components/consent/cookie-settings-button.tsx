"use client";

import { openCookiePreferences } from "@/lib/consent";
import { cn } from "@/lib/utils";

/** Opens the cookie preferences dialog (footer, privacy page). */
export function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={openCookiePreferences} className={cn("transition-colors hover:text-orange", className)}>
      {label}
    </button>
  );
}
