"use server";

import { prisma } from "@/lib/prisma";
import {
  gerarProtocolo,
  normalizarProtocolo,
  protocoloValido,
} from "@/lib/protocolo";
import { STATUS_META } from "@/lib/status";
import { checkRateLimit } from "@/lib/rate-limit";
import { chaveClienteAnonima } from "@/lib/request-info";
import { enviarNotificacaoNovaDenuncia } from "@/lib/push";

const RELATO_MIN = 10;
const RELATO_MAX = 5000;

// Anti-flood: no máximo N envios por janela, por cliente (IP hasheado, efêmero).
const ENVIO_LIMITE = 5;
const ENVIO_JANELA_MS = 10 * 60 * 1000; // 10 minutos

export type CriarDenunciaState =
  { ok: true; protocolo: string } | { ok: false; erro: string } | null;

/** Erro de violação de unicidade do Prisma (protocolo duplicado). */
function ehColisaoUnica(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

/**
 * Registra uma denúncia anônima. NÃO recebe nem grava qualquer dado pessoal:
 * apenas categoria + relato. Gera protocolo único (com retry em colisão).
 */
export async function criarDenuncia(
  _prev: CriarDenunciaState,
  formData: FormData,
): Promise<CriarDenunciaState> {
  // Honeypot: campo oculto que humanos não veem. Se veio preenchido, é bot —
  // recusa sem gravar (e sem detalhar o motivo).
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { ok: false, erro: "Não foi possível registrar. Tente novamente." };
  }

  // Rate limit por cliente (identificador efêmero e hasheado, nunca persistido).
  const chave = await chaveClienteAnonima();
  const limite = checkRateLimit(chave, {
    limite: ENVIO_LIMITE,
    janelaMs: ENVIO_JANELA_MS,
  });
  if (!limite.ok) {
    const minutos = Math.max(1, Math.ceil(limite.retryAfterMs / 60000));
    return {
      ok: false,
      erro: `Muitos envios em pouco tempo. Aguarde cerca de ${minutos} min e tente de novo.`,
    };
  }

  const categoriaId = String(formData.get("categoriaId") ?? "").trim();
  const relato = String(formData.get("relato") ?? "").trim();

  if (!categoriaId) return { ok: false, erro: "Selecione uma categoria." };
  if (relato.length < RELATO_MIN)
    return {
      ok: false,
      erro: `Descreva com um pouco mais de detalhe (mínimo ${RELATO_MIN} caracteres).`,
    };
  if (relato.length > RELATO_MAX)
    return {
      ok: false,
      erro: `Relato muito longo (máximo ${RELATO_MAX} caracteres).`,
    };

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const protocolo = gerarProtocolo();
    try {
      await prisma.denuncia.create({
        data: { protocolo, categoriaId, relato },
      });
      // Notifica a equipe (push no navegador). Não bloqueia nem quebra o envio.
      await enviarNotificacaoNovaDenuncia();
      return { ok: true, protocolo };
    } catch (e) {
      if (ehColisaoUnica(e)) continue; // protocolo repetido: tenta outro
      return {
        ok: false,
        erro: "Não foi possível registrar agora. Tente novamente em instantes.",
      };
    }
  }
  return {
    ok: false,
    erro: "Não foi possível gerar um protocolo. Tente novamente.",
  };
}

export type ConsultaState =
  | {
      ok: true;
      status: string;
      statusPublico: string;
      respostaPublica: string | null;
      criadaEm: string;
    }
  | { ok: false; erro: string }
  | null;

/** Consulta pública do andamento por protocolo. Só expõe status público. */
export async function consultarProtocolo(
  _prev: ConsultaState,
  formData: FormData,
): Promise<ConsultaState> {
  const entrada = String(formData.get("protocolo") ?? "");
  if (!protocoloValido(entrada)) {
    return {
      ok: false,
      erro: "Protocolo inválido. Confira o formato (ex.: MG-XXXX-XXXX).",
    };
  }
  const protocolo = normalizarProtocolo(entrada);

  const denuncia = await prisma.denuncia.findUnique({
    where: { protocolo },
    select: { status: true, respostaPublica: true, createdAt: true },
  });

  if (!denuncia) {
    return {
      ok: false,
      erro: "Nenhuma denúncia encontrada para este protocolo.",
    };
  }

  return {
    ok: true,
    status: denuncia.status,
    statusPublico: STATUS_META[denuncia.status].publico,
    respostaPublica: denuncia.respostaPublica,
    criadaEm: denuncia.createdAt.toLocaleDateString("pt-BR"),
  };
}
