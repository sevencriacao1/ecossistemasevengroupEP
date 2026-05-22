import { motion, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArqoSection, StableTextReveal, useArqoElementScrollProgress } from './ArqoPrimitives';

const excessLines = ['Excesso de opções.', 'Excesso de pressão.', 'Excesso de informação.'];

export function ArqoManifesto() {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollYProgress = useArqoElementScrollProgress(ref, 0.82, 0.18);
  const axisScale = useTransform(scrollYProgress, [0.08, 0.72], [0.08, 1]);
  const excessY = useTransform(scrollYProgress, [0, 1], [24, -18]);
  const clarityY = useTransform(scrollYProgress, [0.18, 1], [34, -10]);

  return (
    <ArqoSection id="manifesto" className="bg-white py-24 lg:py-36">
      <div ref={ref} className="relative">
        <div className="pointer-events-none absolute -left-10 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-black/10 to-transparent min-[1366px]:block" />

        <div className="grid gap-16 min-[1366px]:grid-cols-[0.34fr_0.66fr] min-[1366px]:items-start">
          <aside className="min-[1366px]:sticky min-[1366px]:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#7B786E]">Manifesto</p>
            <div className="mt-10 hidden min-[1366px]:block">
              <p className="arqo-heading origin-left -rotate-90 translate-y-64 text-[clamp(5rem,8vw,8.8rem)] font-medium leading-none tracking-[-0.075em] text-[#E5E1D8]">
                ARQO
              </p>
            </div>
          </aside>

          <article className="relative">
            <div className="grid gap-8 border-b border-black/[0.08] pb-14 min-[1366px]:grid-cols-[0.64fr_0.36fr] min-[1366px]:items-end">
              <div>
                <p className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#9A9488]">01 / tese</p>
                <StableTextReveal
                  text="A ARQO não nasceu para vender imóveis."
                  as="h2"
                  className="arqo-heading max-w-4xl text-balance text-[2.65rem] font-medium leading-[1.02] tracking-[-0.05em] text-[#171715] sm:text-7xl min-[1366px]:text-[clamp(4.8rem,7.2vw,8.4rem)]"
                />
              </div>

              <div className="relative overflow-hidden border-l border-black/[0.08] pl-6">
                <p className="arqo-heading text-balance text-3xl font-medium leading-[1.05] tracking-[-0.04em] text-[#171715] sm:text-4xl">
                  Nasceu para organizar decisões.
                </p>
                <p className="mt-6 text-sm leading-7 text-[#6D6A62]">Percebemos que o mercado criou excesso.</p>
              </div>
            </div>

            <div className="relative grid gap-10 py-14 min-[1366px]:grid-cols-[0.48fr_0.04fr_0.48fr] min-[1366px]:gap-8 min-[1366px]:py-20">
              <motion.div style={{ y: excessY }} className="relative">
                <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#9A9488]">02 / ruído</p>
                <div className="space-y-3">
                  {excessLines.map((line, index) => (
                    <p
                      key={line}
                      className="arqo-heading text-balance text-4xl font-medium leading-[0.98] tracking-[-0.05em] text-[#171715] sm:text-6xl"
                      style={{ opacity: 1 - index * 0.18 }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </motion.div>

              <div className="relative hidden min-[1366px]:block">
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/[0.08]" />
                <motion.div
                  style={{ scaleY: axisScale }}
                  className="absolute left-1/2 top-0 h-full w-px origin-top -translate-x-1/2 bg-[#171715]"
                />
              </div>

              <motion.div style={{ y: clarityY }} className="relative min-[1366px]:pt-20">
                <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#9A9488]">03 / direção</p>
                <div className="space-y-8">
                  <p className="text-xl leading-9 tracking-[-0.01em] text-[#4E4B45]">
                    Mas clareza não nasce do volume. Nasce da direção.
                  </p>
                  <p className="text-xl leading-9 tracking-[-0.01em] text-[#4E4B45]">
                    Por isso, a ARQO atua como inteligência imobiliária aplicada à decisão.
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="relative overflow-hidden bg-[#171715] px-6 py-10 text-white sm:px-10 lg:px-12">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px] opacity-35" />
              <div className="relative grid gap-8 min-[1366px]:grid-cols-[0.25fr_0.75fr] min-[1366px]:items-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/48">Critério final</p>
                <p className="arqo-heading text-balance text-3xl font-medium leading-[1.12] tracking-[-0.035em] text-white sm:text-5xl">
                  “O melhor investimento não é o mais caro. É o mais coerente com aquele momento de vida.”
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </ArqoSection>
  );
}
