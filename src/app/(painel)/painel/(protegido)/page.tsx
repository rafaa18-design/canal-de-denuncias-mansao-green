import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { StatusDenuncia } from "@/generated/prisma/client";
import { STATUS_META, STATUS_ORDEM } from "@/lib/status";
import { AtivarNotificacoes } from "./_components/ativar-notificacoes";

export const dynamic = "force-dynamic";

function ehStatus(v: string | undefined): v is StatusDenuncia {
  return !!v && (STATUS_ORDEM as string[]).includes(v);
}

export default async function PainelInbox({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filtro = ehStatus(status) ? status : undefined;

  const [denuncias, contagens] = await Promise.all([
    prisma.denuncia.findMany({
      where: filtro ? { status: filtro } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        protocolo: true,
        status: true,
        createdAt: true,
        categoria: { select: { nome: true } },
      },
    }),
    prisma.denuncia.groupBy({ by: ["status"], _count: true }),
  ]);

  const totalPorStatus = new Map(contagens.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-content">Denúncias</h1>
        <AtivarNotificacoes />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FiltroLink ativo={!filtro} href="/painel" rotulo="Todas" />
        {STATUS_ORDEM.map((s) => (
          <FiltroLink
            key={s}
            ativo={filtro === s}
            href={`/painel?status=${s}`}
            rotulo={`${STATUS_META[s].rotulo} (${totalPorStatus.get(s) ?? 0})`}
          />
        ))}
      </div>

      <div className="overflow-hidden section-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-edge text-xs uppercase tracking-wide text-content-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Protocolo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Recebida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {denuncias.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-content-secondary"
                >
                  Nenhuma denúncia nesta visão.
                </td>
              </tr>
            ) : (
              denuncias.map((d) => (
                <tr key={d.id} className="transition hover:bg-canvas-subtle">
                  <td
                    translate="no"
                    className="px-4 py-3 font-mono font-bold text-primary"
                  >
                    <Link href={`/painel/${d.id}`} className="hover:underline">
                      {d.protocolo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-content">{d.categoria.nome}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[d.status].cor}`}
                    >
                      {STATUS_META[d.status].rotulo}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-content-secondary">
                    {d.createdAt.toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))
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
