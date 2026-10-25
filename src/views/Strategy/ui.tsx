import { Fragment, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '../../lib/cn';

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Render a dictionary template such as "A {tam} pool" with React nodes (e.g. <Fig>) for placeholders. */
export function Rich({ text, values }: { text: string; values?: Record<string, ReactNode> }) {
  const parts = text.split(/(\{\w+\})/g);
  return (
    <>
      {parts.map((p, i) => {
        const key = /^\{(\w+)\}$/.exec(p)?.[1];
        return <Fragment key={i}>{key && values && key in values ? values[key] : p}</Fragment>;
      })}
    </>
  );
}

const parent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } } };
export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Staggered reveal (50ms) when the group scrolls into view. */
export function Stagger({ children, className, amount = 0.12 }: { children: ReactNode; className?: string; amount?: number }) {
  return (
    <motion.div variants={parent} initial="hidden" whileInView="show" viewport={{ once: true, amount }} className={className}>
      {children}
    </motion.div>
  );
}

export function Item({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rise} className={className}>
      {children}
    </motion.div>
  );
}

/** Major section header (eyebrow + deck-style action title). */
export function SecHead({ eyebrow, title, subtitle, right }: { eyebrow: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-4xl">
        <div className="eyebrow mb-2 text-gold">{eyebrow}</div>
        <h2 className="font-display text-[1.5rem] font-semibold leading-[1.25] tracking-tight sm:text-[1.625rem]">{title}</h2>
        {subtitle && <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/** Card-level title row. */
export function CardHead({ title, hint, right, className }: { title: ReactNode; hint?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-[1rem] font-semibold leading-snug">{title}</h3>
        {hint && <p className="mt-0.5 text-[0.75rem] leading-snug text-muted">{hint}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

/** Initials badge for organisations (never a logo). */
export function Initials({ text, tone = 'neutral', size = 36 }: { text: string; tone?: 'neutral' | 'brand' | 'gold'; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border font-display font-semibold',
        tone === 'brand' && 'border-brand/50 bg-brand/15 text-brand',
        tone === 'gold' && 'border-gold/50 bg-gold/15 text-gold',
        tone === 'neutral' && 'border-line/20 bg-line/[0.06] text-ink',
      )}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {text}
    </span>
  );
}

/** Polygon for a chevron step; the first step has a flat start edge. Mirrored in RTL. */
export function chevronClip(first: boolean, rtl: boolean, tip = 14) {
  const ltr = first
    ? `polygon(0 0, calc(100% - ${tip}px) 0, 100% 50%, calc(100% - ${tip}px) 100%, 0 100%)`
    : `polygon(0 0, calc(100% - ${tip}px) 0, 100% 50%, calc(100% - ${tip}px) 100%, 0 100%, ${tip}px 50%)`;
  if (!rtl) return ltr;
  return first
    ? `polygon(100% 0, ${tip}px 0, 0 50%, ${tip}px 100%, 100% 100%)`
    : `polygon(100% 0, ${tip}px 0, 0 50%, ${tip}px 100%, 100% 100%, calc(100% - ${tip}px) 50%)`;
}
