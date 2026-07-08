import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const metadata = {
  title: "Painel — Canal de Denúncias",
  robots: { index: false, follow: false },
};

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fronteira de segurança REAL: valida a sessão (não é só o cookie otimista do
  // proxy). Sem sessão → login.
  const session = await auth();
  if (!session?.user) redirect("/painel/login");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-edge bg-canvas-elevated">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/painel" className="inline-flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mansao-green-logo.png"
              alt="Mansão Green"
              width={42}
              height={24}
              className="h-6 w-auto"
            />
            <span
              translate="no"
              className="border-l border-edge pl-2.5 text-[15px] font-bold leading-none tracking-tight text-content"
            >
              Painel · Canal de Denúncias
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs text-content-secondary">
            <span className="hidden sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/painel/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-edge px-2.5 py-1 font-semibold text-content-secondary transition hover:border-edge-hover hover:bg-canvas-subtle hover:text-content"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-7">
        {children}
      </main>
    </div>
  );
}
