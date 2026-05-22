import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import { useRef } from 'react';
import { Reveal } from './SevenPrimitives';

const sevenPoints = ['operação', 'posicionamento', 'expansão', 'presença de mercado'];
const arqoPoints = ['percepção', 'curadoria', 'direção', 'inteligência imobiliária'];

export function SevenArqoBridge() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 86%', 'end 46%'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['-4%', '6%']);
  const lineScale = useTransform(scrollYProgress, [0.16, 0.72], [0, 1]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#F4F4F2] px-5 py-24 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(17,17,20,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,20,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-black/[0.055]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 min-[1366px]:grid-cols-[0.95fr_1.05fr] min-[1366px]:items-start">
          <Reveal>
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#8B8176]">Dentro do ecossistema</p>
              <img
                src="/assets/arqo/Logo%20Preferencial%20%E2%80%A2%20Arqo.webp"
                alt="ARQO"
                className="mb-6 h-12 w-fit object-contain sm:h-[50px]"
                loading="lazy"
                decoding="async"
              />
              <h2 className="text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#111114] sm:text-5xl lg:text-6xl">
                Estratégia também precisa de direção.
              </h2>
              <p className="mt-6 text-base leading-8 text-[#626268] sm:text-lg">
                Algumas operações do ecossistema compartilham espaço, visão e inteligência estratégica. Entre elas está a ARQO
                — empresa focada em inteligência imobiliária aplicada à decisão.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-[#111114] shadow-[0_24px_80px_rgba(17,17,20,0.13)]">
              <div className="relative min-h-[300px] overflow-hidden sm:min-h-[360px]">
                <motion.img
                  src="/assets/arqo/interiores.webp"
                  alt="Interiores premium"
                  style={{ y: imageY, scale: 1.06 }}
                  className="absolute inset-0 h-[112%] w-full object-cover opacity-88"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,20,0.24),rgba(17,17,20,0.04)),linear-gradient(0deg,rgba(17,17,20,0.16),transparent_54%)]" />
                <div className="absolute inset-6 border border-white/14" />
              </div>
              <div className="bg-[#111114] px-7 py-6 sm:px-8">
                <p className="max-w-[460px] text-sm font-medium leading-7 text-white">
                  Uma presença complementar para decisões que pedem leitura, critério e silêncio estratégico.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 min-[1366px]:grid-cols-[0.9fr_1.1fr] min-[1366px]:items-stretch">
          <Reveal>
            <article className="h-full border border-black/[0.07] bg-[#FAFAFA] p-7 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] text-[#A17046]">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.26em] text-[#8B8176]">O que é a ARQO</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#111114] sm:text-4xl">
                A ARQO organiza decisões.
              </h3>
              <p className="mt-5 text-base leading-8 text-[#626268]">
                A ARQO atua como uma consultoria estratégica imobiliária. Seu papel não é trabalhar volume. É estruturar
                escolhas, percepção e direção para investidores, empreendimentos e posicionamentos imobiliários.
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="relative h-full overflow-hidden border border-black/[0.07] bg-[#FAFAFA] p-7 sm:p-8">
              <div className="absolute inset-x-8 top-[104px] hidden h-px bg-black/10 lg:block" />
              <motion.div
                style={{ scaleX: lineScale, transformOrigin: 'left' }}
                className="absolute inset-x-8 top-[104px] hidden h-px bg-[#A17046] lg:block"
              />

              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8B8176]">Conexão estratégica</p>
              <h3 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.045em] text-[#111114] sm:text-4xl">
                Onde Seven e ARQO se conectam.
              </h3>

              <div className="mt-10 grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                <ConnectionColumn name="Seven" items={sevenPoints} tone="seven" />
                <div className="hidden pt-[58px] text-[#A17046] sm:block">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <ConnectionColumn name="ARQO" items={arqoPoints} tone="arqo" />
              </div>

              <p className="mt-9 border-t border-black/[0.08] pt-6 text-balance text-xl font-semibold leading-8 tracking-[-0.03em] text-[#111114]">
                Enquanto a Seven movimenta mercados, a ARQO transforma excesso em clareza.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ConnectionColumn({ name, items, tone }: { name: string; items: string[]; tone: 'seven' | 'arqo' }) {
  return (
    <div className="min-h-[230px] border border-black/[0.06] bg-white/64 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#111114]">{name}</p>
      <div className="mt-7 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3">
            <span
              className={
                tone === 'seven'
                  ? 'h-1.5 w-1.5 rounded-full bg-[#E76912]'
                  : 'h-1.5 w-1.5 rounded-full bg-[#A17046]'
              }
            />
            <span className="text-base leading-6 text-[#626268]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
