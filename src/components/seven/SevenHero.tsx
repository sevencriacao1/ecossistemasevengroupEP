import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight, Quote } from 'lucide-react';
import { useRef } from 'react';
import { AnchorButton, AssetFrame } from './SevenPrimitives';
import { sevenAssets } from './sevenContent';

export function SevenHero() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.78], [1, 0.18]);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-[#F7F7F8] px-5 py-[clamp(6rem,10svh,8rem)] text-[#111114] sm:px-8 lg:px-10 min-[1366px]:py-[clamp(6.5rem,12svh,9rem)]">
      <motion.div
        style={{ y, opacity }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(231,105,18,0.16),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(17,17,20,0.06),transparent_23%),linear-gradient(180deg,#ffffff_0%,#f6f6f7_100%)]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(rgba(17,17,20,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,20,0.045)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(180deg,black,transparent_78%)]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-12rem)] max-w-7xl items-center gap-10 min-[1366px]:min-h-[calc(100svh-13rem)] min-[1366px]:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] min-[1366px]:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#686871] shadow-[0_14px_36px_rgba(17,17,20,0.06)] backdrop-blur-2xl">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E76912]" />
            Estratégia • Arquitetura • Render • Marketing
          </div>
          <img
            src={sevenAssets.logo}
            alt="Seven Group"
            className="h-auto w-[min(520px,86vw)] object-contain object-left max-sm:w-full"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <p className="mt-8 max-w-3xl text-balance text-[1.55rem] font-medium leading-tight tracking-[-0.03em] text-[#242428] sm:text-3xl lg:text-4xl">
            Transformamos projetos imobiliários em movimentos de mercado.
          </p>
          <p className="mt-7 max-w-2xl text-base leading-8 text-[#666670] sm:text-lg">
            A Seven Group é um ecossistema completo de inteligência imobiliária, unindo estratégia,
            posicionamento, arquitetura, marketing, renderização e aceleração comercial.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <AnchorButton href="#quem-somos" dark>
              Conhecer Ecossistema
              <ArrowRight className="ml-2 h-4 w-4" />
            </AnchorButton>
            <AnchorButton href="#pilares">
              Ver Pilares
              <ArrowDown className="ml-2 h-4 w-4" />
            </AnchorButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-[320px] sm:min-h-[430px] min-[1366px]:min-h-[min(560px,calc(100svh-12rem))]"
        >
          <div className="absolute inset-0 rounded-[42px] border border-white bg-white/42 shadow-[0_34px_100px_rgba(17,17,20,0.12)] backdrop-blur-3xl" />
          <AssetFrame
            src={sevenAssets.logoN}
            alt="Logo N Seven Group"
            initials="N"
            label="Logo N Seven Group"
            className="absolute inset-6"
            fit="contain"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute bottom-6 left-6 right-6 rounded-[24px] border border-white/55 bg-white/32 p-5 shadow-[0_24px_54px_rgba(17,17,20,0.10)] backdrop-blur-[34px] backdrop-saturate-150 sm:bottom-10 sm:left-10 sm:right-10">
            <Quote className="mb-3 h-4 w-4 text-[#E76912]" />
            <blockquote className="text-sm leading-6 text-[#3D3D43]">
              “No que diz respeito ao empenho, ao compromisso, ao esforço, à dedicação, não existe meio-termo.
              Ou você faz uma coisa bem-feita ou não faz.”
              <span className="mt-2 block font-semibold text-[#111114]">Ayrton Senna</span>
            </blockquote>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
