import { useEffect, useRef, useState } from 'react';
import { gsap, scheduleScrollTriggerRefresh, useGSAP } from '../../lib/gsap';
import { StableTextReveal } from './ArqoPrimitives';
import { arqoAssets } from './arqoContent';

const incorpBullets = ['Oferta', 'Dados', 'Posicionamento', 'Velocidade de venda'];
const selectBullets = ['Perfil', 'Curadoria', 'Tempo', 'Assertividade'];
const finalPhrase = 'A arquitetura organiza espaços. A ARQO organiza decisões.';
const imovelIcon = '/assets/arqo/icon_house.svg';
const userIcon = '/assets/arqo/icon_user.svg';
const housingLogo = '/assets/arqo/Logo%20Arqo%20Arqo%20Housing.svg';
const selectLogo = '/assets/arqo/Logo%20Arqo%20Select.svg';

export function ArqoConcept() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1366px)').matches;
  });

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1366px)');
    const update = () => setIsDesktop(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  return isDesktop ? <ArqoConceptDesktop /> : <ArqoConceptMobile />;
}

function ArqoConceptDesktop() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const incorpCardRef = useRef<HTMLElement | null>(null);
  const selectCardRef = useRef<HTMLElement | null>(null);
  const ecosystemConnectorRef = useRef<SVGSVGElement | null>(null);
  const logoCardRef = useRef<HTMLDivElement | null>(null);
  const finalPhraseRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const incorpCard = incorpCardRef.current;
      const selectCard = selectCardRef.current;
      const ecosystemConnector = ecosystemConnectorRef.current;
      const logoCard = logoCardRef.current;
      const finalText = finalPhraseRef.current;

      if (!section || !incorpCard || !selectCard || !ecosystemConnector || !logoCard || !finalText) return;

      let timeline: gsap.core.Timeline | undefined;
      let firstFrame = 0;
      let secondFrame = 0;
      const incorpBulletsNodes = gsap.utils.toArray<HTMLElement>(incorpCard.querySelectorAll('[data-concept-bullet]'));
      const selectBulletsNodes = gsap.utils.toArray<HTMLElement>(selectCard.querySelectorAll('[data-concept-bullet]'));
      const incorpFlipper = incorpCard.querySelector<HTMLElement>('[data-card-flipper]');
      const selectFlipper = selectCard.querySelector<HTMLElement>('[data-card-flipper]');
      const backContentNodes = gsap.utils.toArray<HTMLElement>(section.querySelectorAll('[data-card-back-content]'));
      const finalChars = gsap.utils.toArray<HTMLElement>(finalText.querySelectorAll('[data-final-char]'));
      const ecosystemPaths = gsap.utils.toArray<SVGPathElement>(ecosystemConnector.querySelectorAll('[data-ecosystem-connector]'));

      if (!incorpFlipper || !selectFlipper) return;

      gsap.set(logoCard, { autoAlpha: 0, y: 24, scale: 0.96 });
      gsap.set(incorpCard, { autoAlpha: 0, x: '12%', y: 72, scale: 0.96 });
      gsap.set(incorpBulletsNodes, { autoAlpha: 0, y: 16 });
      gsap.set(selectCard, { autoAlpha: 0, x: '-12%', y: 72, scale: 0.96 });
      gsap.set(selectBulletsNodes, { autoAlpha: 0, y: 16 });
      gsap.set(ecosystemConnector, { autoAlpha: 0 });
      gsap.set(ecosystemPaths, { strokeDashoffset: 96 });
      gsap.set([incorpFlipper, selectFlipper], { rotateY: 0, transformStyle: 'preserve-3d' });
      gsap.set(backContentNodes, { autoAlpha: 0, y: 16 });
      gsap.set(finalText, { autoAlpha: 0, y: 24 });
      gsap.set(finalChars, { color: 'rgba(22,22,21,0.22)' });

      const createTimeline = () => {
        timeline = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: '+=3200',
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 0,
          },
        });

        timeline
          .to(logoCard, { autoAlpha: 1, y: 0, scale: 1, duration: 0.16 }, 0.08)
          .to(ecosystemConnector, { autoAlpha: 1, duration: 0.04 }, 0.22)
          .to(ecosystemPaths, { strokeDashoffset: 0, stagger: 0.025, duration: 0.2, ease: 'none' }, 0.22)
          .to(incorpCard, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.18 }, 0.42)
          .to(incorpBulletsNodes, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.18 }, 0.58)
          .to(selectCard, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.18 }, 0.64)
          .to(selectBulletsNodes, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.16 }, 0.78)
          .to([incorpCard, selectCard], { scale: 0.985, duration: 0.16 }, 0.9)
          .to(incorpFlipper, { rotateY: 180, duration: 0.24, ease: 'power2.inOut' }, 1.02)
          .to(selectFlipper, { rotateY: 180, duration: 0.24, ease: 'power2.inOut' }, 1.08)
          .to(backContentNodes, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.16 }, 1.28)
          .to(finalText, { autoAlpha: 1, y: 0, duration: 0.04 }, 1.48)
          .to(finalChars, { color: 'rgba(22,22,21,1)', stagger: 0.006, duration: 0.14, ease: 'none' }, 1.49);

        scheduleScrollTriggerRefresh();
      };

      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(createTimeline);
      });

      return () => {
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        timeline?.scrollTrigger?.kill();
        timeline?.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <>
      <section id="conceito" ref={sectionRef} className="relative min-h-[100svh] overflow-hidden bg-white text-[#171715]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.024)_1px,transparent_1px)] bg-[size:64px_64px] opacity-70" />

      <div className="arqo-concept-desktop-shell relative z-10 mx-auto grid min-h-[100svh] max-w-[94rem] grid-rows-[auto_auto_auto_auto] items-center px-8 pb-[clamp(1.75rem,3svh,3rem)] pt-[clamp(5.75rem,10svh,7.5rem)] xl:px-10">
        <div className="arqo-concept-desktop-heading mx-auto w-full max-w-4xl px-4 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.36em] text-[#7B786E]">O Conceito da ARQO</p>
          <StableTextReveal
            text="Arquitetura aplicada à decisão."
            as="h2"
            className="arqo-concept-desktop-title arqo-heading text-balance text-[clamp(2.3rem,4vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.045em] text-[#161615]"
          />
          <p className="mx-auto mt-3 max-w-3xl text-[clamp(0.9rem,1.2vw,1rem)] leading-7 text-[#6D6A62]">
            A ARQO nasce da união entre arquitetura e direção estratégica.
          </p>
        </div>

        <div className="arqo-concept-flow relative mx-auto mt-[clamp(1.25rem,2.6svh,2.1rem)] flex w-full max-w-6xl flex-col items-center">
          <div
            ref={logoCardRef}
            className="arqo-concept-logo-card relative z-20 flex w-[clamp(18rem,28vw,26.6rem)] items-center justify-center border border-black/[0.065] bg-[#F8F7F3]/88 px-[clamp(1.4rem,2.6vw,2rem)] py-[clamp(0.85rem,1.8svh,1.35rem)] shadow-[0_24px_70px_rgba(34,33,29,0.045)] backdrop-blur-xl"
          >
            <img src={arqoAssets.logo} alt="ARQO" className="h-auto w-full object-contain" loading="lazy" decoding="async" />
          </div>

          <div className="arqo-concept-card-grid relative mt-[clamp(2.6rem,5svh,4.25rem)] grid w-full grid-cols-2 items-stretch gap-6 xl:gap-12">
            <svg
              ref={ecosystemConnectorRef}
              className="pointer-events-none absolute left-1/2 top-0 z-10 h-[clamp(3.4rem,6svh,5rem)] w-[clamp(24rem,40vw,45rem)] -translate-x-1/2 -translate-y-full overflow-visible text-[#8F8778]"
              viewBox="0 0 640 112"
              fill="none"
              aria-hidden="true"
            >
              <path
                data-ecosystem-connector
                className="arqo-dash-flow"
                d="M320 0 L320 42"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeDasharray="5 11"
              />
              <path
                data-ecosystem-connector
                className="arqo-dash-flow"
                d="M320 42 L104 42 L104 112"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5 11"
              />
              <path
                data-ecosystem-connector
                className="arqo-dash-flow"
                d="M320 42 L536 42 L536 112"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5 11"
              />
            </svg>

            <FlipConceptCard
              ref={incorpCardRef}
              title="ARQO Housing"
              headline="Inteligência de venda para o seu imóvel."
              bullets={incorpBullets}
              body="Focada na oferta, a ARQO Housing atua ao lado de incorporadores e proprietários. Utilizamos inteligência de dados para posicionar o seu produto no mercado e encontrar o investidor ou morador certo, acelerando a velocidade de vendas com estratégia e precisão."
              focus="O foco é: Maximizar o potencial do ativo imobiliário."
              backTitle="Foco na|Oferta"
              backText="Organizamos o produto, posicionamos a oferta e conectamos o imóvel aos investidores ou moradores ideais. A inteligência de dados atua para acelerar a velocidade de venda."
              backFocus="Objetivo: maximizar o potencial do ativo."
              backLogo={housingLogo}
              centerIcon={imovelIcon}
              orbitIcon={userIcon}
              orbitCount={6}
              variant="incorp"
              className="z-20 w-full justify-self-end"
            />

            <FlipConceptCard
              ref={selectCardRef}
              title="ARQO Select"
              headline="Sua assessoria de busca personalizada."
              bullets={selectBullets}
              body="Aqui, o ponto de partida é você. A ARQO Select atua como sua consultoria pessoal: entendemos seu perfil, estilo de vida e objetivos para garimpar, em todo o mercado, as opções que realmente fazem sentido. Economia de tempo e assertividade na escolha."
              focus="O foco é: A experiência e o sucesso do comprador."
              backTitle="Foco na|Demanda"
              backText="Entendemos seu perfil, filtramos o mercado e trazemos apenas imóveis que combinam com seu estilo de vida. Economia de tempo com assertividade na escolha."
              backFocus="Objetivo: aumentar a assertividade e a segurança da escolha."
              backLogo={selectLogo}
              centerIcon={userIcon}
              orbitIcon={imovelIcon}
              orbitCount={6}
              variant="select"
              orbit
              className="z-20 w-full justify-self-start"
            />
          </div>
        </div>

        <div
          ref={finalPhraseRef}
          className="arqo-concept-final relative z-20 mx-auto mt-[clamp(1rem,2.4svh,2rem)] w-full max-w-5xl px-4 text-center"
        >
          <p className="arqo-heading text-balance text-[clamp(1.65rem,2.3vw,2rem)] font-medium leading-[1.08] tracking-[-0.035em] text-[#171715]">
            {finalPhrase.split(' ').map((word, wordIndex, words) => (
              <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap">
                {Array.from(word).map((char, charIndex) => (
                  <span key={`${word}-${charIndex}`} data-final-char className="inline">
                    {char}
                  </span>
                ))}
                {wordIndex < words.length - 1 && <span aria-hidden="true">&nbsp;</span>}
              </span>
            ))}
          </p>
        </div>
      </div>
      </section>
      <div aria-hidden="true" className="h-40 bg-white xl:h-12" />
    </>
  );
}

