import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ecosystemSteps } from './sevenContent';
import { IconBadge, Reveal, SectionHeader } from './SevenPrimitives';

function StepRow({
  steps,
  progress,
  range,
  startIndex,
}: {
  steps: typeof ecosystemSteps;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  range: [number, number];
  startIndex: number;
}) {
  const lineScale = useTransform(progress, range, [0, 1]);

  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-0 hidden h-px bg-black/10 lg:block" />
      <motion.div
        style={{ scaleX: lineScale, transformOrigin: 'left' }}
        className="absolute left-0 right-0 top-0 hidden h-px bg-[#E76912] lg:block"
      />
      <div className="grid items-stretch gap-4 pt-12 sm:grid-cols-2 min-[1366px]:grid-cols-4">
        {steps.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.04}>
            <motion.article
              whileHover={{ y: -8, rotateX: 2 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-full min-h-[260px] flex-col rounded-[30px] border border-black/[0.06] bg-white/86 p-6 shadow-[0_24px_70px_rgba(17,17,20,0.08)] backdrop-blur-2xl"
            >
              <span className="absolute -top-[58px] left-6 hidden h-5 w-5 rounded-full border-4 border-white bg-[#E76912] shadow-[0_0_0_1px_rgba(231,105,18,0.28)] lg:block" />
              <IconBadge icon={step.icon} />
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-[#E76912]">
                Etapa {String(startIndex + index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#111114]">{step.title}</h3>
              <p className="mt-4 text-base leading-7 text-[#666670]">{step.description}</p>
            </motion.article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function SevenEcosystem() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 82%', 'end 52%'] });
  const bg = useTransform(scrollYProgress, [0, 0.5, 1], ['#F7F7F8', '#FFFFFF', '#F3F3F4']);
  const firstRow = ecosystemSteps.slice(0, 4);
  const secondRow = ecosystemSteps.slice(4);

  return (
    <motion.section
      ref={ref}
      id="ecossistema"
      style={{ backgroundColor: bg }}
      className="relative overflow-hidden px-5 py-28 sm:px-8 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(17,17,20,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,20,0.045)_1px,transparent_1px)] bg-[size:84px_84px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Nosso ecossistema estratégico"
          title="Da concepção ao sucesso."
          description="A Seven estruturou um modelo integrado capaz de acompanhar o empreendimento em todas as etapas, conectando pesquisa, estratégia, visual, marketing, operação e performance."
          align="center"
        />
        <div className="mt-16 space-y-12">
          <StepRow steps={firstRow} progress={scrollYProgress} range={[0.08, 0.42]} startIndex={0} />
          <StepRow steps={secondRow} progress={scrollYProgress} range={[0.44, 0.78]} startIndex={4} />
        </div>
      </div>
    </motion.section>
  );
}
