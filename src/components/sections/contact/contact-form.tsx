"use client";

import { useRef, useState, type FormEvent } from "react";
import { contactPage } from "@/content/pages";
import { contact } from "@/content/site";
import { services } from "@/content/services";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const { form } = contactPage;

function Field({ name, label, placeholder, error, type = "text", textarea = false, required = false }: { name: string; label: string; placeholder?: string; error?: string; type?: string; textarea?: boolean; required?: boolean }) {
  const id = `contact-${name}`;
  const shared = {
    id,
    name,
    placeholder,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    className: "para-l w-full border-b border-[color-mix(in_srgb,var(--color-ground)_30%,transparent)] bg-transparent pt-[1rem] pb-[1.2rem] outline-none placeholder:text-[color-mix(in_srgb,var(--color-ground)_30%,transparent)] focus:border-orange transition-colors",
  };
  return (
    <div className="group">
      <label htmlFor={id} className="readout block transition-colors group-focus-within:text-orange">
        {label}
      </label>
      {textarea ? <textarea {...shared} rows={4} className={cn(shared.className, "resize-none")} /> : <input {...shared} type={type} autoComplete={type === "email" ? "email" : name === "name" ? "name" : undefined} />}
      {error && (
        <p id={`${id}-error`} className="para-s mt-[0.8rem] text-orange">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Name, email, company, what they're after (service chips) and a message,
 * posted to /api/contact. Errors sit under their field; success swaps the
 * form for a thank-you and a check mark.
 */
export function ContactForm() {
  const root = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [interests, setInterests] = useState<string[]>([]);

  useGSAP(
    () => {
      if (status !== "sent") return;
      gsap.from("[data-sent] > *", { autoAlpha: 0, yPercent: 40, duration: 1, ease: "move", stagger: 0.08 });
    },
    { scope: root, dependencies: [status] },
  );

  const toggle = (name: string) => setInterests((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setStatus("sending");
    setErrors({});
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, interests }) });
      const result = await response.json();
      if (result.ok) return setStatus("sent");
      if (result.errors) {
        setErrors(result.errors);
        setStatus("idle");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div ref={root}>
      {status === "sent" ? (
        <div data-sent="" role="status" className="grid min-h-[50rem] content-center gap-[2rem]">
          <span aria-hidden className="grid size-[8rem] place-items-center rounded-full bg-orange text-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-[3.2rem]">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          </span>
          <p className="heading-s">{form.success.title}</p>
          <p className="para-l max-w-[40rem] text-mute">{form.success.body}</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-[3.6rem]">
          <div className="grid grid-cols-2 gap-[3.6rem] max-md:grid-cols-1">
            <Field name="name" label={form.name.label} placeholder={form.name.placeholder} error={errors.name} required />
            <Field name="email" type="email" label={form.email.label} placeholder={form.email.placeholder} error={errors.email} required />
          </div>
          <Field name="company" label={form.company.label} placeholder={form.company.placeholder} />
          <fieldset>
            <legend className="readout mb-[1.4rem]">{form.interest.label}</legend>
            <div className="flex flex-wrap gap-[0.8rem]">
              {services.map((service) => {
                const on = interests.includes(service.name);
                return (
                  <button
                    key={service.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(service.name)}
                    className={cn(
                      "readout min-h-11 border px-[1.4rem] py-[0.9rem] transition-[background-color,color,border-color,scale] duration-300 active:scale-95",
                      on ? "border-orange bg-orange text-ink" : "border-[color-mix(in_srgb,var(--color-ground)_30%,transparent)] text-ground hover:border-orange",
                    )}
                  >
                    {on ? "- " : "+ "}
                    {service.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field name="message" label={form.message.label} placeholder={form.message.placeholder} error={errors.message} textarea required />
          {/* Honeypot: hidden from people, irresistible to bots. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-[2.4rem]">
            <button type="submit" disabled={status === "sending"} className="pill-button pill-button--orange pill-button--large disabled:opacity-60">
              <span className="pill-button__dots" aria-hidden>
                <span className="pill-button__dot" />
              </span>
              <span className="pill-button__label">
                <span className="pill-button__text">{status === "sending" ? form.sending : form.submit}</span>
              </span>
            </button>
            {status === "error" && (
              <p role="alert" className="para-m max-w-[40rem] text-orange">
                {form.error} <a href={`mailto:${contact.email}`} className="underline">{contact.email}</a>
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