function ArqoConceptMobile() {
  return (
    <section id="conceito" className="relative overflow-x-hidden bg-white px-5 py-24 text-[#171715] sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.36em] text-[#7B786E]">O Conceito da ARQO</p>
        <StableTextReveal
          text="Arquitetura aplicada à decisão."
          as="h2"
          className="arqo-heading text-balance text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-[#161615] sm:text-5xl"
        />
        <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#6D6A62] sm:text-lg">
          A ARQO nasce da união entre arquitetura e direção estratégica.
        </p>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-center">
        <div className="relative z-20 flex w-full max-w-[22rem] items-center justify-center border border-black/[0.065] bg-[#F8F7F3]/88 px-6 py-4 shadow-[0_24px_70px_rgba(34,33,29,0.045)] backdrop-blur-xl">
          <img src={arqoAssets.logo} alt="ARQO" className="h-auto w-full object-contain" loading="lazy" decoding="async" />
        </div>

        <svg
          className="pointer-events-none my-6 h-24 w-full max-w-[21rem] overflow-visible text-[#8F8778]"
          viewBox="0 0 320 120"
          fill="none"
          aria-hidden="true"
        >
          <path
            className="arqo-dash-flow"
            d="M160 0 L160 44 L72 44 L72 120"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 11"
          />
          <path
            className="arqo-dash-flow"
            d="M160 44 L248 44 L248 120"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 11"
          />
        </svg>
      </div>

      <div className="mx-auto grid max-w-xl gap-8">
        <MobileConceptCard
          title="ARQO Housing"
          headline="Inteligência de venda para o seu imóvel."
          bullets={incorpBullets}
          body="Focada na oferta, a ARQO Housing atua ao lado de incorporadores e proprietários. Utilizamos inteligência de dados para posicionar o seu produto no mercado e encontrar o investidor ou morador certo, acelerando a velocidade de vendas com estratégia e precisão."
          focus="O foco é: Maximizar o potencial do ativo imobiliário."
          backTitle="Foco na|Oferta"
          backText="Organizamos o produto, posicionamos a oferta e conectamos o imóvel aos investidores ou moradores ideais. A inteligência de dados atua para acelerar a velocidade de venda."
          backFocus="Objetivo: maximizar o potencial do ativo."
          backLogo={housingLogo}
          centerIcon={imovelIcon}
        />
        <MobileConceptCard
          title="ARQO Select"
          headline="Sua assessoria de busca personalizada."
          bullets={selectBullets}
          body="Aqui, o ponto de partida é você. A ARQO Select atua como sua consultoria pessoal: entendemos seu perfil, estilo de vida e objetivos para garimpar, em todo o mercado, as opções que realmente fazem sentido. Economia de tempo e assertividade na escolha."
          focus="O foco é: A experiência e o sucesso do comprador."
          backTitle="Foco na|Demanda"
          backText="Entendemos seu perfil, filtramos o mercado e trazemos apenas imóveis que combinam com seu estilo de vida. Economia de tempo com assertividade na escolha."
          backFocus="Objetivo: aumentar a assertividade e a segurança da escolha."
          backLogo={selectLogo}
          centerIcon={userIcon}
        />
      </div>

      <p className="arqo-heading mx-auto mt-14 max-w-4xl text-center text-balance text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-[#171715] sm:text-5xl">
        {finalPhrase}
      </p>
    </section>
  );
}

