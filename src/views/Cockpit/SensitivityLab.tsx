import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, MoveDown, MoveUp, RotateCcw, Zap } from 'lucide-react';
import { SENSITIVITIES, SENS_BASE, STRESS_PRESETS, type BreakEven } from '../../data/deck';
import { useApp, type PresetId, type SensSide } from '../../store';
import { useT, useTpl } from '../../i18n';
import { cn } from '../../lib/cn';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { SectionHeader, Segmented } from '../../components/ui/Controls';
import { Button } from '../../components/ui/Button';
import { CountUp } from '../../components/ui/CountUp';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { useFmt } from '../../components/ui/useFmt';
import { Tornado } from '../../components/charts/cockpit/Tornado';
import { CONDITIONS, EASE, fmtBE, fmtUnit } from './shared';

const BE_ORDER: Record<BreakEven, number> = { FY30: 0, FY31: 1, 'after FY31': 2 };
type Dir = 'better' | 'worse' | 'same';

function Delta({ dir }: { dir: Dir }) {
  if (dir === 'same') return null;
  const Icon = dir === 'better' ? MoveUp : MoveDown;
  return <Icon className={cn('h-3.5 w-3.5 shrink-0', dir === 'better' ? 'text-pass' : 'text-stop')} strokeWidth={2.2} aria-hidden />;
}

function ResultCell({ label, children, dir = 'same' }: { label: ReactNode; children: ReactNode; dir?: Dir }) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 transition-colors duration-300',
        dir === 'better' ? 'border-pass/30 bg-pass/[0.06]' : dir === 'worse' ? 'border-stop/30 bg-stop/[0.06]' : 'border-line/10 bg-line/[0.03]',
      )}
    >
      <div className="truncate text-[0.6875rem] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5 font-display text-lg font-semibold leading-tight">
        {children}
        <Delta dir={dir} />
      </div>
    </div>
  );
}

const cmp = (v: number, base: number, higherIsBetter: boolean): Dir =>
  v === base ? 'same' : (v > base) === higherIsBetter ? 'better' : 'worse';
const cmpBE = (v: BreakEven, base: BreakEven): Dir => (BE_ORDER[v] === BE_ORDER[base] ? 'same' : BE_ORDER[v] < BE_ORDER[base] ? 'better' : 'worse');

