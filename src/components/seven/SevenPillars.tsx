import { pillars } from './sevenContent';
import { motion } from 'framer-motion';
import { IconBadge, SectionHeader } from './SevenPrimitives';

export function SevenPillars() {
  return (
    <section id="pilares" className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Os sete pilares"
          title="Sete frentes que transformam produto em movimento de mercado."
          description="Cada pilar funciona como uma lâmina institucional: diagnóstico, estratégia, execução e percepção visual trabalhando em continuidade."
          align="center"
        />
        <div className="mt-16 space-y-12 pb-24">
          {pillars.map((pillar, index) => (
              <motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 70, rotateX: 5 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: false, amount: 0.25 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="sticky rounded-[34px] border border-black/[0.06] bg-white p-6 shadow-[0_30px_100px_rgba(17,17,20,0.14)] sm:p-8 min-[1366px]:grid min-[1366px]:grid-cols-[0.6fr_1.4fr] min-[1366px]:gap-10"
                style={{ top: `${92 + Math.min(index, 6) * 12}px`, zIndex: 10 + index }}
              >
                <div className="flex flex-col justify-between gap-8">
                  <div>
                    <span className="text-7xl font-semibold leading-none tracking-[-0.09em] text-black/[0.08]">{pillar.number}</span>
                    <IconBadge icon={pillar.icon} className="mt-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#E76912]">Pilar {pillar.number}</p>
                </div>
                <div className="mt-8 lg:mt-0">
                  <h3 className="text-4xl font-semibold tracking-[-0.055em] text-[#111114] sm:text-5xl">{pillar.title}</h3>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-[#606068]">{pillar.description}</p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {pillar.deliveries.map((delivery) => (
                      <div key={delivery} className="rounded-2xl border border-black/[0.06] bg-[#F7F7F8] px-4 py-3 text-sm font-medium text-[#333338]">
                        {delivery}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