function MobileConceptCard({
  title,
  headline,
  bullets,
  body,
  focus,
  backTitle,
  backText,
  backFocus,
  backLogo,
  centerIcon,
}: {
  title: string;
  headline: string;
  bullets: string[];
  body: string;
  focus: string;
  backTitle: string;
  backText: string;
  backFocus: string;
  backLogo: string;
  centerIcon: string;
}) {
  return (
    <article className="overflow-hidden border border-black/[0.075] bg-[#F8F7F3]/94 shadow-[0_24px_70px_rgba(34,33,29,0.055)]">
      <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.034)_1px,transparent_1px)] bg-[size:42px_42px] opacity-55" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <img src={backLogo} alt="" className="h-8 w-auto max-w-[10rem] object-contain opacity-90 [filter:brightness(0)]" loading="lazy" decoding="async" />
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-black/[0.075] bg-white/62 shadow-[0_18px_44px_rgba(34,33,29,0.08)] backdrop-blur-xl">
              <img src={centerIcon} alt="" className="h-6 w-6 object-contain opacity-80" loading="lazy" decoding="async" />
            </span>
          </div>

          <p className="arqo-heading mt-8 text-[2.25rem] font-medium leading-[0.96] tracking-[-0.045em] text-[#171715] sm:text-5xl">
            {title}
          </p>
          <p className="mt-4 text-lg font-medium leading-snug tracking-[-0.012em] text-[#4C4942]">{headline}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {bullets.map((bullet) => (
              <span key={bullet} className="border border-black/[0.07] bg-white/58 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#6D675C]">
                {bullet}
              </span>
            ))}
          </div>

          <p className="mt-6 text-base leading-7 text-[#625F57]">{body}</p>
          <p className="mt-5 border-t border-black/[0.07] pt-4 text-sm font-semibold leading-6 text-[#34312B]">
            {focus}
          </p>
        </div>
      </div>

      <div className="border-t border-black/[0.07] bg-white/62 px-5 py-5 sm:px-7">
        <p className="arqo-heading text-xl font-medium leading-tight tracking-[-0.03em] text-[#171715]">
          {backTitle.replace('|', ' ')}
        </p>
        <p className="mt-3 text-sm leading-7 text-[#625F57]">{backText}</p>
        <p className="mt-4 text-sm font-semibold leading-6 text-[#34312B]">{backFocus}</p>
      </div>
    </article>
  );
}

