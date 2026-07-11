import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Configura o VAPID uma vez. Se as chaves não estiverem no ambiente, o push
// fica desabilitado (no-op) — o app segue funcionando sem notificações.
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:contato@exemplo.com";

let configurado = false;
function garantirConfig(): boolean {
  if (configurado) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configurado = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

/**
 * Envia um payload a TODA a equipe. Payload SEM conteúdo sensível (nunca o
 * relato/mensagem). Nunca lança — falha de push jamais quebra o fluxo.
 */
async function notificarEquipe(payload: PushPayload): Promise<void> {
  try {
    if (!garantirConfig()) return;

    const inscricoes = await prisma.pushSubscription.findMany();
    if (inscricoes.length === 0) return;

    const corpo = JSON.stringify(payload);

    const resultados = await Promise.allSettled(
      inscricoes.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          corpo,
        ),
      ),
    );

    // Remove inscrições expiradas/canceladas (404/410).
    const expiradas: string[] = [];
    resultados.forEach((r, i) => {
      if (
        r.status === "rejected" &&
        [404, 410].includes(
          (r.reason as { statusCode?: number })?.statusCode ?? 0,
        )
      ) {
        expiradas.push(inscricoes[i].id);
      }
    });
    if (expiradas.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expiradas } },
      });
    }
  } catch (e) {
    console.error("[push] falha ao notificar:", e);
  }
}

/** Notifica a equipe sobre uma denúncia nova. */
export async function enviarNotificacaoNovaDenuncia(): Promise<void> {
  await notificarEquipe({
    title: "Nova denúncia recebida",
    body: "Abra o painel para triar.",
    url: "/painel",
  });
}

/** Notifica a equipe sobre uma nova mensagem enviada por um denunciante. */
export async function enviarNotificacaoNovaMensagem(): Promise<void> {
  await notificarEquipe({
    title: "Nova mensagem de um denunciante",
    body: "Um denunciante respondeu. Abra o painel.",
    url: "/painel/denuncias",
  });
}
