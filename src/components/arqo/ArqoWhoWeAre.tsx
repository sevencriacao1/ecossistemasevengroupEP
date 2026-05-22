import { ArqoSection, ArqoReveal, ArqoTitle } from './ArqoPrimitives';

const blocks = [
  'A ARQO existe para direcionar escolhas com estratégia, percepção e leitura de cenário.',
  'Mais do que apresentar imóveis, estruturamos decisões.',
  'Cada cliente possui um contexto. Cada patrimônio possui um objetivo. Cada investimento exige uma leitura diferente.',
  'Por isso, nossa atuação começa antes do imóvel. Começa no entendimento profundo do investidor.',
];

export function ArqoWhoWeAre() {
  return (
    <ArqoSection id="quem-somos" className="bg-[#F8F7F3]">
      <div className="grid gap-14 min-[1366px]:grid-cols-[0.42fr_0.58fr]">
        <div className="min-[1366px]:sticky min-[1366px]:top-32 min-[1366px]:h-fit">
          <ArqoTitle
            eyebrow="Quem Somos"
            title="Inteligência imobiliária construída para transformar excesso em clareza."
          />
        </div>

        <div className="space-y-5">
          {blocks.map((block, index) => (
            <ArqoReveal
              key={block}
              delay={index * 0.05}
              className="rounded-[26px] border border-black/[0.06] bg-white/64 p-7 text-xl font-medium leading-9 tracking-[-0.02em] text-[#302E2A] shadow-[0_20px_64px_rgba(34,33,29,0.05)] backdrop-blur-2xl"
            >
              {block}
            </ArqoReveal>
          ))}
        </div>
      </div>
    </ArqoSection>
  );
}
