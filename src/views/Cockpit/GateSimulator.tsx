import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { CircleAlert, Lock, LockOpen, OctagonX, RotateCcw, ShieldCheck } from 'lucide-react';
import { useApp } from '../../store';
import { FY, GATES, QUARTERS } from '../../data/deck';
import { GATE_RANGES, type GateInputs } from '../../config/illustrative';
import { evaluateGates, type GateResult, type GateStatus, type MetricResult } from '../../logic/gates';
import { useLang, useT, useTpl } from '../../i18n';
import { cn } from '../../lib/cn';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { MetMark, SectionHeader, Slider, StatusBadge, Toggle } from '../../components/ui/Controls';
import { Button } from '../../components/ui/Button';
import { Fig, Illus, SourceChip } from '../../components/ui/Provenance';
import { useFmt, type Fmt } from '../../components/ui/useFmt';
import { CorBars } from '../../components/charts/cockpit/CorBars';
import { ExposureMeter } from '../../components/charts/cockpit/ExposureMeter';
import { EASE } from './shared';

const TONE: Record<GateStatus, { ring: string; text: string; bg: string; border: string }> = {
  PASS: { ring: 'ring-pass/40', text: 'text-pass', bg: 'bg-pass/10', border: 'border-pass/35' },
  WATCH: { ring: 'ring-watch/40', text: 'text-watch', bg: 'bg-watch/10', border: 'border-watch/40' },
  STOP: { ring: 'ring-stop/45', text: 'text-stop', bg: 'bg-stop/10', border: 'border-stop/45' },
  LOCKED: { ring: 'ring-line/15', text: 'text-muted', bg: 'bg-line/5', border: 'border-line/10' },
};

function fmtMetric(id: MetricResult['id'], v: number, f: Fmt) {
  switch (id) {
    case 'approved':
      return f.mill(v, 2);
    case 'cac':
      return f.sar(v);
    case 'cor':
      return f.pct(v, 1);
    default:
      return f.pct(v, 0);
  }
}

