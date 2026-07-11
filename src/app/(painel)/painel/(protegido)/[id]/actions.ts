"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_ORDEM } from "@/lib/status";
import { PRIORIDADE_ORDEM } from "@/lib/prioridade";
import type {
  PrioridadeDenuncia,
  StatusDenuncia,
} from "@/generated/prisma/client";

const RESPOSTA_MAX = 2000;
const NOTA_MAX = 2000;
const MENSAGEM_MAX = 4000;

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

export async function definirPrioridade(formData: FormData) {
  const autorId = await exigirAutor();
  const denunciaId = String(formData.get("denunciaId") ?? "");
  const nova = String(formData.get("prioridade") ?? "") as PrioridadeDenuncia;
  if (!PRIORIDADE_ORDEM.includes(nova)) throw new Error("Prioridade inválida.");

  const atual = await prisma.denuncia.findUniqueOrThrow({
    where: { id: denunciaId },
    select: { prioridade: true },
  });
  if (atual.prioridade === nova) return;

  await prisma.$transaction([
    prisma.denuncia.update({
      where: { id: denunciaId },
      data: { prioridade: nova },
    }),
    prisma.historicoTriagem.create({
      data: {
        denunciaId,
        autorId,
        tipo: "PRIORIDADE",
        nota: `${atual.prioridade} → ${nova}`,
      },
    }),
  ]);

  revalidatePath(`/painel/${denunciaId}`);
  revalidatePath("/painel/denuncias");
  revalidatePath("/painel");
}

export async function definirPrazo(formData: FormData) {
  const autorId = await exigirAutor();
  const denunciaId = String(formData.get("denunciaId") ?? "");
  const bruto = String(formData.get("prazo") ?? "").trim();

  // <input type="date"> entrega YYYY-MM-DD; interpretamos como data local.
  let prazo: Date | null = null;
  if (bruto) {
    const [ano, mes, dia] = bruto.split("-").map(Number);
    if (!ano || !mes || !dia) throw new Error("Data inválida.");
    prazo = new Date(ano, mes - 1, dia);
  }

  await prisma.$transaction([
    prisma.denuncia.update({
      where: { id: denunciaId },
      data: { prazo },
    }),
    prisma.historicoTriagem.create({
      data: {
        denunciaId,
        autorId,
        tipo: "PRAZO",
        nota: prazo
          ? `Prazo definido: ${prazo.toLocaleDateString("pt-BR")}`
          : "Prazo removido",
      },
    }),
  ]);

  revalidatePath(`/painel/${denunciaId}`);
  revalidatePath("/painel/denuncias");
  revalidatePath("/painel");
}

export async function atribuirResponsavel(formData: FormData) {
  const autorId = await exigirAutor();
  const denunciaId = String(formData.get("denunciaId") ?? "");
  const responsavelId = String(formData.get("responsavelId") ?? "").trim();

  let nomeResp = "Sem responsável";
  if (responsavelId) {
    const resp = await prisma.adminUser.findUnique({
      where: { id: responsavelId },
      select: { nome: true, ativo: true },
    });
    if (!resp || !resp.ativo) throw new Error("Responsável inválido.");
    nomeResp = resp.nome;
  }

  await prisma.$transaction([
    prisma.denuncia.update({
      where: { id: denunciaId },
      data: { responsavelId: responsavelId || null },
    }),
    prisma.historicoTriagem.create({
      data: {
        denunciaId,
        autorId,
        tipo: "ATRIBUICAO",
        nota: `Responsável: ${nomeResp}`,
      },
    }),
  ]);

  revalidatePath(`/painel/${denunciaId}`);
  revalidatePath("/painel/denuncias");
  revalidatePath("/painel");
}

/** Mensagem da equipe para o denunciante (visível na consulta por protocolo). */
export async function responderDenunciante(formData: FormData) {
  const autorId = await exigirAutor();
  const denunciaId = String(formData.get("denunciaId") ?? "");
  const corpo = String(formData.get("corpo") ?? "")
    .trim()
    .slice(0, MENSAGEM_MAX);
  if (corpo.length < 1) return;

  await prisma.mensagemDenuncia.create({
    data: {
      denunciaId,
      autoria: "EQUIPE",
      autorId,
      corpo,
      // Mensagem da equipe já nasce "lida" pela equipe.
      lidaPelaEquipe: true,
    },
  });

  revalidatePath(`/painel/${denunciaId}`);
}
