"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type InscricaoPush = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

async function exigirAutor(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  return session.user.id;
}

export async function salvarInscricao(sub: InscricaoPush) {
  const adminUserId = await exigirAutor();
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { adminUserId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      adminUserId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
}

export async function removerInscricao(endpoint: string) {
  const adminUserId = await exigirAutor();
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, adminUserId },
  });
}
