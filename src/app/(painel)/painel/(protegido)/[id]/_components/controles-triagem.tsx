"use client";

import { useFormStatus } from "react-dom";
import { STATUS_META, STATUS_ORDEM } from "@/lib/status";
import { PRIORIDADE_META, PRIORIDADE_ORDEM } from "@/lib/prioridade";
import type {
  PrioridadeDenuncia,
  StatusDenuncia,
} from "@/generated/prisma/client";
import {
  adicionarNota,
  atribuirResponsavel,
  definirPrazo,
  definirPrioridade,
  definirRespostaPublica,
  mudarStatus,
} from "../actions";

type Admin = { id: string; nome: string };

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
  prioridadeAtual,
  prazoAtual,
  responsavelIdAtual,
  admins,
  respostaAtual,
}: {
  denunciaId: string;
  statusAtual: StatusDenuncia;
  prioridadeAtual: PrioridadeDenuncia;
  prazoAtual: string;
  responsavelIdAtual: string | null;
  admins: Admin[];
  respostaAtual: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
            <Enviar label="Aplicar" />
          </form>
        </Secao>

        <Secao titulo="Prioridade">
          <form
            action={definirPrioridade}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="denunciaId" value={denunciaId} />
            <select
              key={prioridadeAtual}
              name="prioridade"
              defaultValue={prioridadeAtual}
              className="input-field w-auto py-2"
            >
              {PRIORIDADE_ORDEM.map((p) => (
                <option key={p} value={p}>
                  {PRIORIDADE_META[p].rotulo}
                </option>
              ))}
            </select>
            <Enviar label="Aplicar" />
          </form>
        </Secao>

        <Secao titulo="Responsável">
          <form
            action={atribuirResponsavel}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="denunciaId" value={denunciaId} />
            <select
              key={responsavelIdAtual ?? "none"}
              name="responsavelId"
              defaultValue={responsavelIdAtual ?? ""}
              className="input-field w-auto py-2"
            >
              <option value="">Sem responsável</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
            <Enviar label="Atribuir" />
          </form>
        </Secao>

        <Secao titulo="Prazo de tratamento">
          <form
            action={definirPrazo}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="denunciaId" value={denunciaId} />
            <input
              key={prazoAtual}
              type="date"
              name="prazo"
              defaultValue={prazoAtual}
              className="input-field w-auto py-2"
            />
            <Enviar label="Definir" />
          </form>
        </Secao>
      </div>

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
