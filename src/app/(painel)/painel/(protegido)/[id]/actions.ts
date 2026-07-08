"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_ORDEM } from "@/lib/status";
import type { StatusDenuncia } from "@/generated/prisma/client";

const RESPOSTA_MAX = 2000;
const NOTA_MAX = 2000;

// Server actions são fronteira de segurança: revalida a sessão aqui, não confia
// só no guard de rota. Retorna o id do autor (equipe) para registrar na trilha.
async function exigirAutor(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  return session.user.id;
}

export async function mudarStatus(formData: FormData) {
  const autorId = await exigirAutor();
  const denunciaId = String(formData.get("denunciaId") ?? "");
  const novo = String(formData.get("status") ?? "") as StatusDenuncia;
  if (!STATUS_ORDEM.includes(novo)) throw new Error("Status inválido.");

  const atual = await prisma.denuncia.findUniqueOrThrow({
    where: { id: denunciaId },
    select: { status: true },
  });
  if (atual.status === novo) return;

  await prisma.$transaction([
    prisma.denuncia.update({
      where: { id: denunciaId },
      data: { status: novo },
    }),
    prisma.historicoTriagem.create({
      data: {
        denunciaId,
        autorId,
        tipo: "MUDANCA_STATUS",
        statusDe: atual.status,
        statusPara: novo,
      },
    }),
  ]);

  revalidatePath(`/painel/${denunciaId}`);
  revalidatePath("/painel");
}

export async function adicionarNota(formData: FormData) {
  const autorId = await exigirAutor();
  const denunciaId = String(formData.get("denunciaId") ?? "");
  const nota = String(formData.get("nota") ?? "")
    .trim()
    .slice(0, NOTA_MAX);
  if (nota.length < 2) return;

  await prisma.historicoTriagem.create({
    data: { denunciaId, autorId, tipo: "NOTA_INTERNA", nota },
  });

  revalidatePath(`/painel/${denunciaId}`);
}

export async function definirRespostaPublica(formData: FormData) {
  const autorId = await exigirAutor();
  const denunciaId = String(formData.get("denunciaId") ?? "");
  const resposta = String(formData.get("resposta") ?? "")
    .trim()
    .slice(0, RESPOSTA_MAX);

  await prisma.$transaction([
    prisma.denuncia.update({
      where: { id: denunciaId },
      data: { respostaPublica: resposta || null },
    }),
    prisma.historicoTriagem.create({
      data: {
        denunciaId,
        autorId,
        tipo: "RESPOSTA_PUBLICA",
        nota: resposta || "(resposta removida)",
      },
    }),
  ]);

  revalidatePath(`/painel/${denunciaId}`);
}