function FlipConceptCard({
  title,
  headline,
  bullets,
  body,
  focus,
  backTitle,
  backText,
  backFocus,
  backLogo,
  centerIcon,
  orbitIcon,
  orbitCount,
  variant,
  orbit = false,
  className,
  ref,
}: {
  title: string;
  headline: string;
  bullets: string[];
  body: string;
  focus: string;
  backTitle: string;
  backText: string;
  backFocus: string;
  backLogo: string;
  centerIcon: string;
  orbitIcon: string;
  orbitCount: number;
  variant: 'incorp' | 'select';
  orbit?: boolean;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}) {
  return (
    <article
      ref={ref}
      className={[
        'arqo-concept-flip-card relative min-h-[43rem] [perspective:1400px] sm:min-h-[39rem] min-[1366px]:min-h-[clamp(31rem,54svh,34rem)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div data-card-flipper className="absolute inset-0 [transform-style:preserve-3d] will-change-transform">
        <div className="absolute inset-0 overflow-hidden border border-black/[0.065] bg-[#F8F7F3]/94 p-7 shadow-[0_24px_70px_rgba(34,33,29,0.045)] [backface-visibility:hidden] backdrop-blur-xl sm:p-8 lg:p-7 xl:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.034)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />
          {orbit && (
            <div className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-64 w-64 rounded-full border border-black/[0.08]">
              <div className="absolute inset-10 rounded-full border border-black/[0.06]" />
              <div className="absolute inset-20 rounded-full border border-black/[0.045]" />
            </div>
          )}
          <div className="relative z-10">
            <p className="arqo-heading text-[clamp(2.35rem,9vw,3.4rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[#171715] lg:text-[clamp(2.45rem,3vw,3.55rem)]">
              {title}
            </p>
            <p className="mt-[clamp(0.85rem,1.35svh,1.2rem)] max-w-md text-[clamp(1rem,1.35vw,1.2rem)] font-medium leading-snug tracking-[-0.012em] text-[#4C4942]">{headline}</p>
            <div className="mt-[clamp(0.85rem,1.35svh,1.2rem)] grid gap-[clamp(0.4rem,0.85svh,0.65rem)] text-[clamp(0.86rem,1vw,0.96rem)] font-medium text-[#4E4B45]">
              {bullets.map((bullet) => (
                <span key={bullet} data-concept-bullet className="flex items-center gap-3 border-t border-black/[0.07] pt-[clamp(0.55rem,0.9svh,0.75rem)]">
                  <span className="h-1 w-1 rounded-full bg-[#8F8778]" />
                  {bullet}
                </span>
              ))}
            </div>
            <p className="mt-[clamp(0.8rem,1.2svh,1.25rem)] max-w-xl text-base leading-8 text-[#625F57] lg:text-[clamp(0.78rem,0.92vw,0.95rem)] lg:leading-[1.55]">{body}</p>
            <p className="mt-[clamp(0.85rem,1.25svh,1.2rem)] border-t border-black/[0.07] pt-[clamp(0.7rem,1.05svh,0.95rem)] text-[clamp(0.86rem,1vw,0.96rem)] font-semibold leading-6 text-[#34312B]">
              {focus}
            </p>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden border border-black/[0.065] bg-[#F8F7F3]/96 p-6 shadow-[0_24px_70px_rgba(34,33,29,0.045)] [backface-visibility:hidden] [transform:rotateY(180deg)] backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.034)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />
          <div className="relative z-10 grid h-full content-center gap-6 min-[1366px]:grid-cols-[minmax(12rem,0.85fr)_minmax(0,1fr)] min-[1366px]:items-center min-[1366px]:gap-6 xl:grid-cols-[minmax(13rem,0.85fr)_minmax(0,1fr)]">
            <div className="relative z-10 flex min-w-0 justify-center">
              <OrbitalConceptIllustration
                centerIcon={centerIcon}
                orbitIcon={orbitIcon}
                orbitCount={orbitCount}
                variant={variant}
              />
            </div>
            <div data-card-back-content className="relative z-20 min-w-0 max-w-full text-left">
              <img src={backLogo} alt="" className="mb-4 h-8 w-auto max-w-[10rem] object-contain opacity-90 [filter:brightness(0)]" loading="lazy" decoding="async" />
              <p className="arqo-heading text-[clamp(1.28rem,5vw,1.82rem)] font-medium leading-[1.04] tracking-[-0.03em] text-[#171715] lg:text-[clamp(1.25rem,1.78vw,1.9rem)]">
                {backTitle.split('|').map((line, index) => (
                  <span key={`${line}-${index}`} className="block whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-4 max-w-full [text-align-last:left] text-[0.94rem] leading-7 text-[#625F57] [text-align:justify] lg:text-[clamp(0.8rem,0.9vw,0.94rem)] lg:leading-[1.6]">
                {backText}
              </p>
              <p className="mt-5 max-w-full border-t border-black/[0.07] pt-4 text-left text-[0.92rem] font-semibold leading-6 text-[#34312B] lg:text-[clamp(0.8rem,0.88vw,0.94rem)]">
                {backFocus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function OrbitalConceptIllustration({
  centerIcon,
  orbitIcon,
  orbitCount,
  variant,
}: {
  centerIcon: string;
  orbitIcon: string;
  orbitCount: number;
  variant: 'incorp' | 'select';
}) {
  const duration = variant === 'incorp' ? 22 : 26;
  const orbitAngles = Array.from({ length: orbitCount }, (_, index) => (360 / orbitCount) * index);

  return (
    <div className="relative z-10 mx-auto flex aspect-square w-full max-w-[13rem] items-center justify-center lg:max-w-[13.25rem] xl:max-w-[13.5rem]">
      <div className="absolute inset-[9%] rounded-full border border-black/[0.06]" />
      <div className="absolute inset-[22%] rounded-full border border-black/[0.05]" />
      <div className="absolute inset-[34%] rounded-full border border-black/[0.045]" />

      <div className="relative z-10 flex h-20 w-20 items-center justify-center border border-black/[0.075] bg-white/62 shadow-[0_18px_44px_rgba(34,33,29,0.08)] backdrop-blur-xl">
        <img src={centerIcon} alt="" className="h-9 w-9 object-contain opacity-80" loading="lazy" decoding="async" />
      </div>

      <div className="arqo-orbit-ring absolute inset-0" style={{ animationDuration: `${duration}s` }}>
        {orbitAngles.map((angle) => (
          <span
            key={`${variant}-${angle}`}
            className="arqo-orbit-item absolute left-1/2 top-1/2 h-0 w-0"
            style={{
              '--angle': `${angle}deg`,
            } as React.CSSProperties}
          >
            <span
              className="arqo-orbit-counter absolute left-0 top-0 h-0 w-0"
              style={{
                '--angle': `${angle}deg`,
                animationDuration: `${duration}s`,
              } as React.CSSProperties}
            >
              <span className="flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-black/[0.06] bg-white/58 shadow-[0_12px_30px_rgba(34,33,29,0.055)] backdrop-blur-lg">
                <img src={orbitIcon} alt="" className="h-[1.1rem] w-[1.1rem] object-contain opacity-60" loading="lazy" decoding="async" />
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