/** d. Sensitivity lab: one lever at a time, exact values from the Sens sheet. */
export function SensitivityLab() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const s = t.cockpit.sens;
  const sensLever = useApp((x) => x.sensLever);
  const sensSide = useApp((x) => x.sensSide);
  const sensPreset = useApp((x) => x.sensPreset);
  const setSens = useApp((x) => x.setSens);
  const setPreset = useApp((x) => x.setPreset);
  const [focus, setFocus] = useState<number | null>(sensLever ?? 0);

  const focusLever = focus !== null ? SENSITIVITIES[focus] : null;
  const focusSide: SensSide = focus !== null && sensLever === focus ? sensSide : 'base';
  const preset = sensPreset ? STRESS_PRESETS.find((p) => p.id === sensPreset)! : null;
  const offResult = sensLever !== null && sensSide !== 'base' ? SENSITIVITIES[sensLever][sensSide] : null;

  // Values for the result card, read straight from the table (or the base reference).
  const r = preset
    ? { revenue31: preset.revenue31, netProfit31: preset.netProfit31, peak: preset.peak, opBE: preset.opBE, cumBE: preset.cumBE, change: null as number | null }
    : offResult
      ? { ...offResult }
      : { ...SENS_BASE, change: null as number | null };

  const presetLabel = (id: PresetId) =>
    id === 'allAdverse'
      ? s.presets.allAdverse
      : id === 'cannibalisation'
        ? tp(s.presets.cannibalisation, { v: f.pct(CONDITIONS.cannib20, 0) })
        : tp(s.presets.arpuLed, { v: f.sar(CONDITIONS.arpu367) });

  const pick = (i: number, side: SensSide) => {
    setFocus(i);
    setSens(i, side);
  };

  const headline = preset
    ? { tag: s.presetActive, name: presetLabel(preset.id), tone: 'stop' as const }
    : offResult && sensLever !== null
      ? { tag: s.testing, name: `${s.levers[SENSITIVITIES[sensLever].id as keyof typeof s.levers]} · ${s.sides[sensSide]}`, tone: sensSide === 'adverse' ? ('stop' as const) : ('pass' as const) }
      : { tag: s.baseCase, name: s.baseCase, tone: 'base' as const };

  return (
    <SpotlightCard className="p-5 sm:p-6">
      <SectionHeader
        eyebrow={s.eyebrow}
        title={s.title}
        subtitle={s.subtitle}
        right={
          <div className="flex items-center gap-2">
            <SourceChip src="teamSens" />
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />}
              onClick={() => {
                setPreset(null);
                setSens(null, 'base');
              }}
              disabled={!preset && !offResult}
            >
              {s.backToBase}
            </Button>
          </div>
        }
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Tornado focus={focus} offLever={sensLever} offSide={sensSide} presetActive={!!preset} onFocus={setFocus} onPick={pick} />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Lever control */}
          <div className="inner p-4">
            {focusLever ? (
              <>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[0.6875rem] uppercase tracking-wider text-muted">{t.cockpit.sens.eyebrow}</div>
                    <div className="truncate font-display text-base font-semibold">{s.levers[focusLever.id as keyof typeof s.levers]}</div>
                  </div>
                  <span className="num shrink-0 text-xs text-muted">
                    {fmtUnit(focusLever.unit, focusLever.dp, focusLever.base, f)}
                  </span>
                </div>
                <Segmented
                  value={focusSide}
                  onChange={(side) => {
                    if (side === 'base' && sensLever !== focus) return;
                    setSens(focus, side);
                  }}
                  layoutId="cockpit-sens-side"
                  className="flex w-full [&>button]:flex-1"
                  options={(['adverse', 'base', 'favourable'] as SensSide[]).map((side) => ({
                    value: side,
                    label: (
                      <span className="flex flex-col items-center leading-tight">
                        <span>{s.sides[side]}</span>
                        <span className="num text-[0.6875rem] font-normal text-muted">
                          {fmtUnit(focusLever.unit, focusLever.dp, side === 'base' ? focusLever.base : focusLever[side].value, f)}
                        </span>
                      </span>
                    ),
                  }))}
                />
              </>
            ) : (
              <p className="text-sm text-muted">{s.pickLever}</p>
            )}
          </div>

          {/* Result card */}
          <div
            className={cn(
              'rounded-inner border p-4 transition-colors duration-300',
              headline.tone === 'stop' ? 'border-stop/30 bg-stop/[0.04]' : headline.tone === 'pass' ? 'border-pass/30 bg-pass/[0.04]' : 'border-line/10 bg-line/[0.03]',
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[0.6875rem] uppercase tracking-wider text-muted">{s.result.title}</div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={headline.name}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="truncate text-sm font-semibold"
                  >
                    {headline.name}
                  </motion.div>
                </AnimatePresence>
              </div>
              <span
                className={cn(
                  'chip shrink-0',
                  headline.tone === 'stop' ? 'border-stop/40 bg-stop/10 text-stop' : headline.tone === 'pass' ? 'border-pass/40 bg-pass/10 text-pass' : 'text-muted',
                )}
              >
                {headline.tone === 'base' ? <FlaskConical className="h-3 w-3" strokeWidth={1.75} aria-hidden /> : <Zap className="h-3 w-3" strokeWidth={1.75} aria-hidden />}
                {headline.tag}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ResultCell label={s.result.revenue31} dir={cmp(r.revenue31, SENS_BASE.revenue31, true)}>
                <Fig src="teamSens">
                  <CountUp value={r.revenue31} format={(v) => f.sarM(Math.round(v))} duration={0.6} />
                </Fig>
              </ResultCell>
              <ResultCell label={s.result.netProfit31} dir={cmp(r.netProfit31, SENS_BASE.netProfit31, true)}>
                <Fig src="teamSens">
                  <CountUp value={r.netProfit31} format={(v) => f.sarM(Math.round(v))} duration={0.6} />
                </Fig>
              </ResultCell>
              <ResultCell label={s.result.change} dir={r.change === null ? 'same' : r.change > 0 ? 'better' : 'worse'}>
                {preset ? (
                  <span className="text-xs font-medium text-muted">{t.common.notReported}</span>
                ) : r.change === null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <Fig src="teamSens">
                    <span className="flex items-baseline gap-1">
                      {f.signed(r.change, 1)}
                      <span className="text-[0.6875rem] font-medium text-muted">{s.unitSarM}</span>
                    </span>
                  </Fig>
                )}
              </ResultCell>
              <ResultCell label={s.result.peak} dir={cmp(r.peak, SENS_BASE.peak, false)}>
                <Fig src="teamSens">
                  <CountUp value={r.peak} format={(v) => f.sarM(Math.round(v))} duration={0.6} />
                </Fig>
              </ResultCell>
              <ResultCell label={s.result.opBE} dir={cmpBE(r.opBE, SENS_BASE.opBE)}>
                <Fig src="teamSens">{fmtBE(r.opBE, t, f)}</Fig>
              </ResultCell>
              <ResultCell label={s.result.cumBE} dir={cmpBE(r.cumBE, SENS_BASE.cumBE)}>
                <Fig src="teamSens">{fmtBE(r.cumBE, t, f)}</Fig>
              </ResultCell>
            </div>
          </div>

          {/* Stress presets */}
          <div>
            <div className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">{s.presetsTitle}</div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {STRESS_PRESETS.map((p) => {
                const active = sensPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPreset(active ? null : p.id)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-start transition-colors',
                      active ? 'border-stop/50 bg-stop/10' : 'border-line/10 bg-line/[0.03] hover:border-line/25',
                    )}
                  >
                    <div className={cn('text-[0.8125rem] font-semibold', active && 'text-stop')}>{presetLabel(p.id)}</div>
                    <div className="text-[0.6875rem] leading-snug text-muted">{s.presetNotes[p.id]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
