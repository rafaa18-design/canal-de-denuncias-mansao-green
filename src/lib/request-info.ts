import { createHash } from "node:crypto";
import { headers } from "next/headers";

// Deriva um identificador EFÊMERO do cliente para rate limiting, a partir dos
// headers de proxy. É hasheado (com salt) para nunca manter o IP em claro, nem
// em memória, e NUNCA é persistido nem associado à denúncia. Preserva o
// anonimato: serve só para contar requisições numa janela de tempo.
export async function chaveClienteAnonima(): Promise<string> {
  const h = await headers();
  const encaminhado = h.get("x-forwarded-for")?.split(",")[0];
  const ip = (encaminhado ?? h.get("x-real-ip") ?? "desconhecido").trim();
  const salt = process.env.AUTH_SECRET ?? "canal-denuncias";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}
