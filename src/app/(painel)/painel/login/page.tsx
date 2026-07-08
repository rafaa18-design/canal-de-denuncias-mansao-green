import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./_components/login-form";

export const metadata = { title: "Entrar — Painel" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/painel");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="animate-slide-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mansao-green-logo.png"
          alt="Mansão Green"
          width={70}
          height={40}
          className="h-10 w-auto"
        />
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-content">
          Painel da equipe
        </h1>
        <p className="mt-1.5 text-sm text-content-secondary">
          Acesso restrito à equipe Mansão Green.
        </p>
      </div>
      <div className="section-card animate-slide-up-2 mt-6 p-6">
        <LoginForm />
      </div>
    </div>
  );
}
