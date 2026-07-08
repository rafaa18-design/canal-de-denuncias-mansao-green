import { ConsultaProtocolo } from "./_components/consulta-protocolo";

export const metadata = { title: "Acompanhar — Canal de Denúncias" };

export default function Page() {
  return (
    <div className="space-y-7">
      <header className="animate-slide-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Acompanhar
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-content sm:text-4xl">
          Como está sua mensagem?
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-content-secondary">
          Digite o número de protocolo que você guardou. É só ele que liga você
          à sua mensagem.
        </p>
      </header>

      <div className="animate-slide-up-2">
        <ConsultaProtocolo />
      </div>
    </div>
  );
}
