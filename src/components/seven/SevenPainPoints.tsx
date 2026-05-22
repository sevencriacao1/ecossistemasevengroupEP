import { painPoints } from './sevenContent';
import { Reveal, SectionHeader } from './SevenPrimitives';

export function SevenPainPoints() {
  return (
    <section className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Dores do mercado"
          title="Hoje, não basta apenas construir."
          description="Empreendimentos de alta performance exigem estratégia, posicionamento e execução. A resposta da Seven nasce exatamente onde a operação tradicional perde força."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2 min-[1366px]:grid-cols-3">
          {painPoints.map((item) => (
            <Reveal key={item.pain}>
              <div className="h-full rounded-[30px] border border-black/[0.06] bg-[#F7F7F8] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_70px_rgba(17,17,20,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A1A1AA]">Dor</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111114]">{item.pain}</h3>
                <div className="my-6 h-px bg-black/[0.08]" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E76912]">Resposta Seven</p>
                <p className="mt-3 text-base leading-7 text-[#606068]">{item.answer}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
