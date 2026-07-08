"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { criarDenuncia, type CriarDenunciaState } from "../actions";

type Categoria = { id: string; nome: string; descricao: string | null };

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full py-3.5"
    >
      {pending ? "Enviando…" : "Enviar anonimamente"}
    </button>
  );
}

function SucessoProtocolo({ protocolo }: { protocolo: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="section-card animate-scale-in overflow-hidden focus:outline-none"
    >
      <div className="px-7 py-8 text-center">
        <span
          aria-hidden
          className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h2 className="mt-4 text-xl font-extrabold text-content">
          Pronto. Você foi ouvido.
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
          Sua mensagem foi registrada com segurança e de forma anônima.
        </p>

        <div className="mt-6 rounded-xl border border-primary/15 bg-primary/8 px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Seu protocolo
          </p>
          <p
            translate="no"
            className="mt-2 select-all font-mono text-2xl font-extrabold tracking-[0.12em] text-primary"
          >
            {protocolo}
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-content-secondary">
          Guarde este número. É a{" "}
          <strong className="font-bold text-content">única forma</strong> de
          acompanhar — não dá pra recuperar depois.
        </p>
      </div>

      <Link
        href="/acompanhar"
        className="block border-t border-edge py-3.5 text-center text-sm font-bold text-primary transition hover:bg-canvas-subtle"
      >
        Acompanhar pelo protocolo →
      </Link>
    </div>
  );
}

export function FormularioDenuncia({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const [state, formAction] = useActionState<CriarDenunciaState, FormData>(
    criarDenuncia,
    null,
  );
  const erroRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state && !state.ok) erroRef.current?.focus();
  }, [state]);

  if (state?.ok) return <SucessoProtocolo protocolo={state.protocolo} />;

  return (
    <form
      action={formAction}
      className="section-card space-y-6 px-6 py-7 sm:px-7"
    >
      {/* Honeypot anti-spam: invisível e fora do fluxo de foco. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Não preencha este campo</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="categoriaId" className="field-label">
          Sobre o que é?
        </label>
        <select
          id="categoriaId"
          name="categoriaId"
          required
          defaultValue=""
          className="input-field mt-2"
        >
          <option value="" disabled>
            Escolha uma opção…
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="relato" className="field-label">
          O que aconteceu?
        </label>
        <textarea
          id="relato"
          name="relato"
          required
          rows={7}
          minLength={10}
          maxLength={5000}
          placeholder="Escreva o que quiser, do seu jeito. Ninguém vai saber quem é você…"
          className="input-field mt-2 resize-y leading-relaxed"
        />
      </div>

      {state && !state.ok && (
        <p
          ref={erroRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger focus:outline-none"
        >
          {state.erro}
        </p>
      )}

      <BotaoEnviar />

      <p className="text-center text-xs text-content-secondary">
        Não escreva seu nome nem contato — este canal é anônimo de propósito.
      </p>
    </form>
  );
}
