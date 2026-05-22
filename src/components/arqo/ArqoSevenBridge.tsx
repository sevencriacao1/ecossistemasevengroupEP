import { useRef } from 'react';
import { gsap, scheduleScrollTriggerRefresh, useGSAP } from '../../lib/gsap';

const sevenLogo = '/assets/seven/Logo%20Seven%20Group.webp';

export function ArqoSevenBridge() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLParagraphElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const panel = panelRef.current;
      const close = closeRef.current;

      if (!section || !panel || !close) return;

      const copy = gsap.utils.toArray<HTMLElement>(section.querySelectorAll('[data-bridge-copy]'));
      const connector = section.querySelector<SVGLineElement>('[data-bridge-connector]');
      const signal = section.querySelector<HTMLElement>('[data-bridge-signal]');
      const signature = section.querySelector<HTMLElement>('[data-bridge-signature]');

      if (connector) {
        const length = connector.getTotalLength();
        gsap.set(connector, { strokeDasharray: length, strokeDashoffset: length });
      }

      gsap.set(panel, { autoAlpha: 0, y: 34, filter: 'blur(8px)' });
      gsap.set(copy, { autoAlpha: 0, y: 16 });
      gsap.set([close, signature].filter(Boolean), { autoAlpha: 0, y: 14 });
      gsap.set(signal, { autoAlpha: 0, scale: 0.82 });

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top 74%',
          end: 'bottom 38%',
          toggleActions: 'play none none reverse',
        },
      });

      timeline
        .to(panel, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.72 })
        .to(connector, { strokeDashoffset: 0, duration: 0.82, ease: 'power1.out' }, '-=0.32')
        .to(signal, { autoAlpha: 1, scale: 1, duration: 0.32 }, '-=0.55')
        .to(copy, { autoAlpha: 1, y: 0, stagger: 0.09, duration: 0.42 }, '-=0.18')
        .to(close, { autoAlpha: 1, y: 0, duration: 0.42 }, '-=0.04')
        .to(signature, { autoAlpha: 0.56, y: 0, duration: 0.38 }, '-=0.22');

      scheduleScrollTriggerRefresh();

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#F8F7F3] px-5 py-20 text-[#171715] sm:px-8 lg:px-10 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.022)_1px,transparent_1px)] bg-[size:72px_72px] opacity-75" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[min(44rem,86vw)] -translate-x-1/2 rounded-full bg-white/52 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div
          ref={panelRef}
          className="relative overflow-hidden border border-black/[0.06] bg-white/62 px-6 py-10 shadow-[0_22px_80px_rgba(34,33,29,0.055)] backdrop-blur-2xl sm:px-10 sm:py-12 lg:px-14 lg:py-14"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.86),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.42),transparent_48%,rgba(23,23,21,0.025))]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-[#817B70]">A camada estratégica</p>
            <img
              src={sevenLogo}
              alt="Seven Group"
              className="mt-5 h-auto max-h-6 w-auto max-w-[8.75rem] object-contain"
              loading="lazy"
              decoding="async"
            />
            <h2 className="arqo-heading mt-5 max-w-2xl text-balance text-4xl font-medium leading-[1.04] tracking-[-0.045em] text-[#171715] sm:text-5xl lg:text-[3.65rem]">
              Por trás da percepção, existe estrutura.
            </h2>

            <div className="my-9 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A7469] sm:gap-3 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="shrink-0 whitespace-nowrap">Percepção</span>
              <div className="relative h-6 flex-1 min-w-0" aria-hidden="true">
                <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 320 24" preserveAspectRatio="none">
                  <line
                    data-bridge-connector
                    x1="2"
                    y1="12"
                    x2="318"
                    y2="12"
                    stroke="rgba(23,23,21,0.34)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeDasharray="4 9"
                  />
                </svg>
                <span
                  data-bridge-signal
                  className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#171715]/55 shadow-[0_0_18px_rgba(23,23,21,0.2)] [animation:arqo-bridge-signal_5.8s_ease-in-out_infinite]"
                />
              </div>
              <span className="shrink-0 whitespace-nowrap">Estrutura</span>
            </div>

            <div className="grid gap-5 text-base leading-8 text-[#605B52] sm:text-lg sm:leading-9">
              <p data-bridge-copy>
                A ARQO organiza a forma como o cliente percebe, entende e se conecta com o produto imobiliário.
              </p>
              <p data-bridge-copy>
                A{' '}
                <span className="inline-flex translate-y-[-0.08em] items-center bg-[#E76912] px-3 py-0.5 font-semibold leading-tight text-white">
                  Seven Group
                </span>{' '}
                sustenta a frente estratégica e operacional que dá base a esse movimento: mercado, desenvolvimento, marketing, comercial, performance e aceleração.
              </p>
              <p data-bridge-copy>
                Para o colaborador da ARQO, isso significa trabalhar com mais contexto, mais direção e mais clareza sobre o que transforma projetos em decisões bem conduzidas.
              </p>
            </div>

            <p
              ref={closeRef}
              className="arqo-heading mt-10 border-t border-black/[0.07] pt-7 text-2xl font-medium leading-[1.12] tracking-[-0.03em] text-[#171715] sm:text-3xl"
            >
              Duas estruturas diferentes.
              <span className="block text-[#8A8479]">A mesma visão estratégica.</span>
            </p>
          </div>

          <div
            data-bridge-signature
            className="relative z-10 mt-10 flex items-center justify-between gap-4 border-t border-black/[0.055] pt-5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#817B70]">Estrutura de suporte</span>
            <img
              src={sevenLogo}
              alt="Seven Group"
              className="h-auto max-h-5 w-auto max-w-[8.5rem] object-contain opacity-70 grayscale"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
