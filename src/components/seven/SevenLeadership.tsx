import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { leaders } from './sevenContent';
import { AssetFrame, IconBadge, Reveal, SectionHeader } from './SevenPrimitives';

function LeadershipSpread({ leader, index }: { leader: (typeof leaders)[number]; index: number }) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const numberY = useTransform(scrollYProgress, [0, 1], [-34, 48]);
  const background = index % 2 === 0 ? 'bg-white' : 'bg-[#F7F7F8]';

  return (
    <section ref={ref} className={`relative min-h-[100svh] overflow-hidden px-5 py-[clamp(5.5rem,11svh,8rem)] sm:px-8 lg:px-10 ${background}`}>
      <motion.span
        style={{ y: numberY }}
        className="pointer-events-none absolute right-4 top-16 text-[26vw] font-semibold leading-none tracking-[-0.12em] text-black/[0.035]"
      >
        {String(index + 1).padStart(2, '0')}
      </motion.span>
      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-12rem)] max-w-7xl items-center gap-10 min-[1366px]:grid-cols-[minmax(340px,0.92fr)_minmax(0,1.08fr)]">
        <motion.div style={{ y: imageY }} className={index % 2 === 1 ? 'lg:order-2' : ''}>
          <AssetFrame
            src={leader.image}
            alt={`Foto de ${leader.name}`}
            initials={leader.initials}
            label={leader.role}
            className="min-h-[340px] shadow-[0_34px_100px_rgba(17,17,20,0.16)] sm:min-h-[460px] min-[1366px]:min-h-[min(640px,calc(100svh-12rem))]"
          />
        </motion.div>
        <div className="relative">
          <Reveal>
            <div className="mb-8 flex items-center gap-4">
              <IconBadge icon={leader.icon} />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#E76912]">{leader.role}</p>
            </div>
            <h3 className="text-4xl font-semibold leading-[0.94] tracking-[-0.055em] text-[#111114] sm:text-5xl xl:text-6xl">
              {leader.name}
            </h3>
            <p className="mt-8 max-w-3xl text-xl font-medium leading-8 tracking-[-0.025em] text-[#2A2A30]">
              {leader.intro}
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#65656D]">{leader.body}</p>
          </Reveal>
          <Reveal>
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {leader.capabilities.map((capability) => (
                <div
                  key={capability}
                  className="rounded-2xl border border-black/[0.06] bg-white/78 px-4 py-3 text-sm font-medium text-[#333338] shadow-[0_12px_34px_rgba(17,17,20,0.05)] backdrop-blur-xl"
                >
                  {capability}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <p className="mt-9 rounded-[26px] bg-[#111114] px-6 py-5 text-base font-semibold leading-7 text-white shadow-[0_24px_70px_rgba(17,17,20,0.18)]">
              {leader.highlight}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function SevenLeadership() {
  return (
    <section id="lideranca" className="bg-[#F7F7F8]">
      <div className="px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Liderança estratégica"
            title="Pessoas que conectam visão, operação e percepção de mercado."
            description="A liderança da Seven sustenta a expansão nacional com estratégia, execução e leitura profunda do produto imobiliário."
          />
        </div>
      </div>
      {leaders.map((leader, index) => (
        <LeadershipSpread key={leader.name} leader={leader} index={index} />
      ))}
    </section>
  );
}
