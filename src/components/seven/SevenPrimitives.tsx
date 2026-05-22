import { ReactNode, useState } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '../../lib/utils';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.22 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <Reveal className={cn('mx-auto max-w-4xl', align === 'center' && 'text-center')}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#E76912]">{eyebrow}</p>
      <ScrollTextReveal text={title} className="text-balance text-[2.05rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl" />
      {description && (
        <p className={cn('mt-6 text-base leading-8 text-[#67676F] sm:text-lg', align === 'center' ? 'mx-auto max-w-3xl' : 'max-w-3xl')}>
          {description}
        </p>
      )}
    </Reveal>
  );
}

export function ScrollTextReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 86%', 'end 42%'] });
  const words = text.split(' ');

  return (
    <h2 ref={ref} style={{ position: 'relative' }} className={cn('text-[#111114]', className)}>
      {words.map((word, wordIndex) => {
        const previousChars = words.slice(0, wordIndex).join('').length + wordIndex;
        const totalChars = text.length;

        return (
          <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap">
            {Array.from(word).map((char, charIndex) => (
              <RevealCharacter
                key={`${word}-${char}-${charIndex}`}
                char={char}
                index={previousChars + charIndex}
                total={totalChars}
                progress={scrollYProgress}
              />
            ))}
            {wordIndex < words.length - 1 && (
              <RevealCharacter
                char=" "
                index={previousChars + word.length}
                total={totalChars}
                progress={scrollYProgress}
              />
            )}
          </span>
        );
      })}
    </h2>
  );
}

function RevealCharacter({
  char,
  index,
  total,
  progress,
}: {
  char: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const start = total <= 1 ? 0 : (index / Math.max(total - 1, 1)) * 0.78;
  const end = total <= 1 ? 1 : Math.min(start + 0.18, 0.96);
  const color = useTransform(progress, [start, end], ['rgba(17,17,20,0.16)', 'rgba(17,17,20,1)']);

  return (
    <motion.span style={{ color }} className="inline">
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
}

export function IconBadge({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-[#E76912] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_34px_rgba(17,17,20,0.08)]',
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function PremiumCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-[30px] border border-black/[0.06] bg-white/76 p-6 shadow-[0_24px_70px_rgba(17,17,20,0.08)] backdrop-blur-2xl',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function AssetFrame({
  src,
  alt,
  initials,
  label,
  className,
  fit = 'cover',
  loading = 'lazy',
  fetchPriority,
}: {
  src: string;
  alt: string;
  initials: string;
  label: string;
  className?: string;
  fit?: 'cover' | 'contain';
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative overflow-hidden rounded-[32px] border border-black/[0.06] bg-[#F4F4F5]', className)}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={cn('absolute inset-0 h-full w-full', fit === 'contain' ? 'object-contain p-20' : 'object-cover')}
        />
      )}
      {failed && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(231,105,18,0.20),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f2f2f3_46%,#e8e8eb_100%)]">
          <div className="absolute inset-5 rounded-[26px] border border-black/[0.06]" />
          <div className="absolute left-8 top-8 h-px w-2/3 bg-black/10" />
          <div className="absolute bottom-9 right-8 h-2/3 w-px bg-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span className="text-6xl font-semibold tracking-[-0.07em] text-[#111114] sm:text-7xl">{initials}</span>
            <span className="mt-4 max-w-[220px] text-xs font-semibold uppercase tracking-[0.24em] text-[#77777F]">
              {label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AnchorButton({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex min-h-[52px] items-center justify-center rounded-full px-6 text-center text-sm font-semibold transition duration-300 max-sm:w-full',
        dark
          ? 'bg-[#111114] text-white shadow-[0_18px_44px_rgba(17,17,20,0.20)] hover:bg-black'
          : 'border border-black/[0.08] bg-white/70 text-[#111114] backdrop-blur-xl hover:bg-white'
      )}
    >
      {children}
    </a>
  );
}
