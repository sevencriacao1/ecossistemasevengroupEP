import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { expertise } from './sevenContent';
import { IconBadge, Reveal, SectionHeader } from './SevenPrimitives';

function ExpertiseFlipCard({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="h-[190px]">
      <motion.div
        className="flex h-full flex-col justify-between rounded-[30px] border border-black/[0.06] bg-white/76 p-6 shadow-[0_24px_70px_rgba(17,17,20,0.08)] backdrop-blur-2xl transition-colors duration-300 hover:bg-white"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <IconBadge icon={Icon} />
        </div>
        <h3 className="text-lg font-semibold leading-tight tracking-[-0.025em] text-[#111114]">
          {title}
        </h3>
      </motion.div>
    </div>
  );
}

export function SevenAbout() {
  return (
    <section id="quem-somos" className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Quem é a Seven Group"
          title="Inteligência, percepção de valor e execução no mesmo ecossistema."
          description="A Seven atua desde a concepção do empreendimento até sua performance comercial, integrando as frentes que fazem um produto imobiliário ganhar mercado."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 min-[1366px]:grid-cols-5">
          {expertise.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.03}>
              <ExpertiseFlipCard icon={item.icon} title={item.title} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
