import { ArrowUp, BookOpen, Home, Layers3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { WheelEvent, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnchorButton, Reveal } from './SevenPrimitives';

const signatureSource = '/assets/seven/assign_gilson%2005.svg';
const sevenLogo = '/assets/seven/Logo%20Seven%20Group.webp';
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

export function SevenCTA() {
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
      <section onWheel={handleCtaWheel} className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="rounded-[42px] border border-black/[0.06] bg-white p-8 text-center shadow-[0_34px_100px_rgba(17,17,20,0.10)] sm:p-12 lg:p-16">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#E76912]">Seven Group</p>
              <h2 className="mx-auto mt-5 max-w-4xl text-balance text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#111114] sm:text-7xl">
                Da estratégia ao movimento de mercado.
              </h2>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/home', { state: { showChoices: true } })}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#111114] px-6 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(17,17,20,0.20)] transition hover:bg-black"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao ecossistema
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#E76912] px-6 text-sm font-semibold text-[#111114] shadow-[0_18px_44px_rgba(231,105,18,0.24)] transition hover:bg-[#ff7a1a]"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Acessar as aulas
                </button>
                <AnchorButton href="#pilares">
                  <Layers3 className="mr-2 h-4 w-4" />
                  Relembrar os pilares
                </AnchorButton>
                <AnchorButton href="#topo">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Retornar ao topo
                </AnchorButton>
              </div>
            </div>
          </Reveal>
        </div>
        <a
          href="#topo"
          aria-label="Voltar ao topo"
          className="fixed bottom-5 right-5 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-black/[0.08] bg-white/78 text-[#111114] shadow-[0_18px_44px_rgba(17,17,20,0.16)] backdrop-blur-2xl transition hover:bg-white sm:flex"
        >
          <ArrowUp className="h-4 w-4" />
        </a>
      </section>

      <section
        onWheel={(event) => {
          if (event.deltaY < 0) setWelcomeVisible(false);
        }}
        className={`fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black px-5 text-white transition duration-700 ${welcomeVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!welcomeVisible}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(231,105,18,0.22),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(255,255,255,0.08),transparent_22%)]" />
        <Reveal className="relative z-10 flex flex-col items-center">
          <div className="rounded-[38px] border border-white/10 bg-white/[0.055] px-8 py-10 text-center shadow-[0_34px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-14 sm:py-14">
            <img
              src={sevenLogo}
              alt="Seven Group"
              className="mx-auto h-auto w-[min(210px,48vw)] object-contain [filter:brightness(0)_invert(1)]"
              loading="lazy"
              decoding="async"
            />
            <h2 className="mt-7 max-w-4xl text-center text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl min-[1366px]:whitespace-nowrap min-[1366px]:text-7xl">
              Seja muito bem-vindo
              <br />
              à nossa equipe.
            </h2>
          </div>
          <SignatureReveal active={welcomeVisible} />
        </Reveal>
      </section>
    </>
  );
}
