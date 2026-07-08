// Verifica o envio server-side de Web Push SEM depender de um serviço de push
// real: sobe um endpoint mock local, cria uma inscrição estruturalmente válida
// (chaves ECDH P-256 reais) e confirma que `enviarNotificacaoNovaDenuncia`
// assina (VAPID) e faz POST do payload cifrado, sem vazar conteúdo sensível.
import "dotenv/config";
import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { enviarNotificacaoNovaDenuncia } from "../src/lib/push";

// web-push exige HTTPS. Usamos um mock HTTPS com cert self-signed e aceitamos
// esse cert só neste processo de teste.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const CERT_DIR = process.env.PUSH_TEST_CERT_DIR!;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

let falhas = 0;
const ok = (c: boolean, m: string) => {
  console.log(`${c ? "✓" : "✗"} ${m}`);
  if (!c) falhas++;
};

async function main() {
  const recebidos: { headers: http.IncomingHttpHeaders; bodyLen: number }[] =
    [];
  const server = https.createServer(
    {
      key: fs.readFileSync(`${CERT_DIR}/key.pem`),
      cert: fs.readFileSync(`${CERT_DIR}/cert.pem`),
    },
    (req, res) => {
      let len = 0;
      req.on("data", (c) => (len += c.length));
      req.on("end", () => {
        recebidos.push({ headers: req.headers, bodyLen: len });
        res.writeHead(201);
        res.end();
      });
    },
  );
  await new Promise<void>((r) => server.listen(0, r));
  const porta = (server.address() as { port: number }).port;
  const endpoint = `https://localhost:${porta}/push/abc`;

  // inscrição válida: chave pública ECDH P-256 (uncompressed) + auth de 16 bytes
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const p256dh = ecdh.getPublicKey().toString("base64url");
  const auth = crypto.randomBytes(16).toString("base64url");

  // caso 1: sem inscrições → no-op sem lançar
  await prisma.pushSubscription.deleteMany({});
  await enviarNotificacaoNovaDenuncia();
  ok(recebidos.length === 0, "sem inscrições: nenhum POST (no-op seguro)");

  // caso 2: com inscrição → envia
  const admin = await prisma.adminUser.findFirst();
  if (!admin) throw new Error("crie um admin antes (pnpm admin:criar)");
  await prisma.pushSubscription.create({
    data: { adminUserId: admin.id, endpoint, p256dh, auth },
  });

  await enviarNotificacaoNovaDenuncia();
  await new Promise((r) => setTimeout(r, 300));

  ok(recebidos.length === 1, "com inscrição: 1 POST no endpoint");
  const req = recebidos[0];
  ok(
    typeof req?.headers.authorization === "string" &&
      req.headers.authorization.toLowerCase().includes("vapid"),
    "header Authorization com assinatura VAPID",
  );
  ok((req?.bodyLen ?? 0) > 0, "corpo cifrado presente (payload não vazio)");

  await prisma.pushSubscription.deleteMany({});
  server.close();
}

main()
  .catch((e) => {
    console.error("FALHOU:", e);
    falhas++;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(
      falhas === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${falhas} FALHA(S)`,
    );
    process.exit(falhas === 0 ? 0 : 1);
  });
