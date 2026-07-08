import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { RoleAdmin } from "@/generated/prisma/client";

// Auth.js v5. Sessão JWT (stateless) — obrigatório com Credentials. A validação
// de senha é feita contra a tabela AdminUser (equipe interna da Mansão Green).
// `AUTH_SECRET` é lido do ambiente automaticamente.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/painel/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credenciais) => {
        const email = String(credenciais?.email ?? "")
          .toLowerCase()
          .trim();
        const senha = String(credenciais?.password ?? "");
        if (!email || !senha) return null;

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user || !user.ativo) return null;

        const ok = await bcrypt.compare(senha, user.senhaHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as RoleAdmin;
      }
      return session;
    },
  },
});
