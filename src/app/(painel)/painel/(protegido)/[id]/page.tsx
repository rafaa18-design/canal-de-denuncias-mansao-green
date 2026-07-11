import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/status";
import { PRIORIDADE_META } from "@/lib/prioridade";
import { PRAZO_META, paraInputDate, situacaoPrazo } from "@/lib/prazo";
import type { StatusDenuncia } from "@/generated/prisma/client";
import { ControlesTriagem } from "./_components/controles-triagem";
import { ConversaEquipe } from "./_components/conversa-equipe";

function rotuloStatus(s: StatusDenuncia | null): string {
  return s ? STATUS_META[s].rotulo : "—";
}

const TIPO_ROTULO = {
  MUDANCA_STATUS: "Status",
  NOTA_INTERNA: "Nota interna",
  RESPOSTA_PUBLICA: "Resposta pública",
  ATRIBUICAO: "Atribuição",
  PRIORIDADE: "Prioridade",
  PRAZO: "Prazo",
} as const;

export const dynamic = "force-dynamic";

export default async function DetalheDenuncia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const denuncia = await prisma.denuncia.findUnique({
    where: { id },
    include: {
      categoria: { select: { nome: true } },
      responsavel: { select: { id: true, nome: true } },
      mensagens: {
        orderBy: { createdAt: "asc" },
        include: { autor: { select: { nome: true } } },
      },
      historico: {
        orderBy: { createdAt: "desc" },
        include: { autor: { select: { nome: true } } },
      },
    },
  });

  if (!denuncia) notFound();

  // Marca como lidas as mensagens do denunciante ao abrir o caso.
  await prisma.mensagemDenuncia.updateMany({
    where: { denunciaId: id, autoria: "DENUNCIANTE", lidaPelaEquipe: false },
    data: { lidaPelaEquipe: true },
  });

  const admins = await prisma.adminUser.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  const agora = new Date();
  const prazoSit = situacaoPrazo(denuncia.prazo, denuncia.status, agora);

  return (
    <div className="space-y-6">
      <Link
        href="/painel/denuncias"
        className="text-sm text-content-secondary transition hover:text-primary hover:underline"
      >
        ← Voltar
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            translate="no"
            className="font-mono text-xl font-extrabold tracking-wide text-primary"
          >
            {denuncia.protocolo}
          </h1>
          <p className="text-sm text-content-secondary">
            {denuncia.categoria.nome} · recebida em{" "}
            {denuncia.createdAt.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${PRIORIDADE_META[denuncia.prioridade].cor}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${PRIORIDADE_META[denuncia.prioridade].pontoCor}`}
            />
            {PRIORIDADE_META[denuncia.prioridade].rotulo}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_META[denuncia.status].cor}`}
          >
            {STATUS_META[denuncia.status].rotulo}
          </span>
        </div>
      </div>

      {/* Meta: responsável e prazo */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-content-secondary">
        <span>
          Responsável:{" "}
          <span className="text-content">
            {denuncia.responsavel?.nome ?? "—"}
          </span>
        </span>
        <span>
          Prazo:{" "}
          {denuncia.prazo ? (
            <span className={PRAZO_META[prazoSit].cor}>
              {denuncia.prazo.toLocaleDateString("pt-BR")}
              {(prazoSit === "VENCIDO" || prazoSit === "VENCE_HOJE") &&
                ` · ${PRAZO_META[prazoSit].rotulo}`}
            </span>
          ) : (
            <span className="text-content-tertiary">—</span>
          )}
        </span>
      </div>

      <div className="section-card p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-content-secondary">
          Relato
        </p>
        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-content">
          {denuncia.relato}
        </p>
      </div>

      <ControlesTriagem
        denunciaId={denuncia.id}
        statusAtual={denuncia.status}
        prioridadeAtual={denuncia.prioridade}
        prazoAtual={paraInputDate(denuncia.prazo)}
        responsavelIdAtual={denuncia.responsavel?.id ?? null}
        admins={admins}
        respostaAtual={denuncia.respostaPublica}
      />

      <ConversaEquipe
        denunciaId={denuncia.id}
        mensagens={denuncia.mensagens.map((m) => ({
          id: m.id,
          autoria: m.autoria,
          autorNome: m.autor?.nome ?? null,
          corpo: m.corpo,
          quando: m.createdAt.toLocaleString("pt-BR"),
        }))}
      />

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-content-secondary">
          Histórico de triagem
        </p>
        {denuncia.historico.length === 0 ? (
          <p className="text-sm text-content-secondary">
            Sem movimentações ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {denuncia.historico.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-edge bg-canvas-elevated px-4 py-2.5 text-sm text-content"
              >
                <span className="text-content-secondary">
                  {h.createdAt.toLocaleString("pt-BR")} · {h.autor.nome} ·{" "}
                  {TIPO_ROTULO[h.tipo]} ·{" "}
                </span>
                {h.tipo === "MUDANCA_STATUS"
                  ? `${rotuloStatus(h.statusDe)} → ${rotuloStatus(h.statusPara)}`
                  : h.nota}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
