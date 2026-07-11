import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { carregarMetricas } from "@/lib/metricas";
import { STATUS_META } from "@/lib/status";
import { PRIORIDADE_META } from "@/lib/prioridade";
import { PRAZO_META, situacaoPrazo } from "@/lib/prazo";
import { AtivarNotificacoes } from "./_components/ativar-notificacoes";
import {
  BarrasHorizontais,
  CartaoKpi,
  ColunasSerie,
} from "./_components/dashboard-ui";

export const dynamic = "force-dynamic";

const CORES_STATUS: Record<string, string> = {
  RECEBIDA: "bg-primary",
  EM_ANALISE: "bg-warning",
  TRATADA: "bg-success",
  ARQUIVADA: "bg-content-tertiary",
};

export default async function VisaoGeral() {
  const agora = new Date();

  const [m, atencao] = await Promise.all([
    carregarMetricas(agora),
    // "Precisa de atenção": em aberto, priorizando alta prioridade e prazo.
    prisma.denuncia.findMany({
      where: { status: { in: ["RECEBIDA", "EM_ANALISE"] } },
      orderBy: [{ prioridade: "asc" }, { createdAt: "asc" }],
      take: 8,
      select: {
        id: true,
        protocolo: true,
        status: true,
        prioridade: true,
        prazo: true,
        categoria: { select: { nome: true } },
        responsavel: { select: { nome: true } },
      },
    }),
  ]);

  const tempoMedio =
    m.tempoMedioDias === null
      ? "—"
      : m.tempoMedioDias < 1
        ? "<1 dia"
        : `${m.tempoMedioDias.toFixed(1)} dias`;

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-content">Visão geral</h1>
        <AtivarNotificacoes />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CartaoKpi rotulo="Total" valor={m.total} href="/painel/denuncias" />
        <CartaoKpi
          rotulo="Em aberto"
          valor={m.abertas}
          detalhe={`${m.emAnalise} em análise`}
          href="/painel/denuncias?status=RECEBIDA"
        />
        <CartaoKpi
          rotulo="Encerradas"
          valor={m.encerradas}
          destaque="success"
          href="/painel/denuncias?status=TRATADA"
        />
        <CartaoKpi
          rotulo="Vencidas"
          valor={m.vencidas}
          destaque={m.vencidas > 0 ? "danger" : undefined}
          detalhe="prazo estourado"
        />
        <CartaoKpi
          rotulo="Msgs. novas"
          valor={m.mensagensNaoLidas}
          destaque={m.mensagensNaoLidas > 0 ? "warning" : undefined}
          detalhe="do denunciante"
        />
        <CartaoKpi
          rotulo="Tempo médio"
          valor={tempoMedio}
          detalhe="até encerrar"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BarrasHorizontais
          titulo="Por categoria"
          itens={m.porCategoria.map((c) => ({ nome: c.nome, total: c.total }))}
        />
        <BarrasHorizontais
          titulo="Por status"
          itens={m.porStatus.map((s) => ({
            nome: STATUS_META[s.chave].rotulo,
            total: s.total,
            cor: CORES_STATUS[s.chave],
          }))}
        />
      </div>

      <ColunasSerie titulo="Últimos 30 dias" itens={m.ultimos30Dias} />

      {/* Precisa de atenção */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-content-secondary">
            Precisa de atenção
          </h2>
          <Link
            href="/painel/denuncias"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {atencao.length === 0 ? (
          <p className="section-card px-5 py-8 text-center text-sm text-content-secondary">
            Nada em aberto. Tudo em dia. 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {atencao.map((d) => {
              const prazo = situacaoPrazo(d.prazo, d.status, agora);
              return (
                <li key={d.id}>
                  <Link
                    href={`/painel/${d.id}`}
                    className="section-card flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:border-edge-hover hover:bg-canvas-subtle"
                  >
                    <span
                      translate="no"
                      className="font-mono text-sm font-bold text-primary"
                    >
                      {d.protocolo}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDADE_META[d.prioridade].cor}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${PRIORIDADE_META[d.prioridade].pontoCor}`}
                      />
                      {PRIORIDADE_META[d.prioridade].rotulo}
                    </span>
                    <span className="text-sm text-content-secondary">
                      {d.categoria.nome}
                    </span>
                    {(prazo === "VENCIDO" || prazo === "VENCE_HOJE") && (
                      <span
                        className={`text-xs font-semibold ${PRAZO_META[prazo].cor}`}
                      >
                        {PRAZO_META[prazo].rotulo}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-content-tertiary">
                      {d.responsavel?.nome ?? "Sem responsável"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
