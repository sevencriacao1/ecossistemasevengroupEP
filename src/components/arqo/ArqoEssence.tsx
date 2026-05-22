import { motion, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArqoSection, ArqoTitle, StableTextReveal, useArqoElementScrollProgress } from './ArqoPrimitives';

export function ArqoEssence() {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollYProgress = useArqoElementScrollProgress(ref, 0.8, 0.24);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 26]);

  return (
    <ArqoSection id="essencia" className="bg-[#EFEEE8] py-16 lg:py-20">
      <div ref={ref} className="relative overflow-hidden rounded-[36px] border border-black/[0.07] bg-white/72 px-6 py-16 shadow-[0_24px_80px_rgba(34,33,29,0.055)] backdrop-blur-2xl sm:px-10 lg:px-16 lg:py-20">
        <motion.div style={{ rotate }} className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-96 w-96 rounded-full border border-black/[0.055]">
          <div className="absolute inset-12 rounded-full border border-black/[0.045]" />
          <div className="absolute inset-24 rounded-full border border-black/[0.04]" />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <ArqoTitle eyebrow="Essência da Marca" title="Fazer o cliente querer antes de entender." align="center" />
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#625F57]">
            A ARQO acredita que percepção antecede explicação. Antes de racionalizar um investimento, o cliente precisa sentir coerência, direção e valor.
          </p>
          <StableTextReveal
            text="Cada detalhe da experiência é desenhado para transmitir confiança, inteligência e pertencimento."
            as="p"
            className="arqo-heading mx-auto mt-12 max-w-4xl text-balance text-3xl font-medium leading-[1.14] tracking-[-0.04em] text-[#171715] sm:text-5xl"
          />
        </div>
      </div>
    </ArqoSection>
  );
}
