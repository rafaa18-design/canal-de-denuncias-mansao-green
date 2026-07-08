import type { RoleAdmin } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: RoleAdmin;
  }
  interface Session {
    user: {
      id: string;
      role: RoleAdmin;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: RoleAdmin;
  }
}
