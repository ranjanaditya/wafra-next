import { useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Activity, BadgeAlert, CircleDashed, FileText, RotateCw, ShieldCheck, TrendingDown } from 'lucide-react';
import { RISKS, RISK_HEAT_ORDER, SENS_BASE, STRESS_PRESETS, type RiskImpact } from '../../data/deck';
import { useT, useTpl } from '../../i18n';
import { cn } from '../../lib/cn';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { SectionHeader } from '../../components/ui/Controls';
import { Fig, SourceChip, Tip } from '../../components/ui/Provenance';
import { useFmt, type Fmt } from '../../components/ui/useFmt';
import type { Dict } from '../../i18n';
import { CONDITIONS, EASE } from './shared';

type RiskId = keyof Dict['cockpit']['risks']['items'];

/** FY31 net profit if the risk hits (the ARPU-led case is the stress preset's reported net profit). */
function impactValue(impact: RiskImpact): number | null {
  if (impact.kind === 'netProfit') return impact.value;
  if (impact.kind === 'loss') return STRESS_PRESETS.find((p) => p.id === 'arpuLed')!.netProfit31;
  return null;
}

function severity(v: number | null) {
  if (v === null) return { cls: 'bg-line/[0.06] text-muted border-line/15', Icon: CircleDashed };
  if (v < -10) return { cls: 'bg-stop/70 text-white border-stop', Icon: TrendingDown };
  if (v <= 0) return { cls: 'bg-stop/35 text-ink border-stop/60', Icon: TrendingDown };
  if (v < 18) return { cls: 'bg-watch/40 text-ink border-watch/70', Icon: BadgeAlert };
  return { cls: 'bg-watch/20 text-ink border-watch/45', Icon: BadgeAlert };
}

function impactText(impact: RiskImpact, t: Dict, tp: (s: string, p?: Record<string, string | number>) => string, f: Fmt) {
  const r = t.cockpit.risks.impact;
  switch (impact.kind) {
    case 'notModelled':
      return r.notModelled;
    case 'loss':
      return tp(r.arpu367, { v: f.sarM(impact.value), c: f.sar(CONDITIONS.arpu367) });
    case 'netProfit':
      if (impact.condition === 'cor35') return tp(r.cor35, { v: f.sarM(impact.value), c: f.pct(CONDITIONS.cor35, 1) });
      if (impact.condition === 'cac350') return tp(r.cac350, { v: f.sarM(impact.value), c: f.sar(CONDITIONS.cac350) });
      return tp(r.cannib20, { v: f.sarM(impact.value), c: f.pct(CONDITIONS.cannib20, 0) });
  }
}

