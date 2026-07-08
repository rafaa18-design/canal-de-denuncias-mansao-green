import { NextResponse, type NextRequest } from "next/server";

// Pré-filtro OTIMISTA do painel (Next.js 16: `proxy` substitui `middleware`).
// Só lê a presença do cookie de sessão do Auth.js — não valida assinatura nem
// acessa o banco (roda em toda navegação/prefetch). A verificação REAL da
// sessão é feita no layout do painel via `auth()`, que é a fronteira de
// segurança. Ver guia de autenticação do Next.js (optimistic checks + DAL).
const COOKIES_SESSAO = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/painel/login") {
    return NextResponse.next();
  }

  const temSessao = COOKIES_SESSAO.some((nome) => request.cookies.has(nome));
  if (!temSessao) {
    const url = request.nextUrl.clone();
    url.pathname = "/painel/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*"],
};
