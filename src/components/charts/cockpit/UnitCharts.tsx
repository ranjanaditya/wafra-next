import { motion, useInView, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { UNIT_ECONOMICS as UE } from '../../../data/deck';
import { useFmt } from '../../ui/useFmt';
import { useT, useTpl } from '../../../i18n';
import { Fig } from '../../ui/Provenance';
import { cn } from '../../../lib/cn';

type Kind = 'up' | 'total' | 'down' | 'costTotal' | 'result';
const STEPS: { id: keyof typeof UE; kind: Kind }[] = [
  { id: 'depositMargin', kind: 'up' },
  { id: 'financingMargin', kind: 'up' },
  { id: 'fees', kind: 'up' },
  { id: 'revenue', kind: 'total' },
  { id: 'acquisition', kind: 'down' },
  { id: 'buildRun', kind: 'down' },
  { id: 'costToServe', kind: 'down' },
  { id: 'impairment', kind: 'down' },
  { id: 'cost', kind: 'costTotal' },
  { id: 'preTax', kind: 'result' },
];

const BAR: Record<Kind, string> = {
  up: 'bg-gradient-to-r from-gold/70 to-gold',
  total: 'bg-gradient-to-r from-ink/50 to-ink/80',
  down: 'bg-gradient-to-r from-brand to-brand/70',
  costTotal: 'border border-brand/70 bg-brand/15',
  result: 'bg-gradient-to-r from-pass/70 to-pass',
};

/**
 * Horizontal waterfall per average active customer, FY31 (SAR). Bar positions are
 * drawn from the given lines; every label is the given value, nothing is recomputed.
 */
export function UnitWaterfall() {
  const t = useT();
  const f = useFmt();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '-40px' });
  const max = UE.revenue;
  let run = 0;
  const spans = STEPS.map((s) => {
    const v = UE[s.id] as number;
    if (s.kind === 'total') return { from: 0, to: v };
    if (s.kind === 'result') return { from: 0, to: v };
    if (s.kind === 'costTotal') return { from: UE.preTax, to: UE.revenue };
    const from = run;
    run += v;
    return { from: Math.min(from, run), to: Math.max(from, run) };
  });

  return (
    <div ref={ref} className="space-y-1.5">
      {STEPS.map((s, i) => {
        const v = UE[s.id] as number;
        const span = spans[i];
        const left = (span.from / max) * 100;
        const width = ((span.to - span.from) / max) * 100;
        const label = s.kind === 'up' ? `+${f.num(v)}` : s.kind === 'down' || s.kind === 'costTotal' ? f.signed(v, 0) : f.num(v);
        const strong = s.kind === 'total' || s.kind === 'result' || s.kind === 'costTotal';
        const end = left + width;
        // Label beside the bar end, before the bar start, or inside a near-full-width bar.
        const place =
          end <= 78
            ? { inside: false, style: { left: `${end + 1.5}%` } }
            : left > 22
              ? { inside: false, style: { right: `${100 - left + 1.5}%` } }
              : { inside: true, style: { right: `${100 - end + 2}%` } };
        const name = s.id === 'cost' ? t.cockpit.unit.cost : t.cockpit.unit.bars[s.id as keyof typeof t.cockpit.unit.bars];
        return (
          <div key={s.id} className={cn('grid grid-cols-[minmax(0,8.5rem)_1fr] items-center gap-2', (s.kind === 'total' || s.kind === 'costTotal') && 'mb-1')}>
            <span className={cn('truncate text-xs', strong ? 'font-semibold text-ink' : 'text-muted')}>{name}</span>
            <div dir="ltr" className="relative h-6 rounded-md bg-line/[0.04]">
              <motion.div
                className={cn('absolute inset-y-0.5 rounded', BAR[s.kind])}
                style={{ left: `${left}%`, width: `${width}%`, transformOrigin: s.kind === 'down' ? 'right' : 'left' }}
                initial={{ scaleX: 0 }}
                animate={seen ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={seen ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.6875rem] font-semibold',
                  place.inside && s.kind === 'total'
                    ? 'text-bg'
                    : s.kind === 'down' || s.kind === 'costTotal'
                      ? 'text-brand'
                      : s.kind === 'result'
                        ? 'text-pass'
                        : 'text-ink',
                )}
                style={place.style}
              >
                <Fig src="teamModel">{label}</Fig>
              </motion.span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Break-even gauge: SAR 420 needed vs SAR 519 modelled (24% headroom). */
export function BreakEvenGauge() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const ref = useRef<SVGSVGElement>(null);
  const seen = useInView(ref, { once: true, margin: '-40px' });
  const SCALE = 600; // visual scale only (not a figure)
  const cx = 110;
  const cy = 104;
  const r = 84;
  const pt = (v: number) => {
    const a = Math.PI * (v / SCALE);
    return { x: cx - r * Math.cos(a), y: cy - r * Math.sin(a) };
  };
  const arc = (v0: number, v1: number) => {
    const a = pt(v0);
    const b = pt(v1);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };
  const needle = (180 * UE.modelled) / SCALE; // degrees from the left
  const reduce = useReducedMotion();
  const ang = useSpring(0, { stiffness: 60, damping: 12 });
  useEffect(() => {
    if (!seen) return;
    if (reduce) ang.jump(needle);
    else ang.set(needle);
  }, [seen, reduce, ang, needle]);
  const nx = useTransform(ang, (d) => cx - (r - 18) * Math.cos((d * Math.PI) / 180));
  const ny = useTransform(ang, (d) => cy - (r - 18) * Math.sin((d * Math.PI) / 180));
  const need = pt(UE.breakEvenNeeded);
  const needIn = { x: cx - (r - 16) * Math.cos((Math.PI * UE.breakEvenNeeded) / SCALE), y: cy - (r - 16) * Math.sin((Math.PI * UE.breakEvenNeeded) / SCALE) };
  const needOut = { x: cx - (r + 12) * Math.cos((Math.PI * UE.breakEvenNeeded) / SCALE), y: cy - (r + 12) * Math.sin((Math.PI * UE.breakEvenNeeded) / SCALE) };

  return (
    <div className="flex flex-col items-center">
      <svg ref={ref} viewBox="0 0 220 124" className="w-full max-w-[17rem]" role="img" aria-label={t.cockpit.unit.gaugeTitle}>
        <defs>
          <linearGradient id="be-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgb(var(--brand))" />
            <stop offset="0.7" stopColor="rgb(var(--gold))" />
            <stop offset="1" stopColor="rgb(var(--pass))" />
          </linearGradient>
        </defs>
        <path d={arc(0, SCALE)} fill="none" stroke="rgb(var(--line) / 0.1)" strokeWidth={14} strokeLinecap="round" />
        <motion.path
          d={arc(0.01, UE.modelled)}
          fill="none"
          stroke="url(#be-g)"
          strokeWidth={14}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: seen ? 1 : 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d={arc(UE.breakEvenNeeded, UE.modelled)}
          fill="none"
          stroke="rgb(var(--pass))"
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: seen ? 1 : 0 }}
          transition={{ delay: 1 }}
          style={{ filter: 'drop-shadow(0 0 4px rgb(var(--pass) / 0.8))' }}
        />
        {/* Break-even marker at SAR 420 */}
        <line x1={needIn.x} y1={needIn.y} x2={needOut.x} y2={needOut.y} stroke="rgb(var(--text))" strokeWidth={2} />
        <circle cx={need.x} cy={need.y} r={2.5} fill="rgb(var(--text))" />
        {/* Needle at SAR 519 */}
        <motion.line x1={cx} y1={cy} x2={nx} y2={ny} stroke="rgb(var(--gold))" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="rgb(var(--elev))" stroke="rgb(var(--gold))" strokeWidth={2} />
      </svg>
      <div className="-mt-1 grid w-full grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-line/[0.04] px-2 py-1.5">
          <div className="font-display text-base font-semibold">
            <Fig src="teamModel">{f.sar(UE.breakEvenNeeded)}</Fig>
          </div>
          <div className="text-[0.6875rem] text-muted">{t.cockpit.unit.needed}</div>
        </div>
        <div className="rounded-xl border border-gold/30 bg-gold/[0.07] px-2 py-1.5">
          <div className="font-display text-base font-semibold text-gold">
            <Fig src="teamModel">{f.sar(UE.modelled)}</Fig>
          </div>
          <div className="text-[0.6875rem] text-muted">{t.cockpit.unit.modelled}</div>
        </div>
      </div>
      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-pass/40 bg-pass/10 px-2.5 py-0.5 text-xs font-semibold text-pass">
        <Fig src="teamModel">{tp(t.cockpit.unit.headroom, { v: f.pct(UE.headroomPct, 0) })}</Fig>
      </span>
    </div>
  );
}
