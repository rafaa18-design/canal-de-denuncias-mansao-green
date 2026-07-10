import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Categorias PROVISÓRIAS. A lista final é definida no kickoff com a Mansão Green
// (tarefa "Kickoff: validar escopo, identidade visual e categorias").
const CATEGORIAS = [
  "Assédio moral ou sexual",
  "Discriminação (raça, gênero, religião etc.)",
  "Abuso de poder ou conduta abusiva",
  "Fraude, corrupção ou irregularidade financeira",
  "Conduta inadequada de funcionário ou colaborador",
  "Descumprimento de leis, normas ou políticas internas",
  "Outro",
];

async function main() {
  for (const [i, nome] of CATEGORIAS.entries()) {
    await prisma.categoria.upsert({
      where: { nome },
      update: { ordem: i + 1, ativo: true },
      create: { nome, ordem: i + 1 },
    });
  }
  // Desativa (sem apagar, pra preservar denúncias já vinculadas) o que saiu da lista.
  const desativadas = await prisma.categoria.updateMany({
    where: { nome: { notIn: CATEGORIAS } },
    data: { ativo: false },
  });
  console.log(
    `Seed concluído: ${CATEGORIAS.length} categorias ativas, ${desativadas.count} desativadas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
