import type { StatusDenuncia } from "@/generated/prisma/client";

/** Status em que o caso já está encerrado — prazo deixa de ser cobrado. */
const ENCERRADOS: StatusDenuncia[] = ["TRATADA", "ARQUIVADA"];

export type SituacaoPrazo = "SEM_PRAZO" | "NO_PRAZO" | "VENCE_HOJE" | "VENCIDO";

/**
 * Situação do prazo (SLA) de uma denúncia ainda em aberto. Casos encerrados
 * nunca contam como vencidos.
 */
export function situacaoPrazo(
  prazo: Date | null,
  status: StatusDenuncia,
  agora: Date = new Date(),
): SituacaoPrazo {
  if (!prazo) return "SEM_PRAZO";
  if (ENCERRADOS.includes(status)) return "NO_PRAZO";

  const fimDoDia = new Date(prazo);
  fimDoDia.setHours(23, 59, 59, 999);
  if (agora > fimDoDia) return "VENCIDO";

  const mesmoDia =
    prazo.getFullYear() === agora.getFullYear() &&
    prazo.getMonth() === agora.getMonth() &&
    prazo.getDate() === agora.getDate();
  return mesmoDia ? "VENCE_HOJE" : "NO_PRAZO";
}

export const PRAZO_META: Record<
  SituacaoPrazo,
  { rotulo: string; cor: string }
> = {
  SEM_PRAZO: { rotulo: "Sem prazo", cor: "text-content-tertiary" },
  NO_PRAZO: { rotulo: "No prazo", cor: "text-content-secondary" },
  VENCE_HOJE: { rotulo: "Vence hoje", cor: "text-warning" },
  VENCIDO: { rotulo: "Vencido", cor: "text-danger" },
};

/** Converte um Date em `YYYY-MM-DD` para popular <input type="date">. */
export function paraInputDate(d: Date | null): string {
  if (!d) return "";
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
