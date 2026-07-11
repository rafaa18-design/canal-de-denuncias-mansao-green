import type { PrioridadeDenuncia } from "@/generated/prisma/client";

/** Rótulos e cores de cada prioridade para exibição no painel. */
export const PRIORIDADE_META: Record<
  PrioridadeDenuncia,
  { rotulo: string; cor: string; pontoCor: string }
> = {
  ALTA: {
    rotulo: "Alta",
    cor: "bg-danger/8 text-danger ring-1 ring-danger/20",
    pontoCor: "bg-danger",
  },
  MEDIA: {
    rotulo: "Média",
    cor: "bg-warning/8 text-warning ring-1 ring-warning/20",
    pontoCor: "bg-warning",
  },
  BAIXA: {
    rotulo: "Baixa",
    cor: "bg-canvas-subtle text-content-secondary ring-1 ring-edge",
    pontoCor: "bg-content-tertiary",
  },
};

/** Ordem de exibição (mais crítica primeiro). */
export const PRIORIDADE_ORDEM: PrioridadeDenuncia[] = [
  "ALTA",
  "MEDIA",
  "BAIXA",
];
