"use client";

import type { Consent } from "./consent";

// Third-party scripts that need consent, loaded only after a yes and switched
// off again on a no. Each one is optional: without its ID in the environment
// it never loads. Set them in Vercel:
//   NEXT_PUBLIC_GA_ID          Google Analytics 4 (analytics)
//   NEXT_PUBLIC_META_PIXEL_ID  Meta Pixel (marketing)

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: unknown };
type ConsentWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag; fbq?: Fbq; _fbq?: Fbq } & Record<string, unknown>;

const w = () => window as unknown as ConsentWindow;

function inject(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Expires every cookie whose name matches, on this host and its parent domains. */
function clearCookies(pattern: RegExp) {
  const parts = location.hostname.split(".");
  const domains = parts.map((_, index) => parts.slice(index).join(".")).filter((domain) => domain.includes(".") || domain === "localhost");
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (!pattern.test(name)) return;
    const expire = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = expire;
    domains.forEach((domain) => (document.cookie = `${expire}; domain=.${domain}`));
  });
}

// Google Analytics with Consent Mode: everything denied by default, granted per choice.
let gaReady = false;
function analytics(on: boolean) {
  if (!GA_ID) return;
  const win = w();
  win[`ga-disable-${GA_ID}`] = !on;
  if (!gaReady && on) {
    win.dataLayer = win.dataLayer ?? [];
    win.gtag = function gtag() {
      // gtag.js expects the arguments object itself.
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments);
    };
    win.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    win.gtag("js", new Date());
    win.gtag("config", GA_ID, { anonymize_ip: true });
    inject(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    gaReady = true;
  }
  if (!gaReady) return;
  win.gtag?.("consent", "update", { analytics_storage: on ? "granted" : "denied" });
  if (!on) clearCookies(/^_ga/);
}

// Meta Pixel, revoked and cookie-cleared on a no.
let metaReady = false;
function marketing(on: boolean) {
  if (!META_ID) return;
  const win = w();
  if (!metaReady && on) {
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    win.fbq = win._fbq = fbq;
    inject("https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", META_ID);
    fbq("track", "PageView");
    metaReady = true;
  }
  if (!metaReady) return;
  win.fbq?.("consent", on ? "grant" : "revoke");
  if (!on) clearCookies(/^_fb/);
}

/** Brings the running scripts in line with a choice (null: nothing chosen yet, so nothing runs). */
export function applyConsent(consent: Consent | null) {
  analytics(Boolean(consent?.analytics));
  marketing(Boolean(consent?.marketing && !consent.doNotSell));
}
