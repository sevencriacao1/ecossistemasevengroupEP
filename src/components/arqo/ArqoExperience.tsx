import { motion, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArqoSection, ArqoTitle, useArqoElementScrollProgress } from './ArqoPrimitives';

function ArqoExperienceImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[28px] border border-black/[0.07] bg-[#F2F0EB] ${className ?? ''}`}>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(23,23,21,0.12))]" />
      <div className="absolute inset-5 rounded-[22px] border border-white/24 mix-blend-screen" />
      <div className="absolute left-7 top-7 h-px w-3/5 bg-white/26 mix-blend-screen" />
      <div className="absolute bottom-7 right-7 h-3/5 w-px bg-white/22 mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),inset_0_-44px_80px_rgba(23,23,21,0.16)]" />
    </div>
  );
}

export function ArqoExperience() {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollYProgress = useArqoElementScrollProgress(ref, 0.84, 0.24);
  const y = useTransform(scrollYProgress, [0, 1], [36, -32]);

  return (
    <ArqoSection className="bg-white">
      <div ref={ref} className="relative grid gap-12 min-[1366px]:grid-cols-[0.48fr_0.52fr] min-[1366px]:items-center">
        <div>
          <ArqoTitle
            eyebrow="Experiência e Percepção"
            title="Transformar o produto em marca e gerar desejo."
            subtitle="A função da ARQO dentro do ecossistema imobiliário é construir percepção."
          />
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#625F57]">
            Traduzimos empreendimentos em posicionamento, desejo e valor percebido.
          </p>
        </div>

        <motion.div style={{ y }} className="grid gap-4 sm:grid-cols-2">
          <ArqoExperienceImage
            src="/assets/arqo/arquitetura.avif"
            alt="Arquitetura ARQO"
            className="min-h-[360px] sm:translate-y-10"
          />
          <div className="grid gap-4">
            <ArqoExperienceImage
              src="/assets/arqo/interiores.webp"
              alt="Interiores ARQO"
              className="min-h-[170px]"
            />
            <ArqoExperienceImage
              src="/assets/arqo/atendimento.webp"
              alt="Atendimento ARQO"
              className="min-h-[170px]"
            />
          </div>
        </motion.div>
      </div>
    </ArqoSection>
  );
}
