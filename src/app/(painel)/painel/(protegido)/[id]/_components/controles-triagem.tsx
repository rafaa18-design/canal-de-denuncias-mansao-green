"use client";

import { useFormStatus } from "react-dom";
import { STATUS_META, STATUS_ORDEM } from "@/lib/status";
import type { StatusDenuncia } from "@/generated/prisma/client";
import { adicionarNota, definirRespostaPublica, mudarStatus } from "../actions";

function Enviar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary px-4 py-2 text-sm"
    >
      {pending ? "Salvando…" : label}
    </button>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-card p-5">
      <p className="mb-3 text-xs uppercase tracking-[0.14em] text-content-secondary">
        {titulo}
      </p>
      {children}
    </div>
  );
}

export function ControlesTriagem({
  denunciaId,
  statusAtual,
  respostaAtual,
}: {
  denunciaId: string;
  statusAtual: StatusDenuncia;
  respostaAtual: string | null;
}) {
  return (
    <div className="space-y-4">
      <Secao titulo="Status">
        <form
          action={mudarStatus}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="denunciaId" value={denunciaId} />
          <select
            key={statusAtual}
            name="status"
            defaultValue={statusAtual}
            className="input-field w-auto py-2"
          >
            {STATUS_ORDEM.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].rotulo}
              </option>
            ))}
          </select>
          <Enviar label="Aplicar status" />
        </form>
      </Secao>

      <Secao titulo="Nota interna (não visível ao denunciante)">
        <form action={adicionarNota} className="space-y-2">
          <input type="hidden" name="denunciaId" value={denunciaId} />
          <textarea
            name="nota"
            rows={3}
            maxLength={2000}
            placeholder="Anotação de triagem…"
            className="input-field resize-y"
          />
          <Enviar label="Adicionar nota" />
        </form>
      </Secao>

      <Secao titulo="Resposta pública (visível na consulta por protocolo)">
        <form action={definirRespostaPublica} className="space-y-2">
          <input type="hidden" name="denunciaId" value={denunciaId} />
          <textarea
            name="resposta"
            rows={3}
            maxLength={2000}
            defaultValue={respostaAtual ?? ""}
            placeholder="Mensagem que o denunciante verá ao consultar o protocolo…"
            className="input-field resize-y"
          />
          <Enviar label="Salvar resposta" />
        </form>
      </Secao>
    </div>
  );
}
