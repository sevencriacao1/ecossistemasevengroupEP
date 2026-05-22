import { ArqoSection, ArqoTitle, StableTextReveal } from './ArqoPrimitives';
import { differentialWords } from './arqoContent';

export function ArqoDifferential() {
  return (
    <ArqoSection className="bg-[#EFEEE8]">
      <div className="grid gap-14 min-[1366px]:grid-cols-[0.42fr_0.58fr]">
        <ArqoTitle
          eyebrow="O Diferencial ARQO"
          title="O cliente não compra apenas um imóvel."
          subtitle="Compra segurança, direção, percepção de valor, visão de futuro e tranquilidade na decisão."
        />

        <div>
          <div className="grid gap-3">
            {differentialWords.map((word) => (
              <div key={word} className="rounded-[26px] border border-black/[0.06] bg-white/50 px-6 py-5 backdrop-blur-xl">
                <StableTextReveal
                  text={word}
                  as="p"
                  className="arqo-heading text-3xl font-medium leading-none tracking-[-0.045em] text-[#171715] sm:text-5xl"
                />
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-lg leading-8 text-[#625F57]">
            Por isso, a ARQO atua como inteligência imobiliária. Filtrando oportunidades. Organizando possibilidades. Transformando excesso em clareza.
          </p>
        </div>
      </div>
    </ArqoSection>
  );
}
