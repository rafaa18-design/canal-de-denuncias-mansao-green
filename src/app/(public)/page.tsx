import { prisma } from "@/lib/prisma";
import { FormularioDenuncia } from "./_components/formulario-denuncia";

export const dynamic = "force-dynamic";

async function carregarCategorias() {
  try {
    return await prisma.categoria.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true, descricao: true },
    });
  } catch {
    return null;
  }
}

export default async function Page() {
  const categorias = await carregarCategorias();

  return (
    <div className="space-y-7">
      <header className="animate-slide-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Espaço seguro e anônimo
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-content sm:text-4xl">
          Fale sobre apostas, sem se expor.
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-content-secondary">
          Denuncie ou apenas desabafe. Sem nome, sem contato, sem rastro — só
          você e o que precisa contar.
        </p>
      </header>

      <div className="animate-slide-up-2">
        {categorias === null ? (
          <p className="section-card border-warning/25 bg-warning/5 px-5 py-4 text-sm text-warning">
            O canal está em configuração. Volte em instantes.
          </p>
        ) : categorias.length === 0 ? (
          <p className="section-card border-warning/25 bg-warning/5 px-5 py-4 text-sm text-warning">
            Nenhuma categoria configurada ainda.
          </p>
        ) : (
          <FormularioDenuncia categorias={categorias} />
        )}
      </div>
    </div>
  );
}
