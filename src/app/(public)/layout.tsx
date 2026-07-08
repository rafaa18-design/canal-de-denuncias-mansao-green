import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="inline-flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mansao-green-logo.png"
              alt="Mansão Green"
              width={49}
              height={28}
              className="h-7 w-auto"
            />
            <span
              translate="no"
              className="border-l border-edge pl-2.5 text-sm font-bold tracking-tight text-content"
            >
              Canal de Denúncias
            </span>
          </Link>
          <Link
            href="/acompanhar"
            className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-primary transition hover:bg-canvas-subtle"
          >
            Acompanhar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
        {children}
      </main>

      <footer className="border-t border-edge">
        <p className="mx-auto max-w-xl px-5 py-6 text-xs leading-relaxed text-content-secondary">
          Este canal é{" "}
          <strong className="font-bold text-content">100% anônimo</strong>. Não
          guardamos seu nome, contato, IP nem nada que te identifique. O
          acompanhamento é feito só pelo número de protocolo que você recebe ao
          enviar.
        </p>
      </footer>
    </div>
  );
}
