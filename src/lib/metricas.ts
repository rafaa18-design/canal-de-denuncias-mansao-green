import { prisma } from "@/lib/prisma";
import { STATUS_ORDEM } from "@/lib/status";
import { PRIORIDADE_ORDEM } from "@/lib/prioridade";
import { situacaoPrazo } from "@/lib/prazo";
import type {
  StatusDenuncia,
  PrioridadeDenuncia,
} from "@/generated/prisma/client";

const ABERTOS: StatusDenuncia[] = ["RECEBIDA", "EM_ANALISE"];
const ENCERRADOS: StatusDenuncia[] = ["TRATADA", "ARQUIVADA"];

const DIA_MS = 24 * 60 * 60 * 1000;

export type MetricasDashboard = {
  total: number;
  abertas: number;
  emAnalise: number;
  encerradas: number;
  vencidas: number;
  mensagensNaoLidas: number;
  tempoMedioDias: number | null;
  porStatus: { chave: StatusDenuncia; rotulo: string; total: number }[];
  porCategoria: { nome: string; total: number }[];
  porPrioridade: { chave: PrioridadeDenuncia; total: number }[];
  ultimos30Dias: { dia: string; data: string; total: number }[];
};

/**
 * Agrega os indicadores do dashboard interno a partir dos dados já existentes.
 * Não persiste nada — é leitura pura.
 */
export async function carregarMetricas(
  agora: Date = new Date(),
): Promise<MetricasDashboard> {
  const inicioJanela = new Date(agora.getTime() - 29 * DIA_MS);
  inicioJanela.setHours(0, 0, 0, 0);

  const [
    total,
    porStatusRaw,
    porPrioridadeRaw,
    categorias,
    abertasComPrazo,
    encerramentos,
    mensagensNaoLidas,
    recentes,
  ] = await Promise.all([
    prisma.denuncia.count(),
    prisma.denuncia.groupBy({ by: ["status"], _count: true }),
    prisma.denuncia.groupBy({ by: ["prioridade"], _count: true }),
    prisma.categoria.findMany({
      select: { nome: true, _count: { select: { denuncias: true } } },
      orderBy: { ordem: "asc" },
    }),
    // Só os casos em aberto com prazo definido — base para contar vencidos.
    prisma.denuncia.findMany({
      where: { status: { in: ABERTOS }, prazo: { not: null } },
      select: { prazo: true, status: true },
    }),
    // Primeira mudança de status para um estado encerrado, por denúncia.
    prisma.historicoTriagem.findMany({
      where: { tipo: "MUDANCA_STATUS", statusPara: { in: ENCERRADOS } },
      select: {
        denunciaId: true,
        createdAt: true,
        denuncia: { select: { createdAt: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mensagemDenuncia.count({
      where: { autoria: "DENUNCIANTE", lidaPelaEquipe: false },
    }),
    prisma.denuncia.findMany({
      where: { createdAt: { gte: inicioJanela } },
      select: { createdAt: true },
    }),
  ]);

  const contaStatus = new Map(porStatusRaw.map((s) => [s.status, s._count]));
  const contaPrioridade = new Map(
    porPrioridadeRaw.map((p) => [p.prioridade, p._count]),
  );

  const abertas = ABERTOS.reduce((n, s) => n + (contaStatus.get(s) ?? 0), 0);
  const encerradas = ENCERRADOS.reduce(
    (n, s) => n + (contaStatus.get(s) ?? 0),
    0,
  );

  const vencidas = abertasComPrazo.filter(
    (d) => situacaoPrazo(d.prazo, d.status, agora) === "VENCIDO",
  ).length;

  // Tempo médio (dias) entre a criação e o primeiro encerramento.
  const primeiroEncerramento = new Map<string, number>();
  for (const e of encerramentos) {
    if (!primeiroEncerramento.has(e.denunciaId)) {
      primeiroEncerramento.set(
        e.denunciaId,
        e.createdAt.getTime() - e.denuncia.createdAt.getTime(),
      );
    }
  }
  const tempoMedioDias =
    primeiroEncerramento.size === 0
      ? null
      : Array.from(primeiroEncerramento.values()).reduce((a, b) => a + b, 0) /
        primeiroEncerramento.size /
        DIA_MS;

  // Série dos últimos 30 dias (buckets por dia local).
  const baldes = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(inicioJanela.getTime() + i * DIA_MS);
    baldes.set(chaveDia(d), 0);
  }
  for (const r of recentes) {
    const k = chaveDia(r.createdAt);
    if (baldes.has(k)) baldes.set(k, (baldes.get(k) ?? 0) + 1);
  }
  const ultimos30Dias = Array.from(baldes.entries()).map(([k, total]) => {
    const [ano, mes, dia] = k.split("-").map(Number);
    const d = new Date(ano, mes - 1, dia);
    return {
      dia: String(dia).padStart(2, "0"),
      data: d.toLocaleDateString("pt-BR"),
      total,
    };
  });

  return {
    total,
    abertas,
    emAnalise: contaStatus.get("EM_ANALISE") ?? 0,
    encerradas,
    vencidas,
    mensagensNaoLidas,
    tempoMedioDias,
    porStatus: STATUS_ORDEM.map((s) => ({
      chave: s,
      rotulo: s,
      total: contaStatus.get(s) ?? 0,
    })),
    porCategoria: categorias
      .map((c) => ({ nome: c.nome, total: c._count.denuncias }))
      .sort((a, b) => b.total - a.total),
    porPrioridade: PRIORIDADE_ORDEM.map((p) => ({
      chave: p,
      total: contaPrioridade.get(p) ?? 0,
    })),
    ultimos30Dias,
  };
}

function chaveDia(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
