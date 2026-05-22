import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Reveal } from './SevenPrimitives';

function CountUp({
  target,
  prefix = '+',
  suffix = '',
}: {
  target: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return undefined;

    const duration = 2000;
    const startedAt = performance.now();
    let animation = 0;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startedAt;
      const progress = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 3);
      setValue(target * progress);

      if (elapsed < duration) {
        animation = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [isInView, target]);

  const display =
    suffix === ' mil' || suffix === ''
      ? Math.round(value).toLocaleString('pt-BR')
      : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

const resultCards = [
  { target: 250, suffix: '', label: 'empreendimentos lançados' },
  { target: 20, suffix: ' mil', label: 'unidades vendidas' },
  { target: 6.5, prefix: '+R$', suffix: ' bi', label: 'em VGV' },
];

export function SevenResults() {
  return (
    <section className="overflow-hidden bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="rounded-[38px] border border-black/[0.06] bg-[#111114] p-8 text-white shadow-[0_34px_100px_rgba(17,17,20,0.22)] sm:p-12 lg:p-16">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF9B45]">Resultados e histórico</p>
            <h2 className="mt-5 max-w-5xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
              Enquanto muitos ainda celebram metas, nós celebramos marcos históricos.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {resultCards.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6">
                  <p className="text-5xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">
                    <CountUp target={item.target} prefix={item.prefix} suffix={item.suffix} />
                  </p>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/58">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
