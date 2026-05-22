import { ReactNode, RefObject, useEffect } from 'react';
import { motion, MotionValue, useMotionValue, useTransform, Variants } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '../../lib/utils';

const arqoEase = [0.16, 1, 0.3, 1] as const;

export function useArqoElementScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  startViewport = 0.86,
  endViewport = 0.44
) {
  const progress = useMotionValue(0);

  useEffect(() => {
    let frame = 0;

    const syncProgress = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const startLine = window.innerHeight * startViewport;
      const endLine = window.innerHeight * endViewport;
      const distance = startLine - endLine + rect.height;
      const nextProgress = distance <= 0 ? 1 : (startLine - rect.top) / distance;

      progress.set(Math.min(Math.max(nextProgress, 0), 1));
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncProgress);
    };

    syncProgress();
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
    };
  }, [endViewport, progress, ref, startViewport]);

  return progress;
}

export const arqoFade: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: arqoEase },
  },
};

export function ArqoReveal({
  children,
  className,
  delay = 0,
  amount = 0.22,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
}) {
  return (
    <motion.div
      variants={arqoFade}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ArqoSection({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('relative overflow-hidden px-5 py-20 sm:px-8 lg:px-10 lg:py-32', className)}>
      <div className="relative z-10 mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function ArqoEditorialPause({
  id,
  children,
  tone = 'light',
  align = 'center',
}: {
  id?: string;
  children: ReactNode;
  tone?: 'light' | 'warm' | 'dark';
  align?: 'center' | 'left';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const scrollYProgress = useArqoElementScrollProgress(ref, 0.88, 0.18);
  const y = useTransform(scrollYProgress, [0, 1], [28, -18]);
  const opacity = useTransform(scrollYProgress, [0, 0.35, 0.86, 1], [0.34, 1, 1, 0.62]);

  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'relative overflow-hidden px-5 py-24 sm:px-8 lg:px-10 lg:py-44',
        tone === 'light' && 'bg-white text-[#171715]',
        tone === 'warm' && 'bg-[#F8F7F3] text-[#171715]',
        tone === 'dark' && 'bg-[#171715] text-white'
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <motion.div
        style={{ y, opacity }}
        className={cn(
          'relative z-10 mx-auto max-w-6xl',
          align === 'center' ? 'text-center' : 'text-left'
        )}
      >
        <p
          className={cn(
            'arqo-heading text-balance text-[2.15rem] font-medium leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-7xl',
            tone === 'dark' ? 'text-white' : 'text-[#171715]'
          )}
        >
          {children}
        </p>
      </motion.div>
    </section>
  );
}

export function ArqoTitle({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <ArqoReveal className={cn('mx-auto max-w-4xl', align === 'center' && 'text-center', className)}>
      {eyebrow && <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.36em] text-[#7B786E]">{eyebrow}</p>}
      <StableTextReveal
        text={title}
        as="h2"
        className="arqo-heading text-balance text-[2.1rem] font-medium leading-[1.06] tracking-[-0.04em] text-[#161615] sm:text-5xl lg:text-6xl"
      />
      {subtitle && (
        <p className={cn('mt-7 text-base leading-8 text-[#6D6A62] sm:text-lg', align === 'center' ? 'mx-auto max-w-3xl' : 'max-w-3xl')}>
          {subtitle}
        </p>
      )}
    </ArqoReveal>
  );
}

export function StableTextReveal({
  text,
  className,
  as = 'span',
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const scrollYProgress = useArqoElementScrollProgress(ref, 0.86, 0.44);
  const Tag = as;
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  return (
    <Tag ref={setRef} style={{ position: 'relative' }} className={cn('arqo-text-stable', className)}>
      {text.split(' ').map((word, wordIndex, words) => (
        <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap">
          {Array.from(word).map((char, charIndex) => {
            const previousChars = words.slice(0, wordIndex).join('').length + wordIndex;
            return (
              <StableCharacter
                key={`${word}-${charIndex}`}
                char={char}
                index={previousChars + charIndex}
                total={text.length}
                progress={scrollYProgress}
              />
            );
          })}
          {wordIndex < words.length - 1 && <span aria-hidden="true">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}

function StableCharacter({
  char,
  index,
  total,
  progress,
}: {
  char: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = total <= 1 ? 0 : (index / Math.max(total - 1, 1)) * 0.72;
  const end = Math.min(start + 0.2, 1);
  const color = useTransform(progress, [start, end], ['rgba(22,22,21,0.22)', 'rgba(22,22,21,1)']);

  return (
    <motion.span style={{ color }} className="inline">
      {char}
    </motion.span>
  );
}

export function ArqoButton({
  href,
  children,
  dark = false,
  onClick,
}: {
  href?: string;
  children: ReactNode;
  dark?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    'group relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-full px-6 text-center text-sm font-semibold transition duration-500 max-sm:w-full',
    dark
      ? 'bg-[#181816] text-white shadow-[0_18px_44px_rgba(18,18,16,0.18)] hover:bg-black hover:shadow-[0_22px_58px_rgba(18,18,16,0.22)]'
      : 'border border-black/[0.08] bg-white/74 text-[#181816] backdrop-blur-xl hover:border-black/[0.14] hover:bg-white hover:shadow-[0_18px_42px_rgba(34,33,29,0.08)]'
  );
  const content = (
    <>
      <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)] transition duration-700 group-hover:translate-x-[120%]" />
      <motion.span
        whileHover={{ x: 1 }}
        className="relative z-10 inline-flex items-center"
      >
        {children}
      </motion.span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <a href={href} className={className}>
      {content}
    </a>
  );
}

export function ArqoIconBadge({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.06] bg-white/82 text-[#5D594F] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(34,33,29,0.06)]',
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function ArqoCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.006 }}
      transition={{ duration: 0.5, ease: arqoEase }}
      className={cn(
        'rounded-[26px] border border-black/[0.07] bg-white/72 p-6 shadow-[0_22px_60px_rgba(34,33,29,0.055)] backdrop-blur-2xl transition-colors duration-500 hover:border-black/[0.12] hover:bg-white/86',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function ArqoImagePlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollYProgress = useArqoElementScrollProgress(ref, 0.92, 0.18);
  const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

  return (
    <div ref={ref} className={cn('group relative overflow-hidden rounded-[28px] border border-black/[0.07] bg-[#F2F0EB]', className)}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#f3f1ec_48%,#e8e4dc_100%)]" />
      <motion.div style={{ y }} className="absolute inset-0 scale-105 transition duration-700 group-hover:scale-[1.08]">
        <div className="absolute inset-5 rounded-[22px] border border-black/[0.055]" />
        <div className="absolute left-7 top-7 h-px w-3/5 bg-black/10" />
        <div className="absolute bottom-7 right-7 h-3/5 w-px bg-black/10" />
        <div className="absolute left-8 top-1/2 h-px w-[calc(100%-4rem)] -translate-y-1/2 bg-black/[0.06]" />
        <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-black/[0.045]" />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
        <span className="max-w-[220px] text-xs font-semibold uppercase tracking-[0.26em] text-[#817D73]">{label}</span>
      </div>
    </div>
  );
}
