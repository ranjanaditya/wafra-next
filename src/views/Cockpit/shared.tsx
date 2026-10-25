import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SENSITIVITIES, type BreakEven, type Unit } from '../../data/deck';
import type { Fmt } from '../../components/ui/useFmt';
import type { Dict } from '../../i18n';
import { cn } from '../../lib/cn';

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Staggered reveal on scroll (40 to 60 ms steps). */
export function Reveal({ children, i = 0, className }: { children: ReactNode; i?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Risk-register test conditions (DECK DATA, risk register and stress presets).
 * Cost of risk and CAC reuse the sensitivity table's adverse values; the
 * cannibalisation share and ARPU-led figure are quoted from the deck.
 */
const lever = (id: string) => SENSITIVITIES.find((s) => s.id === id)!;
export const CONDITIONS = {
  cor35: lever('costOfRisk').adverse.value, // 3.5%
  cac350: lever('cac').adverse.value, // SAR 350
  cannib20: 20, // % of revenue lost (stress, no benchmark)
  arpu367: 367, // SAR, ARPU-led blended revenue per customer
} as const;

export function fmtUnit(unit: Unit, dp: number, v: number, f: Fmt) {
  switch (unit) {
    case 'sar':
      return f.sar(v, dp);
    case 'pct':
      return f.pct(v, dp);
    case 'm':
      return f.mill(v, dp);
    case 'sarm':
      return f.sarM(v, dp);
  }
}

export function fmtBE(be: BreakEven, t: Dict, f: Fmt) {
  return be === 'after FY31' ? t.cockpit.be.afterFY31 : f.fy(be);
}

export function fmtElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

/** Small "label above value" metric used across cockpit cards. */
export function Metric({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="truncate text-[0.6875rem] font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 font-display text-lg font-semibold leading-tight">{children}</div>
    </div>
  );
}

/** Inline legend dot. */
export function LegendDot({ color, label, dashed }: { color: string; label: ReactNode; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      {dashed ? (
        <span className="inline-block h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}
