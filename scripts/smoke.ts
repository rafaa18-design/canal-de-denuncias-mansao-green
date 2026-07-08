// Smoke test do fluxo end-to-end chamando as próprias Server Actions contra o
// banco real. Não faz parte do app — utilitário de verificação.
import "dotenv/config";
import { criarDenuncia, consultarProtocolo } from "../src/app/(public)/actions";
import { prisma } from "../src/lib/prisma";

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

async function main() {
  const cat = await prisma.categoria.findFirstOrThrow({
    where: { ativo: true },
  });

  console.log("\n1) criar denúncia (válida)");
  const criada = await criarDenuncia(
    null,
    fd({
      categoriaId: cat.id,
      relato: "Relato de teste do fluxo end-to-end, com detalhe suficiente.",
    }),
  );
  console.log("   →", criada);
  if (!criada?.ok) throw new Error("esperava sucesso na criação");
  const protocolo = criada.protocolo;

  console.log("\n2) validação: relato curto deve ser rejeitado");
  console.log(
    "   →",
    await criarDenuncia(null, fd({ categoriaId: cat.id, relato: "curto" })),
  );

  console.log("\n3) validação: sem categoria deve ser rejeitado");
  console.log(
    "   →",
    await criarDenuncia(
      null,
      fd({ categoriaId: "", relato: "relato longo o suficiente aqui" }),
    ),
  );

  console.log("\n4) consultar por protocolo (existente)");
  console.log("   →", await consultarProtocolo(null, fd({ protocolo })));

  console.log("\n5) consultar protocolo inexistente");
  console.log(
    "   →",
    await consultarProtocolo(null, fd({ protocolo: "MG-ZZZZ-ZZZZ" })),
  );

  console.log("\n6) consultar protocolo em formato inválido");
  console.log(
    "   →",
    await consultarProtocolo(null, fd({ protocolo: "abc123" })),
  );

  console.log("\n7) painel: contagem por status (groupBy)");
  console.log(
    "   →",
    await prisma.denuncia.groupBy({ by: ["status"], _count: true }),
  );

  console.log("\n8) sem PII: colunas da tabela Denuncia");
  const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    "select column_name from information_schema.columns where table_name = 'Denuncia' order by ordinal_position",
  );
  console.log("   →", cols.map((c) => c.column_name).join(", "));
}

main()
  .catch((e) => {
    console.error("FALHOU:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
