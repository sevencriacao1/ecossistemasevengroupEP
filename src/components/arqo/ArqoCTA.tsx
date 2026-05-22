import { ArrowUp, BookOpen, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, WheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { arqoAssets } from './arqoContent';

const signatureSource = '/assets/seven/assign_gilson%2005.svg';
const signatureDurations = [1.12, 0.92, 0.94, 1.06, 1.16, 0.26, 0.26];
const signatureStrokeWidths = [92, 58, 74, 58, 34, 28, 28];
const easterEggScrollThreshold = 560;
const easterEggScrollWindowMs = 1100;

interface SignaturePath {
  d: string;
}

function SignatureReveal({ active }: { active: boolean }) {
  const maskId = useId().replace(/:/g, '');
  const [paths, setPaths] = useState<SignaturePath[]>([]);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1480, height: 624 });

  useEffect(() => {
    let isMounted = true;

    fetch(signatureSource)
      .then((response) => response.text())
      .then((svgText) => {
        if (!isMounted) return;

        const documentSvg = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        const svgElement = documentSvg.querySelector('svg');
        const sourcePaths = Array.from(documentSvg.querySelectorAll('path'))
          .map((path) => ({ d: path.getAttribute('d') ?? '' }))
          .filter((path) => path.d.length > 0);

        const nextViewBox = svgElement?.getAttribute('viewBox')?.split(/\s+/).map(Number);
        if (nextViewBox?.length === 4 && nextViewBox.every(Number.isFinite)) {
          setViewBox({
            x: nextViewBox[0],
            y: nextViewBox[1],
            width: nextViewBox[2],
            height: nextViewBox[3],
          });
        }

        setPaths(sourcePaths);
      })
      .catch(() => setPaths([]));

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="pointer-events-none relative mx-auto mt-[-6px] h-[96px] w-[min(76vw,390px)] sm:h-[118px] sm:w-[390px]">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/[0.025]" />
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="absolute inset-0 h-full w-full overflow-visible opacity-95 drop-shadow-[0_14px_32px_rgba(255,255,255,0.08)]"
        aria-hidden="true"
      >
        <defs>
          {paths.map((path, index) => (
            <mask
              key={`mask-${index}`}
              id={`${maskId}-signature-${index}`}
              maskUnits="userSpaceOnUse"
              x={viewBox.x}
              y={viewBox.y}
              width={viewBox.width}
              height={viewBox.height}
            >
              <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="black" />
              <motion.path
                d={path.d}
                fill="none"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={signatureStrokeWidths[index] ?? 56}
                initial={false}
                animate={{ pathLength: active ? 1 : 0 }}
                transition={{
                  duration: signatureDurations[index] ?? 0.72,
                  ease: [0.42, 0, 0.18, 1],
                  delay: active ? 0.28 + index * 0.34 : 0,
                }}
              />
              <motion.path
                d={path.d}
                fill="white"
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={{
                  duration: 0.18,
                  delay: active ? 0.28 + index * 0.34 + (signatureDurations[index] ?? 0.72) * 0.82 : 0,
                }}
              />
              <motion.rect
                x={viewBox.x}
                y={viewBox.y}
                width={viewBox.width}
                height={viewBox.height}
                initial={false}
                fill="white"
                animate={{ opacity: active ? 1 : 0 }}
                transition={{
                  duration: 0.01,
                  delay: active ? 0.28 + index * 0.34 + (signatureDurations[index] ?? 0.72) : 0,
                }}
              />
            </mask>
          ))}
        </defs>

        {paths.map((path, index) => (
          <motion.path
            key={`${path.d.slice(0, 24)}-${index}`}
            d={path.d}
            fill="rgba(254,254,254,0.92)"
            mask={`url(#${maskId}-signature-${index})`}
            initial={false}
            animate={{
              opacity: active ? 1 : 0,
              filter: active ? 'blur(0px)' : 'blur(1.2px)',
            }}
            transition={{
              opacity: {
                duration: 0.12,
                delay: active ? 0.24 + index * 0.34 : 0,
              },
              filter: {
                duration: 0.32,
                delay: active ? 0.24 + index * 0.34 : 0,
              },
            }}
          />
        ))}
      </svg>
    </div>
  );
}

