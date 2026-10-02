import { cn } from "@/lib/utils";

/** The Skyline "S." mark (public/brand/logo-mark.svg), drawn in the current text color. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 610.3 552.1" fill="currentColor" aria-hidden className={cn("block", className)}>
      <path d="M214.4,536.5c118.4,0,227.3-71.7,238.1-158.9c16.8-130.2-111.3-147-178.2-160.1c-26.3-3.6-102.9-3.6-98.1-44.2c4.8-33.4,44.3-59.8,87.3-59.8c64.6,0,81.4,26.3,80.2,38.2h122c8.3-65.7-50.3-136.2-189.1-136.2c-114.8,0-216.5,71.7-228.5,158.9c-12,93.2,82.6,118.3,138.8,130.2c32.3,7.1,145.9,10.7,137.6,74.1c-3.6,31-50.2,58.6-96.9,58.6c-87.3,0-83.8-65.7-83.8-66.9h-128C7.5,437.4,63.6,536.5,214.4,536.5z M466.4,536.5h114.7l15.5-112.9H482L466.4,536.5z" />
    </svg>
  );
}
