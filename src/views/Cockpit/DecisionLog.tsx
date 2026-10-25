import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Cpu, FileSearch, ScrollText, UserCheck } from 'lucide-react';
import { useApp, type DecisionRecord } from '../../store';
import { PERSONAS, POLICY } from '../../config/illustrative';
import { useMsg, useT, useTpl } from '../../i18n';
import { clock } from '../../lib/format';
import { cn } from '../../lib/cn';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Avatar, SectionHeader } from '../../components/ui/Controls';
import { Button } from '../../components/ui/Button';
import { Illus } from '../../components/ui/Provenance';
import { useFmt } from '../../components/ui/useFmt';
import { EASE } from './shared';

const COLS = 'grid grid-cols-[4.25rem_minmax(0,1.35fr)_4.75rem_minmax(0,1.25fr)_6.25rem] items-start gap-x-3';

const OUTCOME_STYLE: Record<DecisionRecord['outcome'], string> = {
  shown: 'border-line/20 bg-line/5 text-ink/80',
  accepted: 'border-pass/40 bg-pass/10 text-pass',
  notNow: 'border-line/20 bg-line/5 text-muted',
  specialist: 'border-gold/40 bg-gold/10 text-gold',
  review: 'border-gold/40 bg-gold/10 text-gold',
};

const BAND_STYLE: Record<DecisionRecord['band'], string> = {
  A: 'border-pass/40 text-pass',
  B: 'border-gold/40 text-gold',
  C: 'border-watch/45 text-watch',
  D: 'border-stop/45 text-stop',
};

function Row({ d }: { d: DecisionRecord }) {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const render = useMsg();
  const c = t.cockpit.decisions;
  const p = PERSONAS[d.personaId];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative border-b border-line/[0.07] py-2.5 last:border-b-0"
    >
      <motion.span
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.6, delay: 0.3 }}
        className="pointer-events-none absolute inset-0 rounded-lg bg-gold/10"
      />
      <div className={cn(COLS, 'relative')}>
        <div className="min-w-0">
          <div className="num text-xs text-ink/85" dir="ltr">
            {clock(d.ts)}
          </div>
          <div className="truncate text-[0.6875rem] text-muted">{t.cockpit.stage[d.stage]}</div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar initials={p.initials} gradient={p.gradient} size={26} />
          <div className="min-w-0">
            <div className="truncate text-[0.8125rem] font-medium">{t.common.personas[d.personaId].name}</div>
            <div className="truncate text-[0.6875rem] text-muted">{tp(c.monthTenor, { m: d.month, n: d.tenor })}</div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="num text-[0.8125rem] font-semibold">{d.score.toFixed(1)}</div>
          <span className={cn('mt-0.5 inline-flex rounded-md border px-1.5 text-[0.625rem] font-semibold', BAND_STYLE[d.band])}>
            {tp(t.common.band, { b: d.band })}
          </span>
        </div>
        <div className="min-w-0">
          <div className="num truncate text-[0.8125rem] font-semibold">{d.limit !== null ? f.sar(d.limit) : c.noOffer}</div>
          <div className="truncate text-[0.6875rem] text-muted">
            {d.binding ? t.cockpit.binding[d.binding] : '—'}
            {d.requested ? ` · ${tp(c.requested, { amount: f.sar(d.requested) })}` : ''}
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1">
          {d.humanReview ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-1.5 py-px text-[0.625rem] font-semibold text-gold">
              <UserCheck className="h-3 w-3" strokeWidth={2} aria-hidden />
              {c.humanReview}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-line/20 px-1.5 py-px text-[0.625rem] font-medium text-muted">
              <Cpu className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              {c.automated}
            </span>
          )}
          <span className={cn('inline-flex rounded-full border px-1.5 py-px text-[0.625rem] font-semibold', OUTCOME_STYLE[d.outcome])}>
            {t.cockpit.outcome[d.outcome]}
          </span>
        </div>
      </div>
      <div className="relative mt-1.5 flex items-start justify-between gap-3 ps-[4.25rem]">
        <p className="min-w-0 text-[0.6875rem] leading-snug text-muted">
          <span className="font-medium text-ink/70">{c.reasons}: </span>
          {d.reasons.map((r) => render(r)).join(' · ')}
        </p>
        <span className="shrink-0 font-mono text-[0.625rem] text-muted" dir="ltr">
          {d.policy}
        </span>
      </div>
    </motion.li>
  );
}

/** h. Explainable decision log: every credit decision from the customer app. */
export function DecisionLog() {
  const t = useT();
  const tp = useTpl();
  const c = t.cockpit.decisions;
  const decisions = useApp((s) => s.decisions);
  const setArea = useApp((s) => s.setArea);
  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <SectionHeader
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        right={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip border-ai/35 bg-ai/10 text-ai-glow">
              <FileSearch className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              {t.cockpit.scorecardNote}
            </span>
            <span className="chip font-mono" dir="ltr">
              <ScrollText className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              {tp(t.cockpit.policyChip, { v: POLICY.version })}
            </span>
            <Illus />
          </div>
        }
      />
      {decisions.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-inner border border-dashed border-line/15 p-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ai/10 text-ai-glow">
            <FileSearch className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-muted">{c.empty}</p>
          <Button variant="outline" size="sm" iconEnd={<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />} onClick={() => setArea('app')} cursor="open">
            {c.openApp}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <div className={cn(COLS, 'border-b border-line/10 pb-2 text-[0.625rem] font-semibold uppercase tracking-wider text-muted')}>
            <span>{c.cols.time}</span>
            <span>{c.cols.customer}</span>
            <span>{c.cols.score}</span>
            <span>{c.cols.limit}</span>
            <span>
              {c.cols.review} / {c.cols.outcome}
            </span>
          </div>
          <ul className="max-h-[27rem] overflow-y-auto pe-1">
            <AnimatePresence initial={false}>
              {decisions.map((d) => (
                <Row key={d.id} d={d} />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </SpotlightCard>
  );
}
