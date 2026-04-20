"use client";

import { FormEvent, useState } from "react";

const WHATSAPP_HREF = "https://wa.me/573107673832";
const INSTAGRAM_HREF = "https://www.instagram.com/vanessaq_makeup/";

export function PortfolioContactSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  function clearSuccess() {
    if (status === "ok") {
      setStatus("idle");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("err");
        setErrMsg(typeof json.error === "string" ? json.error : "No se pudo enviar.");
        return;
      }
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("err");
      setErrMsg("Error de red. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="mt-24 border-t border-border pt-16">
      <p className="text-sm uppercase tracking-[0.25em] text-accent">Contacto</p>
      <h3 className="font-serif-display mt-3 text-3xl leading-tight md:text-4xl">
        Escríbeme por WhatsApp, Instagram o correo
      </h3>
      <p className="mt-4 max-w-xl text-sm text-muted">
        Respondo consultas de proyectos, colaboraciones y disponibilidad.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border border-emerald-600/60 bg-emerald-950/30 px-8 py-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-500 hover:bg-emerald-950/50"
        >
          Chatear en WhatsApp
        </a>
        <a
          href={INSTAGRAM_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border border-border px-8 py-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
        >
          Instagram @vanessaq_makeup
        </a>
      </div>

      <form
        className="mt-12 max-w-xl space-y-6"
        onSubmit={onSubmit}
        onInput={clearSuccess}
        noValidate
      >
        {status === "ok" ? (
          <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
            Mensaje enviado. Te responderé pronto por correo.
          </div>
        ) : null}
        {status === "err" && errMsg ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-100">
            {errMsg}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted">Nombre</span>
            <input
              name="name"
              required
              autoComplete="name"
              disabled={status === "loading"}
              className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent disabled:opacity-60"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Correo electrónico</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={status === "loading"}
              className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent disabled:opacity-60"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-muted">Mensaje</span>
          <textarea
            name="message"
            required
            rows={5}
            minLength={10}
            disabled={status === "loading"}
            placeholder="Cuéntame sobre tu proyecto o consulta…"
            className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="border border-accent bg-accent px-8 py-3 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent disabled:opacity-60"
        >
          {status === "loading" ? "Enviando…" : "Enviar por correo"}
        </button>
      </form>
    </div>
  );
}
