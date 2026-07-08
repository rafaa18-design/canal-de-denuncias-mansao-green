"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { consultarProtocolo, type ConsultaState } from "../../actions";

function BotaoConsultar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary shrink-0">
      {pending ? "…" : "Ver"}
    </button>
  );
}

export function ConsultaProtocolo() {
  const [state, formAction] = useActionState<ConsultaState, FormData>(
    consultarProtocolo,
    null,
  );
  const resultadoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state) resultadoRef.current?.focus();
  }, [state]);

  return (
    <div className="space-y-5">
      <form action={formAction} className="flex gap-2.5">
        <input
          type="text"
          name="protocolo"
          required
          translate="no"
          placeholder="MG-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="characters"
          className="input-field font-mono uppercase tracking-[0.12em]"
        />
        <BotaoConsultar />
      </form>

      <div
        ref={resultadoRef}
        tabIndex={-1}
        aria-live="polite"
        className="focus:outline-none"
      >
        {state && !state.ok && (
          <p
            role="alert"
            className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
          >
            {state.erro}
          </p>
        )}

        {state?.ok && (
          <div className="section-card animate-slide-up overflow-hidden">
            <div className="border-b border-edge bg-primary/5 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Registrada em {state.criadaEm}
              </p>
              <p className="mt-1.5 text-xl font-extrabold text-content">
                {state.statusPublico}
              </p>
            </div>
            {state.respostaPublica && (
              <div className="px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-content-secondary">
                  Resposta da equipe
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-content">
                  {state.respostaPublica}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
