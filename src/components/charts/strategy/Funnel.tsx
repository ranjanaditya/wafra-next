import { useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { cn } from '../../../lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface FunnelStage {
  id: string;
  label: ReactNode;
  /** Formatted figure (usually a <Fig>). */
  value: ReactNode;
  /** Visual width of the bar, % of the track (decorative; there is no axis). */
  width: number;
  tone: 'neutral' | 'gold' | 'brand';
  /** Operation chip shown between the previous stage and this one. */
  op?: ReactNode;
  badge?: ReactNode;
  detail: ReactNode;
}

const TONE: Record<FunnelStage['tone'], { bar: string; active: string }> = {
  neutral: {
    bar: 'linear-gradient(90deg, rgb(var(--line) / 0.07), rgb(var(--line) / 0.16), rgb(var(--line) / 0.07))',
    active: 'linear-gradient(90deg, rgb(var(--line) / 0.12), rgb(var(--line) / 0.26), rgb(var(--line) / 0.12))',
  },
  gold: {
    bar: 'linear-gradient(90deg, rgb(var(--gold) / 0.12), rgb(var(--gold) / 0.3), rgb(var(--gold) / 0.12))',
    active: 'linear-gradient(90deg, rgb(var(--gold) / 0.22), rgb(var(--gold) / 0.48), rgb(var(--gold) / 0.22))',
  },
  brand: {
    bar: 'linear-gradient(90deg, rgb(var(--brand-deep)), rgb(var(--brand)) 45%, rgb(var(--gold)))',
    active: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand-hover)) 45%, rgb(var(--gold)))',
  },
};

/**
 * Animated, hoverable market funnel. Bars draw in when scrolled into view and
 * re-size smoothly when the inputs change; hovering, focusing or tapping a
 * stage shows how it is built in the panel underneath.
 */
export function Funnel({
  stages,
  active,
  onActive,
  hint,
}: {
  stages: FunnelStage[];
  active: string;
  onActive: (id: string) => void;
  hint: ReactNode;
}) {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const current = stages.find((s) => s.id === active) ?? stages[stages.length - 1];

  return (
    <div>
      <ol ref={ref} className="space-y-0.5">
        {stages.map((s, i) => {
          const on = s.id === current.id;
          return (
            <li key={s.id} onMouseEnter={() => onActive(s.id)} onFocus={() => onActive(s.id)}>
              {s.op && (
                <div className="flex justify-center py-1" aria-hidden>
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={inView ? { opacity: 1, y: 0 } : undefined}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: EASE }}
                    className="chip whitespace-nowrap text-[0.6875rem] text-muted"
                  >
                    {s.op}
                  </motion.span>
                </div>
              )}
              <div
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-1 transition-colors',
                  on ? 'bg-line/[0.05]' : 'hover:bg-line/[0.03]',
                )}
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onActive(s.id)}
                    aria-pressed={on}
                    data-cursor="explain"
                    className="text-start text-[0.8125rem] font-medium leading-tight text-ink/90"
                  >
                    {s.label}
                  </button>
                  {s.badge && <div className="mt-1">{s.badge}</div>}
                </div>
                <div className="relative flex h-11 items-center justify-center" aria-hidden>
                  <motion.span
                    className="block h-full rounded-[10px]"
                    style={{
                      background: on ? TONE[s.tone].active : TONE[s.tone].bar,
                      clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
                      boxShadow: s.tone === 'brand' ? '0 10px 30px -12px rgb(var(--brand) / 0.8)' : undefined,
                    }}
                    initial={{ width: '0%', opacity: 0 }}
                    animate={inView ? { width: `${s.width}%`, opacity: 1 } : undefined}
                    transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
                  />
                </div>
                <div className="min-w-0 text-end font-display text-[1rem] font-semibold leading-tight">{s.value}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="inner mt-4 min-h-[5.25rem] p-3.5" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div className="mb-1 text-[0.75rem] font-semibold text-gold">{current.label}</div>
            <p className="text-[0.8125rem] leading-relaxed text-ink/85">{current.detail}</p>
          </motion.div>
        </AnimatePresence>
        <p className="mt-2 text-[0.6875rem] text-muted">{hint}</p>
      </div>
    </div>
  );
}
