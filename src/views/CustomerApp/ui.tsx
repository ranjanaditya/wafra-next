import { useMemo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import * as L from 'lucide-react';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n';
import { BRAND, type Persona } from '../../config/illustrative';
import { Tilt } from '../../components/fx/Tilt';

// ───────────── Icons for the engine-room log ─────────────
const ICONS: Record<string, L.LucideIcon> = {
  UserRound: L.UserRound,
  IdCard: L.IdCard,
  Fingerprint: L.Fingerprint,
  ShieldCheck: L.ShieldCheck,
  ListChecks: L.ListChecks,
  ScanFace: L.ScanFace,
  Radar: L.Radar,
  FileCheck2: L.FileCheck2,
  Landmark: L.Landmark,
  BadgeCheck: L.BadgeCheck,
  CreditCard: L.CreditCard,
  Building2: L.Building2,
  Send: L.Send,
  Banknote: L.Banknote,
  Sparkles: L.Sparkles,
  SlidersHorizontal: L.SlidersHorizontal,
  Target: L.Target,
  FastForward: L.FastForward,
  Rewind: L.Rewind,
  Gauge: L.Gauge,
  Hourglass: L.Hourglass,
  CalendarCheck: L.CalendarCheck,
  Calculator: L.Calculator,
  UserCheck: L.UserCheck,
  CheckCheck: L.CheckCheck,
  ShieldAlert: L.ShieldAlert,
  TrendingUp: L.TrendingUp,
  CircleCheck: L.CircleCheck,
  Clock: L.Clock,
  Lock: L.Lock,
  LockOpen: L.LockOpen,
  MapPin: L.MapPin,
  Headset: L.Headset,
  Siren: L.Siren,
  CircleSlash: L.CircleSlash,
  Scale: L.Scale,
  PhoneCall: L.PhoneCall,
};
export const logIcon = (name: string) => ICONS[name] ?? L.Dot;

// ───────────── Phone-scoped primitives (px-based so the device mock keeps its proportions) ─────────────
type PV = 'primary' | 'secondary' | 'outline' | 'gold' | 'ai' | 'ghost';
const PVAR: Record<PV, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-[0_8px_20px_-10px_rgb(var(--brand)/0.9)]',
  secondary: 'bg-line/10 text-ink hover:bg-line/15',
  outline: 'border border-line/25 text-ink hover:bg-line/5',
  gold: 'bg-gold text-[#1a1408] hover:brightness-110 shadow-[0_8px_20px_-10px_rgb(var(--gold)/0.9)]',
  ai: 'bg-ai text-white hover:brightness-110',
  ghost: 'text-ink/80 hover:bg-line/10',
};
export function PButton({
  variant = 'primary',
  full,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: PV; full?: boolean; icon?: ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      className={cn(
        'inline-flex h-[42px] items-center justify-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-[background-color,filter] disabled:opacity-40',
        PVAR[variant],
        full && 'w-full',
        className,
      )}
      {...(rest as object)}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export function PCard({ children, className, tone }: { children: ReactNode; className?: string; tone?: 'ai' | 'gold' | 'brand' | 'pass' | 'watch' }) {
  const t =
    tone === 'ai'
      ? 'border-ai/35 bg-ai/[0.07]'
      : tone === 'gold'
        ? 'border-gold/35 bg-gold/[0.07]'
        : tone === 'brand'
          ? 'border-brand/35 bg-brand/[0.07]'
          : tone === 'pass'
            ? 'border-pass/35 bg-pass/[0.07]'
            : tone === 'watch'
              ? 'border-watch/40 bg-watch/[0.08]'
              : 'border-line/10 bg-line/[0.04]';
  return <div className={cn('relative rounded-[18px] border p-[14px]', t, className)}>{children}</div>;
}

export function AiBadge({ label, className }: { label?: string; className?: string }) {
  const t = useT();
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-ai/40 bg-ai/15 px-1.5 py-[1px] text-[10px] font-semibold text-ai-glow', className)}>
      <L.Sparkles className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
      {label ?? t.app.assistant.aiBadge}
    </span>
  );
}

export function SimTag({ className }: { className?: string }) {
  const t = useT();
  return (
    <span className={cn('inline-flex items-center rounded-full border border-dashed border-line/40 px-1.5 py-[1px] text-[10px] font-semibold text-ink/80', className)}>
      {t.app.onboarding.simulated}
    </span>
  );
}

export function Ring({
  value,
  size = 120,
  stroke = 10,
  color = 'rgb(var(--gold))',
  track = 'rgb(var(--line) / 0.1)',
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function MilestoneDots({ filled, total = 6, color = 'bg-pass' }: { filled: number; total?: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${filled} / ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ scale: i < filled ? 1 : 0.85, opacity: i < filled ? 1 : 0.35 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 18 }}
          className={cn('inline-flex h-[18px] w-[18px] items-center justify-center rounded-full', i < filled ? color : 'bg-line/20')}
        >
          {i < filled && <L.Check className="h-3 w-3 text-[#04110f]" strokeWidth={3} />}
        </motion.span>
      ))}
    </div>
  );
}