function FlipCard({ id, impact, index }: { id: RiskId; impact: RiskImpact; index: number }) {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const rk = t.cockpit.risks;
  const item = rk.items[id];
  const [flipped, setFlipped] = useState(false);
  const v = impactValue(impact);
  const sev = severity(v);
  const text = impactText(impact, t, tp, f);
  const toggle = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-cursor="explain"], button')) return;
    setFlipped((x) => !x);
  };
  const face = 'absolute inset-0 flex flex-col overflow-hidden rounded-inner border border-line/10 bg-elev/80 p-4 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: EASE }}
      className="h-[17rem]"
      style={{ perspective: 1000 }}
    >
      <motion.div
        onClick={toggle}
        data-cursor="open"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-full w-full cursor-pointer"
      >
        {/* Front */}
        <div className={face} aria-hidden={flipped}>
          <div className="flex items-start justify-between gap-2">
            <span className="num text-[0.6875rem] font-semibold text-muted">{String(index + 1).padStart(2, '0')}</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[0.625rem] font-semibold', sev.cls)}>
              <sev.Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
              {v === null ? rk.nm : f.sarM(v)}
            </span>
          </div>
          <h3 className="mt-2 font-display text-[0.95rem] font-semibold leading-snug">{item.name}</h3>
          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted">
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
            <span>
              <span className="text-ink/70">{rk.earlyWarning}: </span>
              {item.metric}
            </span>
          </div>
          <div className="mt-auto">
            <div className="text-[0.625rem] uppercase tracking-wider text-muted">{rk.impactLabel}</div>
            <div className={cn('text-[0.8125rem] font-semibold leading-snug', v === null ? 'text-muted' : v <= 0 ? 'text-stop' : 'text-watch')}>
              {v === null ? text : <Fig src="teamSens">{text}</Fig>}
            </div>
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="mt-2 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-gold hover:underline"
              tabIndex={flipped ? -1 : 0}
            >
              <RotateCw className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              {rk.flip}
            </button>
          </div>
        </div>
        {/* Back */}
        <div className={cn(face, '[transform:rotateY(180deg)]')} aria-hidden={!flipped}>
          <h3 className="font-display text-[0.875rem] font-semibold leading-snug">{item.name}</h3>
          <div className="mt-2 space-y-2 overflow-y-auto text-xs leading-snug">
            <div className="flex gap-1.5">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
              <div>
                <div className="text-[0.625rem] uppercase tracking-wider text-muted">{rk.evidence}</div>
                <div className="text-ink/90">{item.evidence}</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pass" strokeWidth={1.5} aria-hidden />
              <div>
                <div className="text-[0.625rem] uppercase tracking-wider text-muted">{rk.mitigation}</div>
                <div className="text-ink/90">{item.mitigation}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFlipped(false)}
            className="mt-auto inline-flex items-center gap-1 pt-2 text-[0.6875rem] font-medium text-gold hover:underline"
            tabIndex={flipped ? 0 : -1}
          >
            <RotateCw className="h-3 w-3 -scale-x-100" strokeWidth={1.75} aria-hidden />
            {rk.flipBack}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** f. Risk register: eight flip cards and a mini heat strip ordered by FY31 impact. */
export function RiskRegister() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const rk = t.cockpit.risks;
  const byId = Object.fromEntries(RISKS.map((r) => [r.id, r.impact])) as Record<string, RiskImpact>;

  return (
    <SpotlightCard className="p-5 sm:p-6">
      <SectionHeader
        eyebrow={rk.eyebrow}
        title={rk.title}
        subtitle={tp(rk.subtitle, { base: f.sarM(SENS_BASE.netProfit31) })}
        right={<SourceChip src="report" />}
      />
      <div className="mt-4">
        <div className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">{rk.heatTitle}</div>
        <div className="flex gap-1">
          {RISK_HEAT_ORDER.map((id, i) => {
            const impact = byId[id];
            const v = impactValue(impact);
            const sev = severity(v);
            return (
              <Tip
                key={id}
                className="min-w-0 flex-1"
                content={
                  <div className="space-y-0.5">
                    <div className="font-medium">{rk.items[id as RiskId].name}</div>
                    <div className="text-[0.6875rem] text-muted">{impactText(impact, t, tp, f)}</div>
                  </div>
                }
              >
                <motion.span
                  initial={{ opacity: 0, scaleY: 0.4 }}
                  whileInView={{ opacity: 1, scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className={cn(
                    'flex h-11 w-full flex-col justify-center rounded-lg border px-2',
                    sev.cls,
                    v === null && 'bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(var(--line)/0.06)_6px_12px)]',
                  )}
                >
                  <span className="truncate text-[0.625rem] font-semibold uppercase tracking-wide opacity-90">{rk.short[id as RiskId]}</span>
                  <span className="num truncate text-[0.75rem] font-bold">{v === null ? rk.nm : f.sarM(v)}</span>
                </motion.span>
              </Tip>
            );
          })}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RISKS.map((r, i) => (
          <FlipCard key={r.id} id={r.id as RiskId} impact={r.impact} index={i} />
        ))}
      </div>
    </SpotlightCard>
  );
}
