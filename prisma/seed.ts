import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Categorias PROVISÓRIAS. A lista final é definida no kickoff com a Mansão Green
// (tarefa "Kickoff: validar escopo, identidade visual e categorias").
const CATEGORIAS = [
  "Indução ou assédio para apostar",
  "Propaganda enganosa",
  "Vício em apostas (desabafo / pedido de ajuda)",
  "Golpe ou fraude financeira",
  "Conteúdo direcionado a menores de idade",
  "Prejuízo ou endividamento",
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
  console.log(`Seed concluído: ${CATEGORIAS.length} categorias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
