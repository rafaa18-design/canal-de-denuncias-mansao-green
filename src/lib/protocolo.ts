import { randomInt } from "node:crypto";

// Alfabeto sem caracteres ambíguos (0/O, 1/I) para leitura/ditado do protocolo.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TAMANHO_BLOCO = 4;

/**
 * Gera um protocolo público no formato `MG-XXXX-XXXX`.
 * - Aleatório (crypto), não sequencial e não enumerável — não vaza volume
 *   de denúncias nem permite adivinhar protocolos de terceiros.
 * - Não guarda relação com qualquer identidade (não há identidade a reverter).
 * Espaço de combinações: 32^8 ≈ 1,1 trilhão.
 */
export function gerarProtocolo(): string {
  const bloco = () =>
    Array.from(
      { length: TAMANHO_BLOCO },
      () => ALFABETO[randomInt(ALFABETO.length)],
    ).join("");
  return `MG-${bloco()}-${bloco()}`;
}

const FORMATO_PROTOCOLO = /^MG-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/** Normaliza a entrada do usuário (maiúsculas, sem espaços) para consulta. */
export function normalizarProtocolo(entrada: string): string {
  return entrada.trim().toUpperCase().replace(/\s+/g, "");
}

export function protocoloValido(entrada: string): boolean {
  return FORMATO_PROTOCOLO.test(normalizarProtocolo(entrada));
}
