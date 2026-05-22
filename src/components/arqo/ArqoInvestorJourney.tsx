import { useRef } from 'react';
import { gsap, scheduleScrollTriggerRefresh, useGSAP } from '../../lib/gsap';
import { ArqoIconBadge, StableTextReveal } from './ArqoPrimitives';
import { investorJourney } from './arqoContent';

export function ArqoInvestorJourney() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLElement[]>([]);
  const dotRefs = useRef<HTMLSpanElement[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const progress = progressRef.current;
      const glow = glowRef.current;
      const cards = cardRefs.current;
      const dots = dotRefs.current;

      if (!section || !progress || !glow || cards.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 1366px)', () => {
        gsap.set(progress, { scaleY: 0, transformOrigin: '50% 0%' });
        gsap.set(glow, { scaleY: 0, autoAlpha: 0.1, transformOrigin: '50% 0%' });
        gsap.set(cards, {
          autoAlpha: 0.72,
          x: 20,
          scale: 0.99,
          transformOrigin: '50% 50%',
        });
        gsap.set(dots, { autoAlpha: 0.48, scale: 0.92 });

        const timeline = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: section,
            scrub: 1,
            start: 'top 75%',
            end: 'bottom 45%',
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(progress, { scaleY: 1, duration: 1, ease: 'none' }, 0)
          .to(glow, { scaleY: 1, autoAlpha: 0.18, duration: 1, ease: 'none' }, 0);

        cards.forEach((card, index) => {
          const dot = dots[index];
          const previousCard = cards[index - 1];
          const previousDot = dots[index - 1];
          const start = 0.08 + index * 0.13;

          timeline.to(
            card,
            {
              autoAlpha: 1,
              x: 0,
              scale: 1,
              duration: 0.16,
            },
            start
          );

          if (dot) {
            timeline.to(dot, { autoAlpha: 1, scale: 1, duration: 0.12 }, start);
          }

          if (previousCard) {
            timeline.to(previousCard, { autoAlpha: 0.82, scale: 0.995, duration: 0.12 }, start + 0.08);
          }

          if (previousDot) {
            timeline.to(previousDot, { autoAlpha: 0.7, scale: 0.95, duration: 0.12 }, start + 0.08);
          }
        });

        timeline.to(cards[cards.length - 1], { autoAlpha: 1, scale: 1, duration: 0.12 }, 0.9);

        scheduleScrollTriggerRefresh();

        return () => {
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="jornada"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#F8F7F3] px-5 py-24 text-[#171715] sm:px-8 lg:px-10 lg:py-36 xl:py-44"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.022)_1px,transparent_1px)] bg-[size:68px_68px] opacity-70" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="max-w-5xl">
          <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#7B786E]">Jornada do investidor</p>
          <StableTextReveal
            text="Antes do imóvel, existe uma decisão."
            as="h2"
            className="arqo-heading text-balance text-[2.55rem] font-medium leading-[1.04] tracking-[-0.045em] text-[#171715] sm:text-6xl lg:text-7xl"
          />
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#625F57]">
            A ARQO desacelera o excesso para que a escolha ganhe método, leitura e consequência.
          </p>
        </div>

        <div className="relative mt-16 lg:mt-32 xl:mt-36">
          <div className="absolute bottom-0 left-[1.35rem] top-0 w-px bg-black/[0.08]" />
          <div
            ref={glowRef}
            className="absolute left-[1.35rem] top-0 hidden h-full w-3 -translate-x-1/2 bg-[#171715]/15 blur-xl lg:block"
          />
          <div ref={progressRef} className="absolute left-[1.35rem] top-0 hidden h-full w-px bg-[#171715] lg:block" />

          <div className="space-y-5 lg:space-y-6">
            {investorJourney.map((step, index) => (
              <JourneyStep
                key={step.title}
                step={step}
                index={index}
                setCardRef={(node) => {
                  if (node) cardRefs.current[index] = node;
                }}
                setDotRef={(node) => {
                  if (node) dotRefs.current[index] = node;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyStep({
  step,
  index,
  setCardRef,
  setDotRef,
}: {
  step: (typeof investorJourney)[number];
  index: number;
  setCardRef: (node: HTMLElement | null) => void;
  setDotRef: (node: HTMLSpanElement | null) => void;
}) {
  return (
    <article
      ref={setCardRef}
      className="relative ml-10 border border-black/[0.075] bg-white/90 p-6 shadow-[0_18px_54px_rgba(34,33,29,0.04)] lg:p-7"
    >
      <span
        ref={setDotRef}
        className="absolute -left-[3.05rem] top-7 flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.08] bg-[#F8F7F3] text-xs font-semibold text-[#6D6A62]"
      >
        {index + 1}
      </span>
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#969084]">0{index + 1}</p>
          <h3 className="arqo-heading mt-3 text-2xl font-medium tracking-[-0.035em] text-[#171715] sm:text-3xl">{step.title}</h3>
        </div>
        <ArqoIconBadge icon={step.icon} />
      </div>
      <p className="mt-5 max-w-2xl text-base leading-8 text-[#625F57]">{step.description}</p>
    </article>
  );
}
