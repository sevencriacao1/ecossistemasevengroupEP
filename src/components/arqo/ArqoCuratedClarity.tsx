import { motion, useTransform } from 'framer-motion';
import { CSSProperties, useRef } from 'react';
import { ArqoSection, StableTextReveal, useArqoElementScrollProgress } from './ArqoPrimitives';

const cloudOptions = [
  'Preço',
  'Localização',
  'Liquidez',
  'Prazo',
  'Risco',
  'Perfil',
  'Momento',
  'Objetivo',
  'Retorno',
  'Financiamento',
  'Valorização',
  'Taxas',
  'Oferta',
  'Urgência',
  'Potencial',
  'Comparação',
  'Metragem',
  'Bairro',
  'Timing',
];

export function ArqoCuratedClarity() {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollYProgress = useArqoElementScrollProgress(ref, 0.92, 0.56);
  const blur = useTransform(scrollYProgress, [0, 0.18], ['blur(2px)', 'blur(0px)']);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.72, 1]);
  const beforeOpacity = useTransform(scrollYProgress, [0, 0.24], [1, 0.42]);

  return (
    <ArqoSection id="curadoria" className="bg-white py-28 lg:py-40">
      <div ref={ref} className="relative grid gap-16 min-[1366px]:grid-cols-[0.42fr_0.58fr] min-[1366px]:items-center">
        <div>
          <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#7B786E]">Curadoria</p>
          <StableTextReveal
            text="Não mostramos tudo. Mostramos o que faz sentido."
            as="h2"
            className="arqo-heading text-balance text-5xl font-medium leading-[1.02] tracking-[-0.05em] text-[#171715] sm:text-6xl"
          />
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#625F57]">
            A ARQO filtra o excesso, organiza possibilidades e apresenta apenas oportunidades coerentes com o momento, perfil e objetivo do cliente.
          </p>
        </div>

        <div className="grid items-stretch gap-4 sm:grid-cols-2">
          <motion.div
            style={{ opacity: beforeOpacity }}
            className="relative min-h-[460px] overflow-hidden border border-black/[0.07] bg-[#F2F0EB] p-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#969084]">Antes</p>
            <div className="absolute inset-0 top-16">
              {cloudOptions.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="arqo-cloud-token absolute rounded-full border border-black/[0.055] bg-white/48 px-4 py-2 text-sm font-medium text-[#6D6A62]"
                  style={{
                    left: `${4 + (index * 23) % 78}%`,
                    top: `${4 + (index * 13) % 78}%`,
                    filter: `blur(${0.7 + (index % 4) * 0.55}px)`,
                    opacity: (0.18 + (index % 5) * 0.1) * 5,
                    '--cloud-x': `${index % 3 ? -8 : 8}px`,
                    '--cloud-y': `${index % 2 ? 12 : -12}px`,
                    '--cloud-duration': `${5.4 + index * 0.16}s`,
                    '--cloud-delay': `${index * -0.37}s`,
                  } as CSSProperties}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(23,23,21,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(23,23,21,0.035)_1px,transparent_1px)] bg-[size:26px_26px] opacity-40" />
          </motion.div>

          <motion.div
            style={{ filter: blur, opacity }}
            className="relative flex min-h-[460px] flex-col justify-between overflow-hidden border border-black/[0.08] bg-[#171715] p-6 text-white shadow-[0_32px_90px_rgba(23,23,21,0.18)]"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/50">Depois</p>
              <div className="mt-16 h-px w-full bg-white/16" />
              <div className="mx-auto mt-8 flex h-44 w-44 items-center justify-center rounded-full border border-white/18">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/24">
                  <div className="arqo-clarity-pulse h-3 w-3 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <div>
              <p className="arqo-heading text-4xl font-medium tracking-[-0.04em]">Uma decisão nítida.</p>
              <p className="mt-4 text-sm leading-6 text-white/62">Menos ruído. Mais coerência. Mais segurança.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </ArqoSection>
  );
}
