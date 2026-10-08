"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Media as MediaData } from "@/content/projects";
import { useReducedMotion } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

/** Video posters go through Next's image optimizer too (WebP or AVIF, 1200px; 1200 is one of its default widths). */
const optimized = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=75`;

type MediaProps = {
  media: MediaData;
  alt?: string;
  sizes?: string;
  /** Fill the parent (object-cover) instead of keeping the intrinsic ratio */
  fill?: boolean;
  priority?: boolean;
  className?: string;
};

/**
 * An image or a silent looping video from the case studies. Videos play only
 * while on screen; with reduced motion they show their poster frame.
 */
export function Media({ media, alt = "", sizes = "100vw", fill = false, priority = false, className }: MediaProps) {
  const video = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = video.current;
    if (!element || reducedMotion) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) element.play().catch(() => {});
      else element.pause();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const fit = fill ? "absolute inset-0 h-full w-full object-cover" : "h-auto w-full";

  if (media.type === "video") {
    return (
      <video
        ref={video}
        src={reducedMotion ? undefined : media.src}
        poster={optimized(media.poster)}
        width={media.width}
        height={media.height}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn(fit, className)}
      />
    );
  }

  return fill ? (
    <Image src={media.src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />
  ) : (
    <Image src={media.src} alt={alt} width={media.width} height={media.height} sizes={sizes} priority={priority} className={cn(fit, className)} />
  );
}
