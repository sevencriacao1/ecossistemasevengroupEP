import { cityCommitments } from './sevenContent';
import { IconBadge, Reveal, SectionHeader } from './SevenPrimitives';

export function SevenCommitment() {
  return (
    <section id="compromisso" className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Compromisso com as cidades"
          title="Quando entramos em um mercado, buscamos fortalecer a cidade."
          description="O trabalho da Seven eleva o nível estratégico dos lançamentos, organiza a venda, gera oportunidades e cria projetos valorizados."
          align="center"
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 min-[1366px]:grid-cols-5">
          {cityCommitments.map((item) => (
            <Reveal key={item.title}>
              <div className="h-full rounded-[28px] border border-black/[0.06] bg-[#F7F7F8] p-5 text-center">
                <IconBadge icon={item.icon} className="mx-auto" />
                <p className="mt-6 text-sm font-semibold leading-6 text-[#333338]">{item.title}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
