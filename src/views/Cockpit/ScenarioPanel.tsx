import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FY, PNL_BASE, SCENARIOS, type ScenarioId } from '../../data/deck';
import { useApp } from '../../store';
import { useT, useTpl } from '../../i18n';
import { cn } from '../../lib/cn';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { SectionHeader, Segmented } from '../../components/ui/Controls';
import { CountUp } from '../../components/ui/CountUp';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { useFmt } from '../../components/ui/useFmt';
import { useChartColors } from '../../components/charts/theme';
import { JCurve, ScenarioBars } from '../../components/charts/cockpit/ScenarioCharts';
import { EASE, LegendDot, Metric } from './shared';

type RowKey = keyof typeof PNL_BASE | 'opexImpairment';
type Row = { key: RowKey; values: readonly number[]; bold?: boolean; indent?: boolean; dp?: number; neg?: boolean };

function PnlTable({ scenario }: { scenario: ScenarioId }) {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const tb = t.cockpit.scenario.table;
  const s = SCENARIOS[scenario];
  const rows: Row[] =
    scenario === 'base'
      ? [
          { key: 'approved', values: PNL_BASE.approved, dp: 2 },
          { key: 'active', values: PNL_BASE.active, dp: 2 },
          { key: 'depositMargin', values: PNL_BASE.depositMargin, indent: true },
          { key: 'financingMargin', values: PNL_BASE.financingMargin, indent: true },
          { key: 'fees', values: PNL_BASE.fees, indent: true },
          { key: 'revenue', values: PNL_BASE.revenue, bold: true },
          { key: 'acquisition', values: PNL_BASE.acquisition, indent: true },
          { key: 'buildRun', values: PNL_BASE.buildRun, indent: true },
          { key: 'costToServe', values: PNL_BASE.costToServe, indent: true },
          { key: 'operatingCost', values: PNL_BASE.operatingCost, bold: true },
          { key: 'impairment', values: PNL_BASE.impairment },
          { key: 'preTax', values: PNL_BASE.preTax, bold: true },
          { key: 'tax', values: PNL_BASE.tax },
          { key: 'netProfit', values: PNL_BASE.netProfit, bold: true },
          { key: 'cumulative', values: PNL_BASE.cumulative },
          { key: 'cet1', values: PNL_BASE.cet1 },
        ]
      : [
          { key: 'revenue', values: s.revenue, bold: true },
          { key: 'opexImpairment', values: s.opexImpairment, neg: true },
          { key: 'netProfit', values: s.netProfit, bold: true },
          { key: 'cumulative', values: s.cumulative },
        ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-[0.8125rem]">
        <caption className="mb-2 text-start text-xs text-muted">{tp(t.cockpit.scenario.tableCaption, { s: t.cockpit.scenario.options[scenario] })}</caption>
        <thead>
          <tr className="border-b border-line/10 text-[0.6875rem] uppercase tracking-wider text-muted">
            <th className="py-1.5 text-start font-semibold" />
            {FY.map((fy) => (
              <th key={fy} className="px-2 py-1.5 text-end font-semibold">
                {fy}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={cn('border-b border-line/[0.06]', r.bold && 'bg-line/[0.03]')}>
              <th scope="row" className={cn('py-1.5 text-start font-normal', r.bold ? 'font-semibold text-ink' : 'text-ink/80', r.indent && 'ps-4 text-muted')}>
                {tb[r.key]}
              </th>
              {r.values.map((v, i) => (
                <td key={i} className={cn('num px-2 py-1.5 text-end', r.bold && 'font-semibold', (r.neg ? -v : v) < 0 && 'text-ink/75')}>
                  <Fig src="teamModel">{r.dp ? f.num(v, r.dp) : f.paren(r.neg ? -v : v)}</Fig>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[0.6875rem] italic text-muted">{t.common.roundingFootnote}</p>
    </div>
  );
}

/** b. Scenario switcher: revenue vs cost bars, cumulative J-curve and the scenario summary. */
export function ScenarioPanel() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const c = useChartColors();
  const sc = t.cockpit.scenario;
  const scenario = useApp((s) => s.scenario);
  const setScenario = useApp((s) => s.setScenario);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const s = SCENARIOS[scenario];

  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <SectionHeader
        eyebrow={sc.eyebrow}
        title={sc.title}
        subtitle={sc.subtitle}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={scenario}
              onChange={setScenario}
              layoutId="cockpit-scenario"
              ariaLabel={sc.eyebrow}
              options={(['downside', 'base', 'upside'] as ScenarioId[]).map((id) => ({
                value: id,
                label: (
                  <span className="flex items-center gap-1.5">
                    {sc.options[id]}
                    <span className="num text-[0.6875rem] text-muted">{f.mill(SCENARIOS[id].volume, 2)}</span>
                  </span>
                ),
              }))}
            />
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              layoutId="cockpit-scenario-view"
              options={[
                { value: 'chart', label: sc.view.chart },
                { value: 'table', label: sc.view.table },
              ]}
            />
          </div>
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        {view === 'chart' ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink/85">{sc.barsTitle}</span>
                <span className="flex gap-3">
                  <LegendDot color={c.gold} label={sc.revenue} />
                  <LegendDot color={c.brand} label={sc.cost} />
                </span>
              </div>
              <ScenarioBars scenario={scenario} />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink/85">{sc.curveTitle}</span>
                <span className="flex gap-3">
                  <LegendDot color={c.gold} label={sc.options[scenario]} />
                  <LegendDot color={c.alpha('muted', 0.6)} label={sc.otherScenarios} dashed />
                </span>
              </div>
              <JCurve scenario={scenario} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-4"
          >
            <PnlTable scenario={scenario} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line/10 pt-4 sm:grid-cols-4">
        <Metric label={sc.summary.revenue31}>
          <Fig src="teamModel">
            <CountUp value={s.summary.revenue31} format={(v) => f.sarM(Math.round(v))} duration={0.7} />
          </Fig>
        </Metric>
        <Metric label={sc.summary.netProfit31}>
          <Fig src="teamModel">
            <CountUp value={s.summary.netProfit31} format={(v) => f.sarM(Math.round(v))} duration={0.7} />
          </Fig>
        </Metric>
        <Metric label={sc.summary.opBE}>
          <Fig src="teamModel">{f.fy(s.summary.opBreakEven)}</Fig>
        </Metric>
        <Metric label={sc.summary.peak}>
          <span className="flex items-center gap-2">
            <Fig src="teamModel">
              <CountUp value={s.summary.peak} format={(v) => f.sarM(Math.round(v))} duration={0.7} />
            </Fig>
            <SourceChip src="teamModel" />
          </span>
        </Metric>
      </div>
    </SpotlightCard>
  );
}
