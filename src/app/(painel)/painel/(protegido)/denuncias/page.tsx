import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { StatusDenuncia } from "@/generated/prisma/client";
import { STATUS_META, STATUS_ORDEM } from "@/lib/status";
import { PRIORIDADE_META } from "@/lib/prioridade";
import { PRAZO_META, situacaoPrazo } from "@/lib/prazo";

export const dynamic = "force-dynamic";

function ehStatus(v: string | undefined): v is StatusDenuncia {
  return !!v && (STATUS_ORDEM as string[]).includes(v);
}

export default async function InboxDenuncias({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; minhas?: string }>;
}) {
  const { status, minhas } = await searchParams;
  const filtro = ehStatus(status) ? status : undefined;
  const soMinhas = minhas === "1";

  const session = await auth();
  const meuId = session?.user?.id;
  const agora = new Date();

  const where = {
    ...(filtro ? { status: filtro } : {}),
    ...(soMinhas && meuId ? { responsavelId: meuId } : {}),
  };

  const [denuncias, contagens] = await Promise.all([
    prisma.denuncia.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        protocolo: true,
        status: true,
        prioridade: true,
        prazo: true,
        createdAt: true,
        categoria: { select: { nome: true } },
        responsavel: { select: { nome: true } },
        _count: {
          select: {
            mensagens: {
              where: { autoria: "DENUNCIANTE", lidaPelaEquipe: false },
            },
          },
        },
      },
    }),
    prisma.denuncia.groupBy({ by: ["status"], _count: true }),
  ]);

  const totalPorStatus = new Map(contagens.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-content">Denúncias</h1>

      <div className="flex flex-wrap items-center gap-2">
        <FiltroLink
          ativo={!filtro && !soMinhas}
          href="/painel/denuncias"
          rotulo="Todas"
        />
        {STATUS_ORDEM.map((s) => (
          <FiltroLink
            key={s}
            ativo={filtro === s && !soMinhas}
            href={`/painel/denuncias?status=${s}`}
            rotulo={`${STATUS_META[s].rotulo} (${totalPorStatus.get(s) ?? 0})`}
          />
        ))}
        {meuId && (
          <FiltroLink
            ativo={soMinhas}
            href="/painel/denuncias?minhas=1"
            rotulo="Minhas"
          />
        )}
      </div>

      <div className="section-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-edge text-xs uppercase tracking-wide text-content-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Protocolo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
              <th className="px-4 py-3 font-medium">Recebida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {denuncias.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-content-secondary"
                >
                  Nenhuma denúncia nesta visão.
                </td>
              </tr>
            ) : (
              denuncias.map((d) => {
                const prazo = situacaoPrazo(d.prazo, d.status, agora);
                const naoLidas = d._count.mensagens;
                return (
                  <tr key={d.id} className="transition hover:bg-canvas-subtle">
                    <td
                      translate="no"
                      className="px-4 py-3 font-mono font-bold text-primary"
                    >
                      <Link
                        href={`/painel/${d.id}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        {d.protocolo}
                        {naoLidas > 0 && (
                          <span
                            title={`${naoLidas} mensagem(ns) nova(s) do denunciante`}
                            className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-canvas"
                          >
                            {naoLidas}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-content">
                      {d.categoria.nome}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORIDADE_META[d.prioridade].cor}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${PRIORIDADE_META[d.prioridade].pontoCor}`}
                        />
                        {PRIORIDADE_META[d.prioridade].rotulo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {d.responsavel?.nome ?? (
                        <span className="text-content-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[d.status].cor}`}
                      >
                        {STATUS_META[d.status].rotulo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.prazo ? (
                        <span className={`text-xs ${PRAZO_META[prazo].cor}`}>
                          {d.prazo.toLocaleDateString("pt-BR")}
                          {(prazo === "VENCIDO" || prazo === "VENCE_HOJE") && (
                            <span className="ml-1 font-semibold">
                              · {PRAZO_META[prazo].rotulo}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-content-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-content-secondary">
                      {d.createdAt.toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FiltroLink({
  ativo,
  href,
  rotulo,
}: {
  ativo: boolean;
  href: string;
  rotulo: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${
        ativo
          ? "bg-primary text-canvas"
          : "bg-canvas-elevated text-content-secondary ring-1 ring-edge hover:bg-canvas-subtle"
      }`}
    >
      {rotulo}
    </Link>
  );
}
