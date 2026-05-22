import { Check } from 'lucide-react';
import { ArqoCard, ArqoIconBadge, ArqoSection, ArqoTitle } from './ArqoPrimitives';
import { profileItems } from './arqoContent';

export function ArqoHowWeWork() {
  return (
    <ArqoSection id="metodo" className="bg-[#F8F7F3]">
      <div className="grid gap-14 min-[1366px]:grid-cols-[0.42fr_0.58fr] min-[1366px]:items-start">
        <div className="min-[1366px]:sticky min-[1366px]:top-32">
          <ArqoTitle
            eyebrow="Como Atuamos"
            title="Não forçamos vendas. Direcionamos escolhas."
            subtitle="A ARQO cria um perfil estratégico para cada investidor antes de apresentar qualquer imóvel."
          />
          <p className="mt-8 text-2xl font-medium tracking-[-0.03em] text-[#2C2A26]">“Confiança vale mais do que pressão.”</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {profileItems.map((item, index) => (
            <ArqoCard key={item.title} className="min-h-[190px]">
              <div className="flex items-start justify-between gap-4">
                <ArqoIconBadge icon={item.icon} />
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.06] bg-[#F8F7F3] text-[#6E6A60]">
                  <Check className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.24em] text-[#969084]">0{index + 1}</p>
              <h3 className="arqo-heading mt-3 text-2xl font-medium tracking-[-0.035em] text-[#171715]">{item.title}</h3>
            </ArqoCard>
          ))}
        </div>
      </div>
    </ArqoSection>
  );
}
