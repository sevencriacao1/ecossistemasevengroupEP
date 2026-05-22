import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Building2, LayoutDashboard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SevenEntryTransitionProps {
  onLogout: () => void;
  initialChoices?: boolean;
  notice?: string;
}

const message = 'Aquilo que é normal para você,\né loucura para a gente.\nE aquilo que é normal para a gente,\né loucura para você.';
const choiceTitle = 'Aqui inicia a sua jornada!';
const choiceSubtitle = 'Selecione a empresa da qual faz parte.';

const particleColors = ['#111111', '#2A211A', '#5A2A08', '#8A3A05', '#C65305', '#F26F12', '#FF8A1F', '#FFB066'];

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  seed: number;
  seed2: number;
  size: number;
  color: string;
  opacity: number;
  scale: number;
}

function ParticleField({ isVisible }: { isVisible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const centerRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  useEffect(() => {
    if (!isVisible) return undefined;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastTime = 0;
    const particles: Particle[] = [];

    const smoothstep = (edge0: number, edge1: number, value: number) => {
      const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
      return x * x * (3 - 2 * x);
    };

    const resize = () => {
      const isCompact = window.innerWidth < 768;
      const ratio = Math.min(window.devicePixelRatio || 1, isCompact ? 1.25 : 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      if (!pointerRef.current.x && !pointerRef.current.y) {
        pointerRef.current = { x: width / 2, y: height / 2 };
        centerRef.current = { x: width / 2, y: height / 2, vx: 0, vy: 0 };
      }
    };

    const createParticles = () => {
      particles.length = 0;
      const isCompact = width < 768;
      const spacing = Math.max(isCompact ? 34 : 26, Math.min(isCompact ? 48 : 40, width / (isCompact ? 30 : 44)));
      const cols = Math.ceil(width / spacing) + 8;
      const rows = Math.ceil(height / spacing) + 8;

      for (let row = -4; row < rows - 4; row += 1) {
        for (let col = -4; col < cols - 4; col += 1) {
          const seed = Math.random();
          const seed2 = Math.random();
          const x = col * spacing + (seed - 0.5) * spacing * 0.72;
          const y = row * spacing + (seed2 - 0.5) * spacing * 0.72;

          particles.push({
            x,
            y,
            originX: x,
            originY: y,
            seed,
            seed2,
            size: 2.2 + Math.random() * 6.8,
            color: particleColors[(row * 3 + col * 5 + particleColors.length * 10) % particleColors.length],
            opacity: 0.16 + Math.random() * 0.38,
            scale: 1,
          });
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const onResize = () => {
      resize();
      createParticles();
    };

    const drawParticle = (particle: Particle, time: number, delta: number) => {
      const timeScale = time * 0.001;
      const ambientX = Math.sin(timeScale * 0.34 + particle.seed * 18.2) * 8;
      const ambientY = Math.cos(timeScale * 0.28 + particle.seed2 * 21.4) * 8;
      const refX = particle.originX + ambientX;
      const refY = particle.originY + ambientY;
      const dx = refX - centerRef.current.x;
      const dy = refY - centerRef.current.y;
      const dist = Math.max(0.001, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const ringRadius = Math.min(width, height) * 0.38 + Math.sin(timeScale * 1.1) * 22;
      const ringWidth = Math.max(78, Math.min(width, height) * 0.095);
      const ringInner = smoothstep(ringRadius - ringWidth * 1.75, ringRadius, dist);
      const ringOuter = smoothstep(ringRadius, ringRadius + ringWidth, dist);
      const ring = Math.max(0, ringInner - ringOuter);
      const field = smoothstep(ringRadius + ringWidth * 4.2, ringRadius - ringWidth * 3.1, dist);
      const noise = Math.sin(timeScale * 1.8 + particle.seed * 23 + Math.cos(angle * 3 + particle.seed2 * 8)) * 0.5 + 0.5;
      const radialDisplacement = ring * (34 + noise * 28);
      const tangentialDisplacement = ring * Math.sin(timeScale * 2.1 + particle.seed2 * 30) * 20;
      const velocity = Math.hypot(centerRef.current.vx, centerRef.current.vy);
      const tail = Math.min(1, velocity / 42) * field * 0.72;
      const targetX = refX + Math.cos(angle) * radialDisplacement + Math.cos(angle + Math.PI / 2) * tangentialDisplacement - centerRef.current.vx * tail;
      const targetY = refY + Math.sin(angle) * radialDisplacement + Math.sin(angle + Math.PI / 2) * tangentialDisplacement - centerRef.current.vy * tail;

      particle.x += (targetX - particle.x) * Math.min(1, delta * (0.006 + ring * 0.013));
      particle.y += (targetY - particle.y) * Math.min(1, delta * (0.006 + ring * 0.013));

      const visible = Math.max(0.06, ring * 0.9 + field * 0.16);
      const distanceScale = Math.min(1.55, Math.max(0.34, dist / (ringRadius + ringWidth * 2.8)));
      const wobbleEnergy = Math.min(1.25, velocity / 28) * field;
      const wateryTargetScale = distanceScale * (0.72 + ring * 0.34) + Math.sin(timeScale * 5.4 + particle.seed * 30) * wobbleEnergy * 0.24;
      particle.scale += (wateryTargetScale - particle.scale) * Math.min(1, delta * 0.012);
      const size = particle.size * particle.scale * (0.9 + noise * 0.18);
      const tangent = angle + (noise - 0.5) * 0.32;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(tangent);
      context.strokeStyle = particle.color;
      context.lineWidth = 1.05 + particle.scale * 1.15 + ring * 0.45;
      context.lineCap = 'round';
      context.globalAlpha = (isVisible ? 1 : 0) * particle.opacity * visible;
      context.beginPath();
      context.moveTo(-size / 2, 0);
      context.lineTo(size / 2, 0);
      context.stroke();
      context.restore();
    };

    const animate = (time: number) => {
      const delta = lastTime ? Math.min(34, time - lastTime) : 16;
      lastTime = time;
      context.clearRect(0, 0, width, height);

      const spring = 0.018;
      const damping = 0.875;
      centerRef.current.vx += (pointerRef.current.x - centerRef.current.x) * spring;
      centerRef.current.vy += (pointerRef.current.y - centerRef.current.y) * spring;
      centerRef.current.vx *= damping;
      centerRef.current.vy *= damping;
      centerRef.current.x += centerRef.current.vx;
      centerRef.current.y += centerRef.current.vy;

      particles.forEach((particle) => {
        drawParticle(particle, time, delta);
      });

      animationFrame = window.requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [isVisible]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed inset-0 z-10"
    />
  );
}

export function SevenEntryTransition({ onLogout, initialChoices = false, notice }: SevenEntryTransitionProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [typedText, setTypedText] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showChoices, setShowChoices] = useState(initialChoices);
  const [choiceText, setChoiceText] = useState(initialChoices ? `${choiceTitle}\n${choiceSubtitle}` : '');

  useEffect(() => {
    if (initialChoices) {
      setHasStarted(true);
      setIsTypingDone(true);
      return undefined;
    }

    const startTimer = window.setTimeout(() => setHasStarted(true), 700);
    return () => window.clearTimeout(startTimer);
  }, [initialChoices]);

  useEffect(() => {
    if (!hasStarted) return undefined;

    if (typedText.length >= message.length) {
      const doneTimer = window.setTimeout(() => setIsTypingDone(true), 360);
      return () => window.clearTimeout(doneTimer);
    }

    const nextTimer = window.setTimeout(() => {
      setTypedText(message.slice(0, typedText.length + 1));
    }, typedText.length === 0 ? 130 : 31);

    return () => window.clearTimeout(nextTimer);
  }, [hasStarted, typedText]);

  useEffect(() => {
    if (!showChoices) return undefined;

    const fullChoiceText = `${choiceTitle}\n${choiceSubtitle}`;

    if (choiceText.length >= fullChoiceText.length) return undefined;

    const nextTimer = window.setTimeout(() => {
      setChoiceText(fullChoiceText.slice(0, choiceText.length + 1));
    }, choiceText.length === 0 ? 80 : 26);

    return () => window.clearTimeout(nextTimer);
  }, [choiceText, showChoices]);

  const lines = typedText.split('\n');
  const choiceLines = choiceText.split('\n');
  const fullChoiceText = `${choiceTitle}\n${choiceSubtitle}`;
  const companyOptions = [
    {
      company: 'Seven',
      title: 'Seven Group 360',
      subtitle: 'Conheça a arquitetura central do grupo, sua mentalidade e seus pilares estratégicos.',
      action: () => navigate('/sevengroup'),
      status: 'Acessar página institucional',
    },
    {
      company: 'ARQO',
      title: 'ARQO Inteligência Imobiliária',
      subtitle: 'Conheça a consultoria premium de clareza, curadoria e decisão estratégica.',
      action: () => navigate('/arqo'),
      status: 'Acessar página institucional',
    },
  ].filter((option) => profile?.role !== 'colaborador' || option.company === profile.company);

  return (
    <main className="seven-entry-cursor fixed inset-0 z-[100] overflow-x-hidden overflow-y-auto bg-[#F7F7F8] text-[#111114]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,138,31,0.16),transparent_24%),radial-gradient(circle_at_78%_12%,rgba(17,17,17,0.055),transparent_20%),linear-gradient(180deg,#ffffff_0%,#f4f4f5_100%)]" />
      <ParticleField isVisible={isTypingDone} />

      <div className="absolute right-5 top-5 z-30 flex items-center gap-2 sm:right-8 sm:top-8">
        {profile?.role === 'admin' && (
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin')}
            className="seven-entry-clickable inline-flex h-10 items-center gap-2 rounded-full border border-white/70 bg-white/52 px-4 text-sm font-semibold text-[#1D1D1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_34px_rgba(30,30,40,0.12)] backdrop-blur-2xl transition hover:bg-white/78"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
        )}
        {profile?.role === 'colaborador' && (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="seven-entry-clickable inline-flex h-10 items-center gap-2 rounded-full border border-white/70 bg-white/52 px-4 text-sm font-semibold text-[#1D1D1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_34px_rgba(30,30,40,0.12)] backdrop-blur-2xl transition hover:bg-white/78"
          >
            <BookOpen className="h-4 w-4" />
            Aulas
          </button>
        )}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sair"
          className="seven-entry-clickable flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/52 text-[#1D1D1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_34px_rgba(30,30,40,0.12)] backdrop-blur-2xl transition hover:bg-white/78"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {notice && (
        <div className="absolute left-5 top-5 z-30 max-w-sm rounded-md border border-amber-300/40 bg-white/70 px-4 py-3 text-sm font-medium text-[#3A2A12] shadow-[0_12px_34px_rgba(30,30,40,0.12)] backdrop-blur-2xl sm:left-8 sm:top-8">
          {notice}
        </div>
      )}

      <section className="relative z-20 flex min-h-[100svh] items-center justify-center px-5 pb-10 pt-24 sm:pt-10">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto rounded-[34px] border border-white/55 bg-white/[0.24] px-6 py-8 shadow-[0_26px_90px_rgba(30,30,40,0.13)] backdrop-blur-[28px] backdrop-saturate-150 sm:px-10 sm:py-12 lg:px-14"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#6B6B72] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_38px_rgba(30,30,40,0.08)] backdrop-blur-2xl">
              <img
                src="/assets/seven/Logo%20Seven%20Group.webp"
                alt=""
                className="h-4 w-4 object-contain"
                aria-hidden="true"
                loading="eager"
                decoding="async"
              />
              Ecossistema Seven
            </div>

            {!showChoices ? (
              <h1 className="min-h-[11.2rem] text-balance text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-[#111114] sm:text-4xl lg:text-5xl">
                {[0, 1, 2, 3].map((index) => (
                  <span key={index} className={index === 0 ? 'block' : 'mt-1.5 block'}>
                    {lines[index] || ''}
                    {index === lines.length - 1 && (
                      <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] animate-pulse rounded-full bg-[#111114]" />
                    )}
                  </span>
                ))}
              </h1>
            ) : (
              <div className="min-h-[7.4rem]">
                <h2 className="text-balance text-4xl font-semibold leading-[1] tracking-[-0.055em] text-[#111114] sm:text-5xl">
                  {choiceLines[0] || ''}
                  {choiceText.length < fullChoiceText.length && choiceLines.length === 1 && (
                    <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] animate-pulse rounded-full bg-[#111114]" />
                  )}
                </h2>
                <p className="mt-4 text-base font-medium leading-7 text-[#666670] sm:text-lg">
                  {choiceLines[1] || ''}
                  {choiceLines.length > 1 && choiceText.length < fullChoiceText.length && (
                    <span className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] animate-pulse rounded-full bg-[#666670]" />
                  )}
                </p>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{
                opacity: isTypingDone ? 1 : 0,
                y: isTypingDone ? 0 : 22,
              }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className={showChoices ? 'mt-4' : 'mt-9'}
            >
              {!showChoices ? (
                <button
                  type="button"
                  onClick={() => setShowChoices(true)}
                  className="seven-entry-clickable group inline-flex min-h-[52px] max-w-full items-center justify-center whitespace-nowrap rounded-full border border-white/70 bg-[#111114]/90 px-4 text-center text-[0.78rem] font-semibold leading-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_48px_rgba(17,17,20,0.22)] backdrop-blur-2xl transition hover:bg-black min-[390px]:text-[0.84rem] sm:min-h-[56px] sm:px-8 sm:text-base"
                >
                  Iniciar a Experiência Ecossistema Seven
                  <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-1 sm:ml-3 sm:h-4 sm:w-4" />
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  {companyOptions.map((option) => (
                    <button
                      type="button"
                      key={option.title}
                      onClick={option.action}
                      disabled={!option.action}
                      className="seven-entry-clickable group rounded-[28px] border border-white/70 bg-white/42 p-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_20px_60px_rgba(30,30,40,0.12)] backdrop-blur-3xl transition hover:-translate-y-1 hover:bg-white/58 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:bg-white/42"
                    >
                      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/55 text-[#ff6a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#111114]">{option.title}</h2>
                      <p className="mt-3 max-w-sm text-sm leading-6 text-[#666670]">{option.subtitle}</p>
                      <span className="mt-7 inline-flex items-center text-sm font-semibold text-[#8A8A92] transition group-enabled:text-[#E76912]">
                        {option.status}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
