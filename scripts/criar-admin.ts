// Cria ou atualiza um usuário da equipe (painel). Senha via bcrypt.
// Uso: ADMIN_EMAIL=.. ADMIN_NOME=".." ADMIN_SENHA=.. [ADMIN_ROLE=ADMIN] pnpm admin:criar
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type RoleAdmin } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  const nome = (process.env.ADMIN_NOME ?? "").trim();
  const senha = process.env.ADMIN_SENHA ?? "";
  const role = (process.env.ADMIN_ROLE ?? "ADMIN") as RoleAdmin;

  if (!email || !nome || !senha) {
    console.error(
      'Uso: ADMIN_EMAIL=.. ADMIN_NOME=".." ADMIN_SENHA=.. [ADMIN_ROLE=ADMIN|ANALISTA] pnpm admin:criar',
    );
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("A senha deve ter ao menos 8 caracteres.");
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { nome, senhaHash, role, ativo: true },
    create: { email, nome, senhaHash, role },
  });
  console.log(`Admin pronto: ${user.email} (${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
