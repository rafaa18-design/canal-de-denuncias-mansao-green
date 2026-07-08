import type { StatusDenuncia } from "@/generated/prisma/client";

/** Rótulos e cores de cada status para exibição no painel e na consulta pública. */
export const STATUS_META: Record<
  StatusDenuncia,
  { rotulo: string; publico: string; cor: string }
> = {
  RECEBIDA: {
    rotulo: "Recebida",
    publico: "Recebida — aguardando análise",
    cor: "bg-primary/8 text-primary ring-1 ring-primary/15",
  },
  EM_ANALISE: {
    rotulo: "Em análise",
    publico: "Em análise pela equipe",
    cor: "bg-warning/8 text-warning ring-1 ring-warning/20",
  },
  TRATADA: {
    rotulo: "Tratada",
    publico: "Tratada",
    cor: "bg-success/8 text-success ring-1 ring-success/20",
  },
  ARQUIVADA: {
    rotulo: "Arquivada",
    publico: "Encerrada",
    cor: "bg-canvas-subtle text-content-tertiary ring-1 ring-edge",
  },
};

export const STATUS_ORDEM: StatusDenuncia[] = [
  "RECEBIDA",
  "EM_ANALISE",
  "TRATADA",
  "ARQUIVADA",
];
