import { ArrowLeft, ArrowUp, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArqoConcept } from '../components/arqo/ArqoConcept';
import { ArqoCTA } from '../components/arqo/ArqoCTA';
import { ArqoCuratedClarity } from '../components/arqo/ArqoCuratedClarity';
import { ArqoCulture } from '../components/arqo/ArqoCulture';
import { ArqoDeliverables } from '../components/arqo/ArqoDeliverables';
import { ArqoDifferential } from '../components/arqo/ArqoDifferential';
import { ArqoEssence } from '../components/arqo/ArqoEssence';
import { ArqoExperience } from '../components/arqo/ArqoExperience';
import { ArqoHero } from '../components/arqo/ArqoHero';
import { ArqoHowWeWork } from '../components/arqo/ArqoHowWeWork';
import { ArqoInvestorJourney } from '../components/arqo/ArqoInvestorJourney';
import { ArqoManifesto } from '../components/arqo/ArqoManifesto';
import { ArqoEditorialPause } from '../components/arqo/ArqoPrimitives';
import { ArqoSevenBridge } from '../components/arqo/ArqoSevenBridge';
import { ArqoStructures } from '../components/arqo/ArqoStructures';
import { ArqoThinking } from '../components/arqo/ArqoThinking';
import { ArqoWhoWeAre } from '../components/arqo/ArqoWhoWeAre';
import { arqoAssets, arqoNavItems } from '../components/arqo/arqoContent';
import { cn } from '../lib/utils';

export function ArqoPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(arqoNavItems[0].href);
  const [isHeaderOnDark, setIsHeaderOnDark] = useState(true);
  const [isNotchOnDark, setIsNotchOnDark] = useState(true);
  const headerToneRef = useRef(true);
  const notchToneRef = useRef(true);

  useEffect(() => {
    const sections = arqoNavItems
      .map((item) => document.querySelector(item.href))
      .filter((section): section is Element => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(`#${visible.target.id}`);
        }
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0.08, 0.2, 0.42] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;

    const pointIsOnDarkSection = (y: number) => {
      const darkSections = Array.from(document.querySelectorAll<HTMLElement>('[data-arqo-tone="dark"]'));

      return darkSections.some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= y && rect.bottom >= y;
      });
    };

    const syncFixedElementTone = () => {
      frame = 0;
      const nextHeaderTone = pointIsOnDarkSection(88);
      const nextNotchTone = pointIsOnDarkSection(window.innerHeight / 2);

      if (headerToneRef.current !== nextHeaderTone) {
        headerToneRef.current = nextHeaderTone;
        setIsHeaderOnDark(nextHeaderTone);
      }

      if (notchToneRef.current !== nextNotchTone) {
        notchToneRef.current = nextNotchTone;
        setIsNotchOnDark(nextNotchTone);
      }
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncFixedElementTone);
    };

    syncFixedElementTone();
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
    };
  }, []);

  return (
    <main
      id="topo"
      className="safe-page-x min-h-screen scroll-smooth bg-[#F8F7F3] text-[#161615] selection:bg-[#c8c0b1]/40"
    >
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 sm:px-6">
        <nav
          className={cn(
            'mx-auto flex max-w-7xl items-center justify-between rounded-full border px-4 py-3 backdrop-blur-2xl transition duration-700',
            isHeaderOnDark
              ? 'border-white/12 bg-[#080807]/72 text-white shadow-none'
              : 'border-black/[0.06] bg-white/72 text-[#161615] shadow-[0_18px_54px_rgba(34,33,29,0.08)]'
          )}
        >
          <button
            type="button"
            onClick={() => navigate('/home', { state: { showChoices: true } })}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition',
              isHeaderOnDark ? 'text-white hover:bg-white/10' : 'text-[#161615] hover:bg-black/[0.04]'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <img src={isHeaderOnDark ? arqoAssets.logoWhite : arqoAssets.logo} alt="ARQO" className="h-5 w-auto object-contain" loading="eager" decoding="async" />
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {arqoNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  isHeaderOnDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-[#6D6A62] hover:bg-black/[0.04] hover:text-[#161615]'
                )}
              >
                {item.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full lg:hidden',
              isHeaderOnDark ? 'bg-white text-[#171715]' : 'bg-[#171715] text-white'
            )}
            aria-label="Abrir navegação"
          >
            <Menu className="h-4 w-4" />
          </button>
        </nav>

        <div
          className={cn(
            'mx-auto mt-2 grid max-w-7xl gap-1 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/88 p-2 shadow-[0_18px_54px_rgba(34,33,29,0.08)] backdrop-blur-2xl transition-all lg:hidden',
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 border-transparent p-0 opacity-0'
          )}
        >
          {arqoNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#4E4B45] hover:bg-black/[0.04]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      <ArqoHero />
      <ArqoManifesto />
      <ArqoEditorialPause tone="warm">O cliente não precisa de mais opções. Precisa de direção.</ArqoEditorialPause>
      <ArqoWhoWeAre />
      <ArqoConcept />
      <ArqoInvestorJourney />
      <ArqoCuratedClarity />
      <ArqoHowWeWork />
      <ArqoExperience />
      <ArqoStructures />
      <ArqoThinking />
      <ArqoDeliverables />
      <ArqoDifferential />
      <ArqoCulture />
      <ArqoEssence />
      <ArqoSevenBridge />
      <ArqoCTA />

      <nav
        className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 xl:flex"
        aria-label="Navegação lateral ARQO"
      >
        {arqoNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3"
            aria-label={item.label}
          >
            <span
              className={cn(
                'block h-7 w-px origin-center transition-all duration-700 group-hover:h-12',
                activeSection === item.href ? 'h-14 opacity-100' : 'opacity-50',
                isNotchOnDark ? 'bg-white group-hover:bg-white group-hover:opacity-100' : 'bg-[#171715] group-hover:bg-[#171715] group-hover:opacity-100'
              )}
            />
            <span
              className={cn(
                'translate-x-1 text-[10px] font-semibold uppercase tracking-[0.34em] transition duration-700 group-hover:translate-x-0 group-hover:opacity-100',
                activeSection === item.href ? 'translate-x-0 opacity-100' : 'opacity-50',
                isNotchOnDark ? 'text-white' : 'text-[#171715]'
              )}
            >
              {item.label}
            </span>
          </a>
        ))}
      </nav>

      <a
        href="#topo"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.08] bg-white/72 text-[#171715] shadow-[0_18px_44px_rgba(34,33,29,0.12)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white"
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-4 w-4" />
      </a>
    </main>
  );
}
