"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { erro: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/painel",
    });
    return null;
  } catch (error) {
    // signIn lança um redirect (NEXT_REDIRECT) em caso de sucesso — repassar.
    if (error instanceof AuthError) {
      return { erro: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}