export function CheckMorph({ size = 56, color = 'rgb(var(--pass))' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden>
      <motion.circle cx="28" cy="28" r="25" fill="none" stroke={color} strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path
        d="M17 29l7 7 15-16"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Restrained confetti in brand colours (one burst). */
export function Confetti({ count = 34 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        i,
        x: (Math.random() - 0.5) * 300,
        r: Math.random() * 540 - 270,
        d: 1.4 + Math.random() * 0.9,
        delay: Math.random() * 0.25,
        c: ['rgb(var(--brand))', 'rgb(var(--gold))', '#ffffff', 'rgb(var(--brand-hover))'][i % 4],
        w: 5 + Math.random() * 4,
      })),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.i}
          className="absolute left-1/2 top-[18%] rounded-[1px]"
          style={{ width: p.w, height: p.w * 0.45, background: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: 460 + Math.random() * 120, opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: p.d, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

/** Virtual debit card (brand gradient, Sadu stripe, masked number). Tilts toward the cursor. */
export function DebitCard({ persona, frozen, className }: { persona: Persona; frozen?: boolean; className?: string }) {
  const t = useT();
  return (
    <Tilt max={8} className={className} glareClassName="rounded-[18px]">
      <div
        className="relative aspect-[1.586] w-full overflow-hidden rounded-[18px] p-4 text-white shadow-[0_24px_50px_-20px_rgb(var(--brand)/0.7)]"
        style={{ background: 'radial-gradient(120% 140% at 0% 0%, #ff3b52 0%, #b3112a 38%, #5c0010 75%, #2a0008 100%)' }}
      >
        <div className="sadu absolute inset-x-0 top-[46%] h-4 opacity-[0.22]" />
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between" dir="ltr">
            <span className="font-display text-[15px] font-semibold tracking-tight">{BRAND.en}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">{t.app.onboarding.cardVirtual}</span>
          </div>
          <div className="flex items-end justify-between" dir="ltr">
            <div>
              <div className="num text-[15px] tracking-[0.18em]">•••• •••• •••• {persona.cardLast4}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/80">{t.common.personas[persona.id].name}</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase text-white/90">
              <L.Wifi className="h-4 w-4 rotate-90" strokeWidth={1.75} />
              {t.app.onboarding.cardDebit}
            </div>
          </div>
        </div>
        {frozen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0b1220]/60 backdrop-blur-[3px]"
          >
            <motion.div initial={{ scale: 0.6, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
              <L.Lock className="h-9 w-9 text-white" strokeWidth={1.75} />
            </motion.div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">{t.app.card.frozen}</span>
          </motion.div>
        )}
      </div>
    </Tilt>
  );
}

export function StepHeader({ step, total = 4, title, sub }: { step?: number; total?: number; title: ReactNode; sub?: ReactNode }) {
  const t = useT();
  return (
    <div className="mb-4">
      {step !== undefined && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line/15">
                <motion.span
                  className="block h-full rounded-full bg-brand"
                  initial={false}
                  animate={{ width: i < step ? '100%' : i === step ? '45%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </span>
            ))}
          </div>
          <span className="num text-[11px] text-muted">{t.app.onboarding.stepOf.replace('{n}', String(Math.min(step + 1, total)))}</span>
        </div>
      )}
      <h3 className="font-display text-[21px] font-semibold leading-[1.2] tracking-tight">{title}</h3>
      {sub && <p className="mt-1.5 text-[13px] leading-[1.5] text-muted">{sub}</p>}
    </div>
  );
}

export const screenMotion = (dir: 1 | -1) => ({
  initial: { opacity: 0, x: 28 * dir, scale: 0.985 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -28 * dir, scale: 0.985 },
  transition: { type: 'spring' as const, stiffness: 260, damping: 30 },
});