function ArqoCTALinkButton({
  children,
  href,
  onClick,
  variant = 'light',
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'light' | 'gold';
}) {
  const className = variant === 'gold'
    ? 'inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#BAA072] px-6 text-sm font-semibold text-[#171715] shadow-[0_18px_44px_rgba(186,160,114,0.22)] transition duration-300 hover:bg-[#c8ad7d]'
    : 'inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#171715] transition duration-300 hover:bg-[#E8E6E0]';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function ArqoCTA() {
  const navigate = useNavigate();
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const scrollIntentRef = useRef({ amount: 0, lastAt: 0 });

  const handleCtaWheel = (event: WheelEvent<HTMLElement>) => {
    const resetIntent = () => {
      scrollIntentRef.current = { amount: 0, lastAt: 0 };
    };

    if (event.deltaY <= 0) {
      resetIntent();
      return;
    }

    const page = document.documentElement;
    const isAtPageEnd = window.innerHeight + window.scrollY >= page.scrollHeight - 2;

    if (!isAtPageEnd) {
      resetIntent();
      return;
    }

    const now = window.performance.now();
    const elapsed = now - scrollIntentRef.current.lastAt;
    const previousAmount = elapsed > easterEggScrollWindowMs ? 0 : scrollIntentRef.current.amount;
    const nextAmount = previousAmount + event.deltaY;

    scrollIntentRef.current = { amount: nextAmount, lastAt: now };

    if (nextAmount >= easterEggScrollThreshold) {
      setWelcomeVisible(true);
      resetIntent();
    }
  };

  return (
    <>
      <section
        data-arqo-tone="dark"
        onWheel={handleCtaWheel}
        className="relative flex min-h-[100svh] overflow-hidden bg-[#11110f] px-5 py-20 text-white sm:px-8 lg:px-10"
      >
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08)_0%,transparent_26%,transparent_70%,rgba(255,255,255,0.045)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/58 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-7xl flex-col items-center justify-center text-center">
          <div className="mb-14 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-white/22 to-transparent" />
          <img src={arqoAssets.logoWhite} alt="ARQO" className="mx-auto h-auto w-[min(204px,46vw)] object-contain" loading="lazy" decoding="async" />
          <h2 className="arqo-heading mx-auto mt-14 max-w-4xl text-balance text-[2.15rem] font-medium leading-[1.08] tracking-[-0.035em] text-white sm:text-6xl">
            Clareza, critério e direção para escolhas de alto valor.
          </h2>

          <div className="mt-14 flex flex-col justify-center gap-3 sm:flex-row">
            <ArqoCTALinkButton onClick={() => navigate('/home', { state: { showChoices: true } })}>
              <Home className="mr-2 h-4 w-4" />
              Voltar ao ecossistema
            </ArqoCTALinkButton>
            <ArqoCTALinkButton onClick={() => navigate('/dashboard')} variant="gold">
              <BookOpen className="mr-2 h-4 w-4" />
              Acessar as aulas
            </ArqoCTALinkButton>
            <ArqoCTALinkButton href="#topo">
              <ArrowUp className="mr-2 h-4 w-4" />
              Voltar ao topo
            </ArqoCTALinkButton>
          </div>
        </div>
      </section>

      <section
        onWheel={(event) => {
          if (event.deltaY < 0) setWelcomeVisible(false);
        }}
        className={`fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#080807] px-5 text-white transition duration-700 ${welcomeVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!welcomeVisible}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(210,198,176,0.18),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(255,255,255,0.08),transparent_22%)]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="border border-white/10 bg-white/[0.055] px-8 py-10 shadow-[0_34px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-14 sm:py-14">
            <img src={arqoAssets.logoWhite} alt="ARQO" className="mx-auto h-auto w-[min(178px,44vw)] object-contain opacity-95" loading="lazy" decoding="async" />
            <h2 className="arqo-heading mt-8 max-w-4xl text-center text-[2.2rem] font-medium leading-[1.04] tracking-[-0.04em] sm:text-6xl min-[1366px]:text-7xl">
              Seja muito bem-vindo
              <br />
              <span className="text-[#BAA072]">à nossa equipe.</span>
            </h2>
          </div>
          <SignatureReveal active={welcomeVisible} />
        </div>
      </section>
    </>
  );
}
