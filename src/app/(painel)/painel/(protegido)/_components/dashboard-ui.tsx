import Link from "next/link";

/** Cartão de indicador (KPI). Vira link quando `href` é passado. */
export function CartaoKpi({
  rotulo,
  valor,
  detalhe,
  destaque,
  href,
}: {
  rotulo: string;
  valor: string | number;
  detalhe?: string;
  destaque?: "primary" | "warning" | "danger" | "success";
  href?: string;
}) {
  const corValor =
    destaque === "warning"
      ? "text-warning"
      : destaque === "danger"
        ? "text-danger"
        : destaque === "success"
          ? "text-success"
          : "text-content";

  const conteudo = (
    <div className="section-card h-full px-5 py-4 transition hover:border-edge-hover">
      <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
        {rotulo}
      </p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${corValor}`}>
        {valor}
      </p>
      {detalhe && (
        <p className="mt-1 text-xs text-content-tertiary">{detalhe}</p>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block focus:outline-none">
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}

/** Lista de barras horizontais (ex.: denúncias por categoria). */
export function BarrasHorizontais({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { nome: string; total: number; cor?: string }[];
}) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  return (
    <div className="section-card p-5">
      <p className="mb-4 text-xs uppercase tracking-[0.14em] text-content-secondary">
        {titulo}
      </p>
      {itens.every((i) => i.total === 0) ? (
        <p className="text-sm text-content-tertiary">Sem dados ainda.</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((i) => (
            <li key={i.nome}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-content">{i.nome}</span>
                <span className="tabular-nums font-semibold text-content-secondary">
                  {i.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canvas-subtle">
                <div
                  className={`h-full rounded-full ${i.cor ?? "bg-primary"}`}
                  style={{ width: `${(i.total / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Mini gráfico de colunas para série temporal (últimos 30 dias). */
export function ColunasSerie({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { dia: string; data: string; total: number }[];
}) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  const totalPeriodo = itens.reduce((n, i) => n + i.total, 0);
  return (
    <div className="section-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-content-secondary">
          {titulo}
        </p>
        <p className="text-xs text-content-tertiary">
          {totalPeriodo} no período
        </p>
      </div>
      <div className="flex h-24 items-end gap-[3px]">
        {itens.map((i, idx) => (
          <div
            key={idx}
            title={`${i.data}: ${i.total}`}
            className="group flex-1 rounded-t bg-primary/25 transition hover:bg-primary"
            style={{ height: `${Math.max(4, (i.total / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-content-tertiary">
        <span>{itens[0]?.data ?? ""}</span>
        <span>{itens[itens.length - 1]?.data ?? ""}</span>
      </div>
    </div>
  );
}
