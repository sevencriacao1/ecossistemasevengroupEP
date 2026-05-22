import { ArrowLeft, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SevenAbout } from '../components/seven/SevenAbout';
import { SevenArqoBridge } from '../components/seven/SevenArqoBridge';
import { SevenCommitment } from '../components/seven/SevenCommitment';
import { SevenCreativeTeam } from '../components/seven/SevenCreativeTeam';
import { SevenCTA } from '../components/seven/SevenCTA';
import { SevenDifferentials } from '../components/seven/SevenDifferentials';
import { SevenEcosystem } from '../components/seven/SevenEcosystem';
import { SevenFocus } from '../components/seven/SevenFocus';
import { SevenHero } from '../components/seven/SevenHero';
import { SevenLeadership } from '../components/seven/SevenLeadership';
import { SevenMetrics } from '../components/seven/SevenMetrics';
import { SevenMindset } from '../components/seven/SevenMindset';
import { SevenPainPoints } from '../components/seven/SevenPainPoints';
import { SevenPillars } from '../components/seven/SevenPillars';
import { SevenResults } from '../components/seven/SevenResults';
import { navItems } from '../components/seven/sevenContent';
import { cn } from '../lib/utils';

export function SevenGroupPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderOnDark, setIsHeaderOnDark] = useState(false);
  const inertiaTimer = useRef<number | null>(null);
  const lastWheelDirection = useRef(1);
  const headerToneRef = useRef(false);

  const handleSoftWheel = (event: globalThis.WheelEvent) => {
    lastWheelDirection.current = event.deltaY >= 0 ? 1 : -1;

    if (inertiaTimer.current) {
      window.clearTimeout(inertiaTimer.current);
    }

    inertiaTimer.current = window.setTimeout(() => {
      window.scrollBy({
        top: lastWheelDirection.current * 72,
        behavior: 'smooth',
      });
    }, 90);
  };

  useEffect(() => {
    const onWheel = (event: globalThis.WheelEvent) => handleSoftWheel(event);
    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (inertiaTimer.current) {
        window.clearTimeout(inertiaTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const pointIsOnDarkSection = (y: number) => {
      const darkSections = Array.from(document.querySelectorAll<HTMLElement>('[data-seven-tone="dark"]'));

      return darkSections.some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= y && rect.bottom >= y;
      });
    };

    const syncHeaderTone = () => {
      frame = 0;
      const nextHeaderTone = pointIsOnDarkSection(88);

      if (headerToneRef.current !== nextHeaderTone) {
        headerToneRef.current = nextHeaderTone;
        setIsHeaderOnDark(nextHeaderTone);
      }
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncHeaderTone);
    };

    syncHeaderTone();
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
      className="safe-page-x min-h-screen scroll-smooth bg-[#F7F7F8] text-[#111114] selection:bg-[#ff6a00]/20"
    >
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 sm:px-6">
        <nav
          className={cn(
            'mx-auto flex max-w-7xl items-center justify-between rounded-full border px-4 py-3 backdrop-blur-2xl transition duration-700',
            isHeaderOnDark
              ? 'border-white/12 bg-black/72 text-white shadow-none'
              : 'border-black/[0.06] bg-white/72 text-[#111114] shadow-[0_18px_54px_rgba(17,17,20,0.10)]'
          )}
        >
          <button
            type="button"
            onClick={() => navigate('/home')}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition',
              isHeaderOnDark ? 'text-white hover:bg-white/10' : 'text-[#111114] hover:bg-black/[0.04]'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <img
              src="/assets/seven/Logo%20Seven%20Group.webp"
              alt="Seven Group"
              className={cn('h-5 w-auto object-contain transition duration-700', isHeaderOnDark && '[filter:brightness(0)_invert(1)]')}
              loading="eager"
              decoding="async"
            />
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  isHeaderOnDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-[#65656D] hover:bg-black/[0.04] hover:text-[#111114]'
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
              isHeaderOnDark ? 'bg-white text-[#111114]' : 'bg-[#111114] text-white'
            )}
            aria-label="Abrir navegação"
          >
            <Menu className="h-4 w-4" />
          </button>
        </nav>

        <div
          className={cn(
            'mx-auto mt-2 grid max-w-7xl gap-1 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/86 p-2 shadow-[0_18px_54px_rgba(17,17,20,0.10)] backdrop-blur-2xl transition-all lg:hidden',
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 border-transparent p-0 opacity-0'
          )}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#424248] hover:bg-black/[0.04]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      <SevenHero />
      <SevenAbout />
      <SevenMindset />
      <SevenMetrics />
      <SevenResults />
      <SevenLeadership />
      <SevenCreativeTeam />
      <SevenEcosystem />
      <SevenPainPoints />
      <SevenPillars />
      <SevenDifferentials />
      <SevenFocus />
      <SevenCommitment />
      <SevenArqoBridge />
      <SevenCTA />
    </main>
  );
}
