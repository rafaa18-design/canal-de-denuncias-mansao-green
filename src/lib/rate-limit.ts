// Rate limiter de janela deslizante, EM MEMÓRIA (por processo). Não persiste
// nada — preserva o anonimato (nenhum registro durável liga IP a denúncia).
// Para produção multi-instância, trocar o armazenamento por Redis/Upstash
// mantendo a mesma interface.

type Bucket = number[]; // timestamps (ms) das requisições recentes

const buckets = new Map<string, Bucket>();
let ultimoGc = 0;

export type RateLimitResult =
  { ok: true } | { ok: false; retryAfterMs: number };

export function checkRateLimit(
  chave: string,
  opcoes: { limite: number; janelaMs: number },
  agora: number = Date.now(),
): RateLimitResult {
  const { limite, janelaMs } = opcoes;
  const inicioJanela = agora - janelaMs;

  // GC leve: expurga buckets vazios/velhos periodicamente para não crescer.
  if (agora - ultimoGc > janelaMs) {
    for (const [k, ts] of buckets) {
      const vivos = ts.filter((t) => t > inicioJanela);
      if (vivos.length === 0) buckets.delete(k);
      else buckets.set(k, vivos);
    }
    ultimoGc = agora;
  }

  const recentes = (buckets.get(chave) ?? []).filter((t) => t > inicioJanela);
  if (recentes.length >= limite) {
    const maisAntigo = recentes[0];
    return { ok: false, retryAfterMs: maisAntigo + janelaMs - agora };
  }

  recentes.push(agora);
  buckets.set(chave, recentes);
  return { ok: true };
}

/** Uso em testes. */
export function _resetRateLimit() {
  buckets.clear();
  ultimoGc = 0;
}
