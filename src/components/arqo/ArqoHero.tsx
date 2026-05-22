import lottie from 'lottie-web/build/player/lottie_light';
import { useEffect, useRef, useState } from 'react';
import { gsap, scheduleScrollTriggerRefresh, useGSAP } from '../../lib/gsap';

const logoUrl = '/assets/arqo/Logo%20Arqo%20Branco.svg';
const scrollAnimationUrl = '/assets/arqo/scroll%20down.json';

export function ArqoHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const introHintRef = useRef<HTMLDivElement | null>(null);
  const scrollHintRef = useRef<HTMLDivElement | null>(null);
  const [logoSvg, setLogoSvg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(logoUrl)
      .then((response) => response.text())
      .then((svg) => {
        if (isMounted) setLogoSvg(svg);
      })
      .catch(() => {
        if (isMounted) setLogoSvg('');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const container = scrollHintRef.current;
    if (!container) return undefined;

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: scrollAnimationUrl,
    });

    return () => animation.destroy();
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const background = backgroundRef.current;
      const logo = logoRef.current;
      const introHint = introHintRef.current;

      if (!section || !background || !logo || !logoSvg) return;

      const svg = logo.querySelector('svg');
      const paths = gsap.utils.toArray<SVGGeometryElement>(
        logo.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect')
      );

      if (!svg || paths.length === 0) {
        gsap.set(logo, { autoAlpha: 1 });
        return;
      }

      gsap.set(svg, {
        width: '100%',
        height: 'auto',
        overflow: 'visible',
      });

      const pathLengths = new WeakMap<SVGGeometryElement, number>();
      const getPathLength = (element: SVGGeometryElement) => {
        const current = pathLengths.get(element);
        if (current !== undefined) return current;

        const next = element.getTotalLength();
        pathLengths.set(element, next);
        return next;
      };

      gsap.set(logo, { autoAlpha: 0, scale: 0.985 });
      if (introHint) gsap.set(introHint, { autoAlpha: 1, y: 0 });

      gsap.set(paths, {
        stroke: '#ffffff',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: '#ffffff',
        strokeDasharray: (_index, element: SVGGeometryElement) => getPathLength(element),
        strokeDashoffset: (_index, element: SVGGeometryElement) => getPathLength(element),
        strokeOpacity: 0,
        fillOpacity: 0,
        opacity: 1,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => (window.innerWidth < 768 ? '+=140%' : '+=220%'),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 2,
        },
      });

      timeline
        .fromTo(background, { scale: 1.08 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .to(introHint, { autoAlpha: 0, y: -18, duration: 0.18, ease: 'power1.out' }, 0)
        .to(logo, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 0.2)
        .to(paths, { strokeOpacity: 1, duration: 0.1, ease: 'none' }, 0.2)
        .to(paths, { strokeDashoffset: 0, duration: 0.78, stagger: 0.02, ease: 'none' }, 0.28)
        .to(paths, { fillOpacity: 1, duration: 0.36, stagger: 0.01, ease: 'none', immediateRender: false }, 0.74)
        .to(paths, { strokeWidth: 1.1, duration: 0.2, ease: 'none' }, 0.84)
        .to(logo, { scale: 1.04, duration: 0.1, ease: 'power1.out' }, 0.94);

      scheduleScrollTriggerRefresh();
    },
    { dependencies: [logoSvg], scope: sectionRef, revertOnUpdate: true }
  );

  return (
    <section
      ref={sectionRef}
      data-arqo-tone="dark"
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-[#11100f] text-white"
      aria-label="Abertura institucional ARQO"
    >
      <div ref={backgroundRef} className="absolute inset-0 will-change-transform">
        <picture aria-hidden="true" className="block h-full w-full">
          <source
            type="image/avif"
            srcSet="/assets/arqo/background_hero-mobile.avif 768w, /assets/arqo/background_hero-tablet.avif 1280w, /assets/arqo/background_hero-desktop.avif 1920w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/assets/arqo/background_hero-mobile.webp 768w, /assets/arqo/background_hero-tablet.webp 1280w, /assets/arqo/background_hero-desktop.webp 1920w"
            sizes="100vw"
          />
          <img
            src="/assets/arqo/background_hero-desktop.webp"
            alt=""
            className="block h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.26)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.08),transparent_34%)] mix-blend-screen" />

      <div className="relative z-10 flex h-full min-h-[100svh] items-center justify-center px-6">
        {logoSvg === null ? null : logoSvg ? (
          <div
            ref={logoRef}
            className="w-[clamp(220px,72vw,420px)] will-change-transform md:w-[clamp(320px,42vw,760px)] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: logoSvg }}
          />
        ) : (
          <div
            ref={logoRef}
            className="w-[clamp(220px,72vw,420px)] opacity-100 md:w-[clamp(320px,42vw,760px)]"
            aria-hidden="true"
          >
            <img src={logoUrl} alt="" className="h-auto w-full opacity-100" loading="eager" decoding="async" />
          </div>
        )}
        <span className="sr-only">ARQO Inteligência Imobiliária</span>
        <div
          ref={introHintRef}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          aria-hidden="true"
        >
          <div
            ref={scrollHintRef}
            className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] [&_svg]:h-full [&_svg]:w-full"
          />
          <p className="mt-5 text-[1em] font-medium tracking-[0.08em] text-white/78">
            Deslize para iniciar
          </p>
        </div>
      </div>
    </section>
  );
}
