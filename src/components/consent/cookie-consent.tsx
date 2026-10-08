"use client";

import Link from "next/link";
import { useLenis } from "lenis/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cookieCopy } from "@/content/legal";
import {
  ESSENTIAL_ONLY,
  EVERYTHING,
  onOpenCookiePreferences,
  privacySignal,
  saveConsent,
  useConsent,
  type ConsentChoice,
} from "@/lib/consent";
import { applyConsent } from "@/lib/consent-scripts";
import { gsap, useGSAP } from "@/lib/gsap";
import { whenPageReady } from "@/lib/page-ready";
import { cn } from "@/lib/utils";
import { Cookie } from "./cookie";

const { banner, signal: signalCopy, dialog: dialogCopy, rows } = cookieCopy;

/** Seconds after the page entrance before the banner floats in */
const BANNER_DELAY = 1.4;

const noSubscribe = () => () => {};
const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Switch({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange?: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-[2.8rem] min-h-6 w-[5.2rem] min-w-11 shrink-0 rounded-full border transition-colors duration-300 disabled:cursor-not-allowed",
        checked ? "border-orange bg-orange" : "border-[color-mix(in_srgb,var(--color-ground)_35%,transparent)] bg-transparent",
        disabled && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-[0.35rem] size-[2rem] -translate-y-1/2 rounded-full transition-[translate,background-color] duration-500 ease-(--ease-osmo)",
          checked ? "translate-x-[2.3rem] bg-ink" : "bg-ground",
        )}
      />
    </button>
  );
}

const button = "min-h-11 px-[1.6rem] py-[1rem] text-[max(1rem,12px)] leading-none font-semibold uppercase tracking-[-0.01em] transition-[background-color,color,border-color,scale] duration-300 active:scale-[0.97]";
const ghost = cn(button, "border border-[color-mix(in_srgb,var(--color-ground)_30%,transparent)] text-ground hover:border-orange hover:text-orange");
const solid = cn(button, "bg-orange text-ink hover:bg-ground");

/**
 * The cookie banner and the preferences dialog (docs/specs/pages/legal.md),
 * in the root layout. The banner floats in after the page entrance until the
 * visitor chooses; the dialog opens from it, from the footer or from the
 * privacy page. Choosing makes the cookie take a bite before the banner
 * drops away. Analytics and marketing scripts follow the saved choice
 * (src/lib/consent-scripts.ts), switching on and off live.
 */
