// Teste determinístico do rate limiter (função pura, com `agora` injetado).
import { checkRateLimit, _resetRateLimit } from "../src/lib/rate-limit";

let falhas = 0;
function assert(cond: boolean, msg: string) {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) falhas++;
}

const OPC = { limite: 5, janelaMs: 10 * 60 * 1000 };
const t0 = 1_000_000;

_resetRateLimit();

// 5 primeiros envios passam
for (let i = 1; i <= 5; i++) {
  const r = checkRateLimit("clienteA", OPC, t0 + i);
  assert(r.ok, `envio ${i} permitido`);
}

// 6º é bloqueado
const bloq = checkRateLimit("clienteA", OPC, t0 + 6);
assert(!bloq.ok, "6º envio bloqueado");
assert(!bloq.ok && bloq.retryAfterMs > 0, "retryAfterMs positivo");

// Outro cliente não é afetado (isolamento por chave)
assert(checkRateLimit("clienteB", OPC, t0 + 7).ok, "clienteB independente");

// Após a janela, clienteA volta a ser permitido
const depois = checkRateLimit("clienteA", OPC, t0 + OPC.janelaMs + 100);
assert(depois.ok, "clienteA liberado após a janela");

console.log(
  falhas === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${falhas} FALHA(S)`,
);
process.exit(falhas === 0 ? 0 : 1);
