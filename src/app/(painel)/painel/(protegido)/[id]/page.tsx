import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/status";
import type { StatusDenuncia } from "@/generated/prisma/client";
import { ControlesTriagem } from "./_components/controles-triagem";

function rotuloStatus(s: StatusDenuncia | null): string {
  return s ? STATUS_META[s].rotulo : "—";
}

const TIPO_ROTULO = {
  MUDANCA_STATUS: "Status",
  NOTA_INTERNA: "Nota interna",
  RESPOSTA_PUBLICA: "Resposta pública",
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
      historico: {
        orderBy: { createdAt: "desc" },
        include: { autor: { select: { nome: true } } },
      },
    },
  });

  if (!denuncia) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/painel"
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
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_META[denuncia.status].cor}`}
        >
          {STATUS_META[denuncia.status].rotulo}
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
        respostaAtual={denuncia.respostaPublica}
      />

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-content-secondary">
          Histórico de triagem
        </p>
        {denuncia.historico.length === 0 ? (
          <p className="text-sm text-content-secondary">Sem movimentações ainda.</p>
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
