import { MapPinned } from 'lucide-react';
import { addresses } from './sevenContent';
import { IconBadge, PremiumCard, Reveal, SectionHeader } from './SevenPrimitives';

function splitAddress(address: string) {
  const [city, ...rest] = address.split(' - ');
  return {
    city: city.toUpperCase(),
    address: rest.join(' - '),
  };
}

export function SevenMetrics() {
  return (
    <section id="estrutura" className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Estrutura nacional"
          title="Presença em mais de 30 cidades e 9 estados brasileiros."
          description="A Seven atua no Sul, Sudeste, Centro-Oeste e Nordeste, com operação física em Dourados/MS e Santa Maria/RS."
        />
        <div className="mt-14 grid gap-4 min-[1366px]:grid-cols-2">
          {addresses.map((item) => {
            const address = splitAddress(item);

            return (
              <Reveal key={item}>
                <PremiumCard className="flex items-start gap-4">
                  <IconBadge icon={MapPinned} className="shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E76912]">Unidade física</p>
                    <h3 className="mt-2 text-xl font-semibold uppercase tracking-[-0.02em] text-[#111114]">{address.city}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#666670]">{address.address}</p>
                  </div>
                </PremiumCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