export function CookieConsent() {
  const consent = useConsent();
  const signal = useSyncExternalStore(noSubscribe, privacySignal, () => false);
  const lenis = useLenis();

  const card = useRef<HTMLDivElement>(null);
  const cookie = useRef<SVGSVGElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentChoice>(ESSENTIAL_ONLY);
  const [toast, setToast] = useState(false);

  // Scripts follow the choice, including a change made in another tab.
  useEffect(() => {
    if (consent !== undefined) applyConsent(consent);
  }, [consent]);

  // Wait for the launch intro, then a beat.
  useEffect(() => {
    let timer = 0;
    let cancelled = false;
    whenPageReady().then(({ clearIn }) => {
      if (!cancelled) timer = window.setTimeout(() => setReady(true), (clearIn + BANNER_DELAY) * 1000);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const showBanner = ready && consent === null;

  // Float in: the card rises, the cookie rolls in.
  useGSAP(
    () => {
      if (!showBanner || reduced()) return;
      gsap.fromTo(card.current, { yPercent: 120, rotate: -4 }, { yPercent: 0, rotate: 0, duration: 1.2, ease: "move" });
      gsap.fromTo(cookie.current, { x: "-12rem", rotate: -240 }, { x: 0, rotate: 0, duration: 1.4, ease: "move", delay: 0.15 });
      gsap.to(cookie.current, { rotate: "+=360", duration: 40, ease: "none", repeat: -1, delay: 1.6 });
    },
    { dependencies: [showBanner] },
  );

  const announce = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2800);
  };

  /** Saves a choice; if the banner is up, the cookie takes its bites and the card drops first. */
  const choose = useCallback(
    (choice: ConsentChoice, { quiet = false } = {}) => {
      if (!showBanner || reduced() || !card.current) {
        saveConsent(choice);
        if (!quiet) announce();
        return;
      }
      setLeaving(true);
      const bites = card.current.querySelectorAll("[data-bite]");
      // The more you accept, the more cookie gets eaten.
      const count = choice.analytics && choice.marketing ? 3 : choice.analytics || choice.marketing || choice.preferences ? 2 : 1;
      gsap
        .timeline({
          onComplete: () => {
            saveConsent(choice);
            setLeaving(false);
          },
        })
        .to(gsap.utils.toArray(bites).slice(0, count), { attr: { r: 15 }, duration: 0.22, ease: "back.out(3)", stagger: 0.18 })
        .to(cookie.current, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, 0)
        .to(card.current, { yPercent: 130, rotate: 5, duration: 0.8, ease: "move" }, "+=0.25");
    },
    [showBanner],
  );

  // The dialog: open from anywhere, starting from the current choice.
  const openDialog = useCallback(() => {
    setDraft(consent ?? { ...ESSENTIAL_ONLY, doNotSell: signal });
    setOpen(true);
  }, [consent, signal]);

  useEffect(() => onOpenCookiePreferences(openDialog), [openDialog]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      lenis?.stop();
      if (!reduced()) {
        gsap.fromTo(element, { yPercent: 8, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "osmo" });
        gsap.fromTo(element.querySelectorAll("[data-row]"), { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "osmo", stagger: 0.05, delay: 0.1 });
      }
    }
    if (!open && element.open) element.close();
    if (!open) lenis?.start();
  }, [open, lenis]);

  const closeAnd = (choice?: ConsentChoice) => {
    setOpen(false);
    if (choice) choose(choice, { quiet: showBanner });
  };

  const set = (key: keyof ConsentChoice, value: boolean) =>
    setDraft((current) => {
      const next = { ...current, [key]: value };
      // Selling or sharing off means no marketing; marketing on means sharing is allowed.
      if (key === "doNotSell" && value) next.marketing = false;
      if (key === "marketing" && value) next.doNotSell = false;
      return next;
    });

  const copy = signal ? signalCopy : banner;

  return (
    <>
      {(showBanner || leaving) && (
        <div
          ref={card}
          role="region"
          aria-label={copy.eyebrow}
          style={{ viewTransitionName: "cookie-banner" }}
          className="fixed bottom-[1.6rem] left-(--page-padding) z-[55] w-[46rem] max-w-[calc(100vw-2*var(--page-padding))] bg-black p-[2.4rem] text-ground shadow-[0_2rem_6rem_-1rem_rgb(0_0_0/0.6)] ring-1 ring-[color-mix(in_srgb,var(--color-ground)_10%,transparent)] max-sm:bottom-(--page-padding) max-sm:p-[1.8rem]"
        >
          <div className="flex items-start gap-[1.8rem]">
            <Cookie ref={cookie} className="size-[6.4rem] shrink-0 max-sm:size-[4.8rem]" />
            <div>
              <p className="readout text-orange">{copy.eyebrow}</p>
              <p className="heading-xs mt-[0.8rem] text-[max(var(--heading-xs),20px)] leading-[1.05]">{copy.title}</p>
            </div>
          </div>
          <p className="para-s mt-[1.6rem] text-mute">
            {copy.body}{" "}
            <Link href={banner.privacy.href} className="text-ground underline decoration-orange underline-offset-4 hover:text-orange">
              {banner.privacy.label}
            </Link>
          </p>
          <div className="mt-[2rem] flex flex-wrap gap-[0.8rem]">
            {signal ? (
              <>
                <button type="button" className={ghost} onClick={openDialog} disabled={leaving}>
                  {signalCopy.choose}
                </button>
                <button type="button" className={solid} onClick={() => choose(ESSENTIAL_ONLY, { quiet: true })} disabled={leaving}>
                  {signalCopy.ok}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={ghost} onClick={() => choose(ESSENTIAL_ONLY, { quiet: true })} disabled={leaving}>
                  {banner.essentials}
                </button>
                <button type="button" className={ghost} onClick={openDialog} disabled={leaving}>
                  {banner.choose}
                </button>
                <button type="button" className={solid} onClick={() => choose(EVERYTHING, { quiet: true })} disabled={leaving}>
                  {banner.accept}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="cookie-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => event.target === event.currentTarget && setOpen(false)}
        data-lenis-prevent
        className="cookie-dialog m-auto max-h-[min(90svh,72rem)] w-[64rem] max-w-[calc(100vw-2*var(--page-padding))] overflow-y-auto bg-ink p-0 text-ground"
      >
        <div className="p-[3.2rem] max-sm:p-[2rem]">
          <div className="flex items-start justify-between gap-[2rem]">
            <div>
              <p className="readout text-orange">{dialogCopy.eyebrow}</p>
              <h2 id="cookie-dialog-title" className="heading-s mt-[1rem]">
                {dialogCopy.title}
              </h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid size-[4.4rem] min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-ground)_30%,transparent)] transition-colors hover:border-orange hover:text-orange">
              <span className="sr-only">{dialogCopy.close}</span>
              <svg viewBox="0 0 19 20" aria-hidden className="w-[1.3rem] fill-current">
                <path d="M18.5 19.1c-.4.4-1 .4-1.3 0L9.4 11.3l-7.8 7.8c-.4.4-1 .4-1.3 0-.4-.4-.4-1 0-1.3L8 10 .3 2.2C-.1 1.9-.1 1.2.3.9c.4-.4 1-.4 1.3 0l7.8 7.8L17.1.9c.4-.4 1-.4 1.3 0 .4.4.4 1 0 1.3L10.7 10l7.8 7.8c.4.4.4 1 0 1.3z" />
              </svg>
            </button>
          </div>
          <p className="para-m mt-[1.6rem] max-w-[48rem] text-mute">{dialogCopy.lede}</p>
          {signal && <p className="para-s mt-[1.2rem] border-l border-orange pl-[1.2rem] text-ground">{dialogCopy.signal}</p>}

          <ul className="mt-[2.4rem] border-t border-[color-mix(in_srgb,var(--color-ground)_14%,transparent)]">
            {rows.map((row) => {
              const essential = row.key === "essential";
              const checked = essential ? true : draft[row.key];
              return (
                <li key={row.key} data-row="" className="flex items-center justify-between gap-[2.4rem] border-b border-[color-mix(in_srgb,var(--color-ground)_14%,transparent)] py-[2rem]">
                  <div>
                    <p className="flex flex-wrap items-baseline gap-x-[1rem] gap-y-[0.4rem]">
                      <span className="text-[max(1.5rem,17px)] font-semibold">{row.name}</span>
                      <span className="readout">{row.kind}</span>
                    </p>
                    <p className="para-s mt-[0.6rem] max-w-[42rem] text-mute">{row.body}</p>
                  </div>
                  <Switch
                    label={`${row.name}, ${row.kind}`}
                    checked={checked}
                    disabled={essential}
                    onChange={(next) => !essential && set(row.key, next)}
                  />
                </li>
              );
            })}
          </ul>

          <div className="mt-[2.4rem] flex flex-wrap justify-end gap-[0.8rem]">
            <button type="button" className={ghost} onClick={() => closeAnd(ESSENTIAL_ONLY)}>
              {dialogCopy.essentials}
            </button>
            <button type="button" className={ghost} onClick={() => closeAnd(EVERYTHING)}>
              {dialogCopy.accept}
            </button>
            <button type="button" className={solid} onClick={() => closeAnd(draft)}>
              {dialogCopy.save}
            </button>
          </div>
        </div>
      </dialog>

      <div
        role="status"
        className={cn(
          "pointer-events-none fixed bottom-[1.6rem] left-(--page-padding) z-[56] flex items-center gap-[1rem] bg-black px-[1.6rem] py-[1.2rem] text-[max(1rem,13px)] font-semibold text-ground transition-[opacity,translate] duration-500 ease-(--ease-osmo)",
          toast ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0",
        )}
      >
        {toast && (
          <>
            <span aria-hidden className="size-[0.8rem] rounded-full bg-orange" />
            {cookieCopy.saved}
          </>
        )}
      </div>
    </>
  );
}
