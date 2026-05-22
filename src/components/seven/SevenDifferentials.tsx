import { differentials } from './sevenContent';
import { IconBadge, PremiumCard, Reveal, SectionHeader } from './SevenPrimitives';

export function SevenDifferentials() {
  return (
    <section className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Diferenciais competitivos"
          title="Uma estrutura criada para reduzir improviso e aumentar velocidade."
          description="A Seven integra inteligência de mercado, diagnóstico, criação, tráfego, CRM, comercial e estratégia dentro do mesmo desenho operacional."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 min-[1366px]:grid-cols-5">
          {differentials.map((item) => (
            <Reveal key={item.title}>
              <PremiumCard className="h-full min-h-[240px]">
                <IconBadge icon={item.icon} />
                <h3 className="mt-7 text-xl font-semibold leading-tight tracking-[-0.035em] text-[#111114]">{item.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[#666670]">{item.description}</p>
              </PremiumCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
