import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { Check, Headset, LockOpen, TrendingUp } from 'lucide-react';
import { useApp, useJourney } from '../../store';
import { useT, useTpl } from '../../i18n';
import { TIMELINE } from '../../config/illustrative';
import { goToMonth } from '../../logic/journey';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { cn } from '../../lib/cn';

const MAX = TIMELINE.maxMonth;

/**
 * Journey timeline: the deck's five chevrons over a draggable month scrubber
 * (0 to 18), with the gold "Human help throughout" rail under all five.
 * The time axis stays left-to-right in Arabic.
 */
export function JourneyTimeline() {
  const t = useT();
  const tpl = useTpl();
  const pid = useApp((s) => s.personaId);
  const j = useJourney();
  const month = j?.month ?? 0;
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const disabled = !pid;

  const monthAt = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.round(Math.min(1, Math.max(0, (x - r.left) / r.width)) * MAX);
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag(true);
    goToMonth(monthAt(e.clientX));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => drag && goToMonth(monthAt(e.clientX));
  const up = () => setDrag(false);
  const key = (e: KeyboardEvent) => {
    if (disabled) return;
    const map: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 3, PageDown: -3 };
    if (e.key in map) {
      e.preventDefault();
      goToMonth(month + map[e.key]);
    } else if (e.key === 'Home') goToMonth(0, { immediate: true });
    else if (e.key === 'End') goToMonth(MAX, { immediate: true });
  };

  const pct = (m: number) => `${(m / MAX) * 100}%`;
  const activeIdx = TIMELINE.chevrons.findIndex((c) => month >= c.from && month <= c.to);

  return (
    <SpotlightCard border="gold" className="p-4">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow">{t.app.timeline.title}</div>
          <div className="mt-0.5 text-[12px] text-muted">{disabled ? t.app.timeline.needPersona : t.app.timeline.drag}</div>
        </div>
        <motion.div key={month} initial={{ y: 6, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className="num font-display text-[26px] font-semibold leading-none">
          {tpl(t.app.timeline.month, { m: month })}
        </motion.div>
      </div>

      <div dir="ltr">
        {/* Chevrons */}
        <div className="flex gap-1">
          {TIMELINE.chevrons.map((c, i) => {
            const done = month > c.to;
            const active = i === activeIdx;
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => goToMonth(c.jump, { immediate: true })}
                data-cursor="open"
                className={cn(
                  'group relative flex min-h-[76px] flex-1 flex-col items-start justify-center gap-1 py-1.5 text-start transition-colors disabled:cursor-not-allowed',
                  i === 0 ? 'ps-3' : 'ps-6',
                  'pe-5',
                  active ? 'text-white' : done ? 'text-ink' : 'text-muted hover:text-ink',
                )}
                style={{
                  clipPath:
                    i === 0
                      ? 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)'
                      : 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)',
                }}
              >
                <span
                  className={cn(
                    'absolute inset-0 -z-0 transition-colors',
                    active ? 'bg-gradient-to-r from-brand-deep via-brand to-brand-hover' : done ? 'bg-line/[0.10]' : 'bg-line/[0.05] group-hover:bg-line/[0.08]',
                  )}
                />
                <span
                  className={cn(
                    'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold',
                    active ? 'bg-white text-brand' : done ? 'bg-gold text-[#1a1408]' : 'border border-line/25',
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="relative line-clamp-3 text-[11.5px] font-semibold leading-[1.2]" dir="auto">
                  {t.app.timeline.chevrons[c.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Month scrubber */}
        <div className="relative mt-3 px-2">
          <div
            ref={track}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            data-cursor={disabled ? undefined : 'drag'}
            className={cn('relative h-8 touch-none select-none', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing')}
          >
            <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-line/10" />
            <div className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-gold/25" style={{ left: pct(1), width: `calc(${pct(5)} - ${pct(1)})` }} />
            <motion.div
              className="absolute left-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-gradient-to-r from-brand to-gold"
              initial={false}
              animate={{ width: pct(month) }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            />
            {Array.from({ length: MAX + 1 }).map((_, m) => (
              <span
                key={m}
                className={cn('absolute top-1/2 h-2.5 w-px -translate-y-1/2', m === 6 || m === 12 ? 'h-4 bg-gold' : 'bg-line/25')}
                style={{ left: pct(m) }}
              />
            ))}
            <motion.div
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={t.app.timeline.sliderLabel}
              aria-valuemin={0}
              aria-valuemax={MAX}
              aria-valuenow={month}
              aria-valuetext={tpl(t.app.timeline.month, { m: month })}
              aria-disabled={disabled}
              onKeyDown={key}
              className="absolute top-1/2 -ml-[11px] -mt-[11px] h-[22px] w-[22px] rounded-full border-[3px] border-brand bg-white shadow-[0_0_0_6px_rgb(var(--brand)/0.2),0_4px_12px_rgb(0_0_0/0.5)] outline-none focus-visible:shadow-[0_0_0_6px_rgb(var(--gold)/0.6)]"
              initial={false}
              animate={{ left: pct(month), scale: drag ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          </div>
          <div className="num relative mt-1 h-4 text-[10.5px] text-muted">
            {[0, 1, 6, 12, 18].map((m) => (
              <span key={m} className="absolute -translate-x-1/2" style={{ left: pct(m) }}>
                {m}
              </span>
            ))}
          </div>
          <div className="relative h-5 text-[10.5px] font-semibold">
            <span className="absolute flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-ai-glow" style={{ left: pct(6) }} dir="auto">
              <LockOpen className="h-3 w-3" />
              {t.app.timeline.unlock6}
            </span>
            <span className="absolute flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-pass" style={{ left: pct(12) }} dir="auto">
              <TrendingUp className="h-3 w-3" />
              {t.app.timeline.unlock12}
            </span>
          </div>
        </div>

        {/* Human help rail */}
        <div className="relative mt-2 flex items-center gap-2 overflow-hidden rounded-full border border-gold/35 bg-gold/[0.08] px-3 py-1.5">
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-gold/25 to-transparent"
            animate={{ x: ['-10%', '1100%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />
          <Headset className="relative h-3.5 w-3.5 shrink-0 text-gold" />
          <span className="relative truncate text-[11.5px] font-semibold text-gold" dir="auto">
            {t.app.timeline.rail}
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
}
