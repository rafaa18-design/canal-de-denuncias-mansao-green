"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/painel", rotulo: "Visão geral" },
  { href: "/painel/denuncias", rotulo: "Denúncias" },
];

export function NavPainel() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex w-full max-w-5xl gap-1 px-5">
      {ABAS.map((aba) => {
        const ativa =
          aba.href === "/painel"
            ? pathname === "/painel"
            : pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              ativa
                ? "border-primary text-content"
                : "border-transparent text-content-secondary hover:text-content"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
