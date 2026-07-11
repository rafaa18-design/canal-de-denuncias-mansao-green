"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  consultarProtocolo,
  responderComoDenunciante,
  type ConsultaState,
  type MensagemPublica,
} from "../../actions";

function BotaoConsultar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary shrink-0">
      {pending ? "…" : "Ver"}
    </button>
  );
}

function BotaoResponder() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary px-4 py-2 text-sm"
    >
      {pending ? "Enviando…" : "Enviar mensagem"}
    </button>
  );
}

function Conversa({ mensagens }: { mensagens: MensagemPublica[] }) {
  if (mensagens.length === 0) return null;
  return (
    <ul className="space-y-3">
      {mensagens.map((m) => (
        <li
          key={m.id}
          className={`flex ${m.daEquipe ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              m.daEquipe
                ? "bg-primary/10 ring-1 ring-primary/20"
                : "bg-canvas-subtle ring-1 ring-edge"
            }`}
          >
            <p className="mb-1 text-[11px] font-semibold text-content-secondary">
              {m.daEquipe ? "Equipe" : "Você"}
              <span className="ml-2 font-normal text-content-tertiary">
                {m.quando}
              </span>
            </p>
            <p className="whitespace-pre-wrap leading-relaxed text-content">
              {m.corpo}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PainelResposta({
  protocolo,
  mensagensIniciais,
}: {
  protocolo: string;
  mensagensIniciais: MensagemPublica[];
}) {
  const [mensagens, setMensagens] =
    useState<MensagemPublica[]>(mensagensIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // setState roda dentro do handler async da action (não em useEffect):
  // atualiza a conversa e limpa o campo só em caso de sucesso.
  async function enviar(formData: FormData) {
    const res = await responderComoDenunciante(null, formData);
    if (res?.ok) {
      setMensagens(res.mensagens);
      setErro(null);
      formRef.current?.reset();
    } else {
      setErro(res?.erro ?? "Não foi possível enviar. Tente novamente.");
    }
  }

  return (
    <div className="section-card p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-content-secondary">
        Conversa com a equipe
      </p>

      {mensagens.length === 0 ? (
        <p className="text-sm text-content-tertiary">
          Ainda sem mensagens. Se quiser complementar sua denúncia ou responder
          à equipe, escreva abaixo — segue 100% anônimo.
        </p>
      ) : (
        <Conversa mensagens={mensagens} />
      )}

      <form ref={formRef} action={enviar} className="mt-4 space-y-2">
        <input type="hidden" name="protocolo" value={protocolo} />
        <textarea
          name="corpo"
          rows={3}
          maxLength={4000}
          required
          placeholder="Escreva uma mensagem para a equipe…"
          className="input-field resize-y"
        />
        {erro && (
          <p
            role="alert"
            className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger"
          >
            {erro}
          </p>
        )}
        <BotaoResponder />
      </form>
    </div>
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
        className="space-y-5 focus:outline-none"
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
          <>
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

            <PainelResposta
              key={state.protocolo}
              protocolo={state.protocolo}
              mensagensIniciais={state.mensagens}
            />
          </>
        )}
      </div>
    </div>
  );
}