/** Animated lock: opens (teal) on PASS/WATCH, stays shut on STOP/LOCKED. */
function GateLock({ status, size = 'md' }: { status: GateStatus; size?: 'sm' | 'md' }) {
  const open = status === 'PASS' || status === 'WATCH';
  const tone = TONE[status];
  const dim = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full border bg-elev', dim, tone.border, tone.text)}>
      {status === 'PASS' && <span aria-hidden className="absolute inset-0 animate-pulseRing rounded-full border border-pass/60" />}
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.span
            key="open"
            initial={{ rotate: -25, y: 3, scale: 0.7, opacity: 0 }}
            animate={{ rotate: 0, y: 0, scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          >
            <LockOpen className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} aria-hidden />
          </motion.span>
        ) : (
          <motion.span
            key="closed"
            initial={{ y: -4, scale: 0.7, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          >
            <Lock className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function MetricControl({ gate, metric, inputs }: { gate: GateResult; metric: MetricResult; inputs: GateInputs }) {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const g = t.cockpit.gates;
  const setGateInputs = useApp((s) => s.setGateInputs);
  const label = g.metrics[metric.id];
  const thr =
    metric.op === 'yes'
      ? g.mustBeYes
      : tp(metric.op === '>=' ? g.atLeast : g.atMost, { v: fmtMetric(metric.id, metric.threshold as number, f) });
  const mark = <MetMark met={metric.met} label={metric.met ? g.met : g.missed} />;

  if (metric.id === 'lossNarrowing') {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Toggle
            checked={inputs.lossNarrowing}
            onChange={(v) => setGateInputs({ lossNarrowing: v })}
            tone="pass"
            label={
              <span className="flex items-center gap-1.5">
                {label} {mark}
              </span>
            }
            description={`${thr} · ${inputs.lossNarrowing ? g.yes : g.no}`}
          />
        </div>
      </div>
    );
  }

  const key: keyof GateInputs =
    metric.id === 'approved' ? (gate.id === 'G1' ? 'approvedG1' : gate.id === 'G2' ? 'approvedG2' : 'approvedG3') : metric.id;
  const range = metric.id === 'approved' ? GATE_RANGES.approved : GATE_RANGES[metric.id as 'activation' | 'cac' | 'retention' | 'cor' | 'primary'];
  const value = inputs[key] as number;
  return (
    <Slider
      label={
        <span className="flex flex-col leading-tight">
          <span>{label}</span>
          <span className="text-[0.6875rem] font-normal text-muted">{thr}</span>
        </span>
      }
      value={value}
      min={range.min}
      max={range.max}
      step={range.step}
      onChange={(v) => setGateInputs({ [key]: Math.round(v * 100) / 100 } as Partial<GateInputs>)}
      format={(v) => fmtMetric(metric.id, v, f)}
      accent={metric.met ? 'pass' : 'stop'}
      right={mark}
    />
  );
}

function GateCard({ gate, index, inputs }: { gate: GateResult; index: number; inputs: GateInputs }) {
  const lang = useLang();
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const g = t.cockpit.gates;
  const controls = useAnimationControls();
  const prev = useRef<GateStatus>(gate.status);
  useEffect(() => {
    if (gate.status === 'STOP' && prev.current !== 'STOP') {
      controls.start({ x: [0, -9, 9, -6, 6, -3, 3, 0], transition: { duration: 0.45, ease: 'easeOut' } });
    }
    prev.current = gate.status;
  }, [gate.status, controls]);
  const tone = TONE[gate.status];

  return (
    <motion.div
      animate={controls}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={cn(
        'relative flex flex-col gap-3 rounded-inner border p-4 transition-colors duration-300',
        tone.border,
        gate.status === 'LOCKED' ? 'bg-line/[0.02] opacity-75' : 'bg-line/[0.035]',
      )}
    >
      <div className="flex items-start gap-3">
        <GateLock status={gate.status} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-semibold leading-tight">{tp(g.gate, { n: index + 1 })}</div>
          <div className="text-xs text-muted">{tp(g.endOf, { fy: f.fy(gate.fyEnd) })}</div>
        </div>
        <StatusBadge status={gate.status} size="sm" />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-line/[0.04] px-3 py-2">
        <span className="text-xs text-muted">{g.exposure}</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Fig src="teamGates">{f.sarM(gate.exposure)}</Fig>
          {index === 2 && <span className="text-[0.6875rem] font-medium text-muted">({g.peak})</span>}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
        {g.pilotActuals}
        <Illus />
      </div>
      <div className="space-y-3.5">
        {gate.metrics.map((mt) => (
          <MetricControl key={mt.id} gate={gate} metric={mt} inputs={inputs} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={gate.status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: EASE }}
          className={cn('mt-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[0.8125rem] leading-snug', tone.border, tone.bg)}
        >
          {gate.status === 'PASS' && <LockOpen className="mt-0.5 h-4 w-4 shrink-0 text-pass" strokeWidth={1.75} aria-hidden />}
          {gate.status === 'WATCH' && <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-watch" strokeWidth={1.75} aria-hidden />}
          {gate.status === 'STOP' && <OctagonX className="mt-0.5 h-4 w-4 shrink-0 text-stop" strokeWidth={1.75} aria-hidden />}
          {gate.status === 'LOCKED' && <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />}
          <div className="min-w-0">
            {gate.status === 'PASS' && <div className="font-semibold text-pass">{g.pass}</div>}
            {gate.status === 'WATCH' && (
              <>
                <div className="font-semibold text-watch">{g.watch}</div>
                <div className="text-[0.6875rem] text-muted">
                  {tp(g.missedCount, { n: gate.missed })} · <span className="italic">{g.watchNote}</span>
                </div>
              </>
            )}
            {gate.status === 'STOP' && (
              <>
                <div className="font-semibold text-stop">{tp(g.stop, { v: f.sarM(gate.exposure) })}</div>
                <div className="text-[0.6875rem] text-muted">{gate.corBreach ? g.corBreach : tp(g.missedCount, { n: gate.missed })}</div>
              </>
            )}
            {gate.status === 'LOCKED' && <div className="text-muted">{g.locked}</div>}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/** FY27 to FY31 timeline with three gate locks; the rail fills to the stop point. Time axis stays left-to-right. */
function GateTimeline({ gates, stoppedAt }: { gates: GateResult[]; stoppedAt: string | null }) {
  const t = useT();
  const f = useFmt();
  const w = t.cockpit.gtm.waves;
  const stopIdx = stoppedAt ? gates.findIndex((x) => x.id === stoppedAt) : -1;
  const fill = stopIdx >= 0 ? (stopIdx + 1) * 20 : 100;
  return (
    <div dir="ltr" className="relative px-1 pt-1">
      <div className="grid grid-cols-5 gap-1 text-center text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">
        <div className="rounded-full bg-line/5 py-1">{w.prove.name}</div>
        <div className="col-span-2 rounded-full bg-line/5 py-1">{w.scale.name}</div>
        <div className="col-span-2 rounded-full bg-line/5 py-1">{w.deepen.name}</div>
      </div>
      <div className="mt-2 grid grid-cols-5 text-center">
        {FY.map((fy) => (
          <div key={fy} className="font-display text-sm font-semibold text-ink/85">
            {fy}
          </div>
        ))}
      </div>
      <div className="relative mt-3 h-14">
        <div className="absolute inset-x-0 top-[1.3rem] h-1.5 rounded-full bg-line/10" />
        <motion.div
          className={cn('absolute inset-x-0 top-[1.3rem] h-1.5 origin-left rounded-full', stopIdx >= 0 ? 'bg-gradient-to-r from-brand to-stop' : 'bg-gradient-to-r from-brand via-gold to-pass')}
          initial={false}
          animate={{ scaleX: fill / 100 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
        />
        {gates.map((gt, i) => (
          <div key={gt.id} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${(i + 1) * 20}%` }}>
            <GateLock status={gt.status} size="sm" />
            <span className={cn('mt-1 whitespace-nowrap text-[0.6875rem] font-semibold', TONE[gt.status].text)}>
              {gt.id} · {f.sarM(gt.exposure)}
            </span>
          </div>
        ))}
        {stopIdx >= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-[0.9rem] h-4 border-l-2 border-dashed border-stop/60"
            style={{ left: `${fill}%` }}
          />
        )}
      </div>
    </div>
  );
}

/** e. Stage-gate simulator: pilot actuals, gate results, cost-of-risk monitor and exposure meter. */
export function GateSimulator() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const g = t.cockpit.gates;
  const inputs = useApp((s) => s.gateInputs);
  const setQuarter = useApp((s) => s.setQuarter);
  const resetGates = useApp((s) => s.resetGates);
  const ev = useMemo(() => evaluateGates(inputs), [inputs]);
  const stopIdx = ev.stoppedAt ? ev.gates.findIndex((x) => x.id === ev.stoppedAt) : -1;
  const watchIdx = ev.gates.findIndex((x) => x.status === 'WATCH');
  const programme: { status: GateStatus; text: string } =
    stopIdx >= 0
      ? { status: 'STOP', text: tp(g.programmeStop, { n: stopIdx + 1, v: f.sarM(ev.exposureCap) }) }
      : watchIdx >= 0
        ? { status: 'WATCH', text: tp(g.programmeWatch, { n: watchIdx + 1 }) }
        : { status: 'PASS', text: g.programmePass };
  const breachPair = ev.breach ? [QUARTERS[ev.breach.index - 1], QUARTERS[ev.breach.index]] : null;

  return (
    <SpotlightCard border="gold" className="p-5 sm:p-6">
      <SectionHeader
        eyebrow={g.eyebrow}
        title={g.title}
        subtitle={g.subtitle}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={programme.status + programme.text}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn('flex max-w-full items-center gap-2 rounded-2xl border py-1 pe-3 ps-1', TONE[programme.status].border, TONE[programme.status].bg)}
              >
                <StatusBadge status={programme.status} size="sm" />
                <span className={cn('text-xs font-medium', TONE[programme.status].text)}>{programme.text}</span>
              </motion.div>
            </AnimatePresence>
            <Button variant="outline" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />} onClick={resetGates}>
              {g.reset}
            </Button>
          </div>
        }
      />

      <div className="mt-5">
        <GateTimeline gates={ev.gates} stoppedAt={ev.stoppedAt} />
      </div>

      {/* Gate cards keep timeline order (G1 left) in both languages. */}
      <div dir="ltr" className="mt-4 grid gap-4 lg:grid-cols-3">
        {ev.gates.map((gt, i) => (
          <GateCard key={gt.id} gate={gt} index={i} inputs={inputs} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="inner p-4 lg:col-span-7">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {g.quarterlyTitle}
                <Illus />
              </div>
              <div className="text-xs text-muted">{g.quarterlySubtitle}</div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={breachPair ? 'breach' : 'ok'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold',
                  breachPair ? 'border-stop/45 bg-stop/10 text-stop' : 'border-pass/35 bg-pass/10 text-pass',
                )}
              >
                {breachPair ? <OctagonX className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
                {breachPair ? tp(g.breach, { a: breachPair[0], b: breachPair[1] }) : g.noBreach}
              </motion.span>
            </AnimatePresence>
          </div>
          <CorBars values={inputs.quarterly} onChange={setQuarter} breachIndex={ev.breach?.index ?? null} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="inner p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">{g.meterTitle}</div>
              <SourceChip src="teamGates" />
            </div>
            <ExposureMeter cap={ev.exposureCap} peak={ev.peak} stopped={!!ev.stoppedAt} />
            <p className="mt-2 text-xs text-muted">
              {ev.stoppedAt
                ? tp(g.meterCapped, { v: f.sarM(ev.exposureCap), peak: f.sarM(ev.peak) })
                : tp(g.meterFull, { v: f.sarM(ev.peak) })}
            </p>
          </div>
          <div className="inner flex items-start gap-2.5 p-4 text-xs leading-relaxed text-muted">
            <OctagonX className="mt-0.5 h-4 w-4 shrink-0 text-stop" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="text-ink/85">{g.stopRule}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {g.defaults} <Illus />
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GATES.map((gt) => (
                  <span key={gt.id} className="chip">
                    {gt.id} · {f.fy(gt.fyEnd)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
