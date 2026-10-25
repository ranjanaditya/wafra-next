import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../../../lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface PoolRow {
  id: string;
  rank: number;
  label: string;
  role: string;
  score: number;
  lead?: boolean;
  /** Formatted score (usually a <Fig>). */
  value: ReactNode;
}

/**
 * Animated horizontal bars for the ten opportunity pools on the 1 to 5 scale.
 * Bars grow from the reading-start edge, so the chart mirrors in Arabic.
 */
export function PoolsBars({ rows, leadLabel, scaleLabel }: { rows: PoolRow[]; leadLabel: string; scaleLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const grid = 'grid grid-cols-[1.25rem_minmax(0,1fr)_2.75rem] items-center gap-x-3 sm:grid-cols-[1.5rem_minmax(0,15rem)_minmax(0,1fr)_3rem]';

  return (
    <div ref={ref}>
      <div className={cn(grid, 'mb-1 hidden px-2 sm:grid')} aria-hidden>
        <span />
        <span />
        <div className="flex justify-between text-[0.625rem] text-muted">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="num">
              {n}
            </span>
          ))}
        </div>
        <span className="text-end text-[0.625rem] text-muted">{scaleLabel}</span>
      </div>
      <ol className="space-y-1">
        {rows.map((r, i) => (
          <li key={r.id} className={cn(grid, 'gap-y-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-line/[0.04]')}>
            <span className="num text-[0.75rem] text-muted">{r.rank}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn('text-[0.8125rem] font-medium leading-tight', r.lead && 'text-ink')}>{r.label}</span>
                {r.lead && (
                  <span className="rounded-full border border-brand/40 bg-brand/15 px-1.5 py-px text-[0.625rem] font-semibold uppercase tracking-wide text-brand">
                    {leadLabel}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[0.6875rem] leading-snug text-muted">{r.role}</div>
            </div>
            <div className="relative order-last col-span-3 h-2.5 rounded-full bg-line/[0.07] sm:order-none sm:col-span-1">
              {[25, 50, 75].map((p) => (
                <span key={p} aria-hidden className="absolute inset-y-0 w-px bg-line/10" style={{ insetInlineStart: `${p}%` }} />
              ))}
              <motion.div
                className={cn(
                  'absolute inset-y-0 start-0 rounded-full',
                  r.lead
                    ? 'bg-gradient-to-r from-brand-deep via-brand to-brand-hover shadow-[0_0_18px_-2px_rgb(var(--brand)/0.7)] rtl:bg-gradient-to-l'
                    : 'bg-gradient-to-r from-gold/35 to-gold/75 rtl:bg-gradient-to-l',
                )}
                initial={{ width: '0%' }}
                animate={inView ? { width: `${((r.score - 1) / 4) * 100}%` } : undefined}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.05, ease: EASE }}
              />
            </div>
            <span className="text-end text-[0.875rem] font-semibold">{r.value}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
