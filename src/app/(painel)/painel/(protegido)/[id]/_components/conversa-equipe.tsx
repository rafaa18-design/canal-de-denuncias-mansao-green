"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { responderDenunciante } from "../actions";

type Mensagem = {
  id: string;
  autoria: "DENUNCIANTE" | "EQUIPE";
  autorNome: string | null;
  corpo: string;
  quando: string;
};

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary px-4 py-2 text-sm"
    >
      {pending ? "Enviando…" : "Enviar ao denunciante"}
    </button>
  );
}

export function ConversaEquipe({
  denunciaId,
  mensagens,
}: {
  denunciaId: string;
  mensagens: Mensagem[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="section-card p-5">
      <p className="mb-4 text-xs uppercase tracking-[0.14em] text-content-secondary">
        Conversa com o denunciante (anônima)
      </p>

      {mensagens.length === 0 ? (
        <p className="text-sm text-content-tertiary">
          Nenhuma mensagem ainda. Use o campo abaixo para iniciar um diálogo
          anônimo — o denunciante lê e responde pelo protocolo.
        </p>
      ) : (
        <ul className="space-y-3">
          {mensagens.map((m) => {
            const daEquipe = m.autoria === "EQUIPE";
            return (
              <li
                key={m.id}
                className={`flex ${daEquipe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    daEquipe
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "bg-canvas-subtle ring-1 ring-edge"
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold text-content-secondary">
                    {daEquipe
                      ? `Equipe · ${m.autorNome ?? "—"}`
                      : "Denunciante"}
                    <span className="ml-2 font-normal text-content-tertiary">
                      {m.quando}
                    </span>
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-content">
                    {m.corpo}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        ref={formRef}
        action={async (fd) => {
          await responderDenunciante(fd);
          formRef.current?.reset();
        }}
        className="mt-4 space-y-2"
      >
        <input type="hidden" name="denunciaId" value={denunciaId} />
        <textarea
          name="corpo"
          rows={3}
          maxLength={4000}
          required
          placeholder="Escreva uma mensagem para o denunciante…"
          className="input-field resize-y"
        />
        <BotaoEnviar />
      </form>
    </div>
  );
}
