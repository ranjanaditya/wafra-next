import { useId } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { FY, GATES, SCENARIOS, type ScenarioId } from '../../../data/deck';
import { useChartColors, ChartTooltipCard } from '../theme';
import { useFmt } from '../../ui/useFmt';
import { useT, useTpl } from '../../../i18n';

type TP = TooltipProps<number, string>;

/** Revenue vs opex-plus-impairment bars; data morphs between scenarios. */
export function ScenarioBars({ scenario }: { scenario: ScenarioId }) {
  const c = useChartColors();
  const f = useFmt();
  const t = useT();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const s = SCENARIOS[scenario];
  const data = FY.map((fy, i) => ({ fy, revenue: s.revenue[i], cost: s.opexImpairment[i] }));

  const Tip = ({ active, payload, label }: TP) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload as (typeof data)[number];
    return (
      <ChartTooltipCard
        title={label}
        rows={[
          { label: t.cockpit.scenario.revenue, value: f.sarM(row.revenue), color: c.gold },
          { label: t.cockpit.scenario.cost, value: f.sarM(row.cost), color: c.brand },
        ]}
        src="teamModel"
      />
    );
  };

  return (
    <div dir="ltr" className="h-[15rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={3} barCategoryGap="24%" margin={{ top: 12, right: 6, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={`rev-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.gold} stopOpacity={0.95} />
              <stop offset="100%" stopColor={c.gold} stopOpacity={0.45} />
            </linearGradient>
            <linearGradient id={`cost-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.brand} stopOpacity={0.85} />
              <stop offset="100%" stopColor={c['brand-deep']} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="fy" tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 350]} ticks={[0, 100, 200, 300]} tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip cursor={{ fill: c.alpha('line', 0.05) }} content={<Tip />} />
          <Bar dataKey="revenue" fill={`url(#rev-${uid})`} radius={[6, 6, 0, 0]} isAnimationActive={!reduce} animationDuration={650} animationEasing="ease-out" />
          <Bar dataKey="cost" fill={`url(#cost-${uid})`} radius={[6, 6, 0, 0]} isAnimationActive={!reduce} animationDuration={650} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Cumulative net profit J-curve with trough marker and gate exposure markers (SAR 61m, 110m, 136m). */
export function JCurve({ scenario }: { scenario: ScenarioId }) {
  const c = useChartColors();
  const f = useFmt();
  const t = useT();
  const tp = useTpl();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const sel = SCENARIOS[scenario].cumulative;
  const others = (['downside', 'base', 'upside'] as ScenarioId[]).filter((x) => x !== scenario);
  const data = FY.map((fy, i) => ({
    fy,
    value: sel[i],
    downside: SCENARIOS.downside.cumulative[i],
    base: SCENARIOS.base.cumulative[i],
    upside: SCENARIOS.upside.cumulative[i],
  }));
  let troughIdx = 0;
  sel.forEach((v, i) => {
    if (v < sel[troughIdx]) troughIdx = i;
  });

  const Tip = ({ active, payload, label }: TP) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload as (typeof data)[number];
    return (
      <ChartTooltipCard
        title={label}
        rows={[
          { label: `${t.cockpit.scenario.cumulative} · ${t.cockpit.scenario.options[scenario]}`, value: f.paren(row.value), color: c.gold },
          ...others.map((o) => ({ label: t.cockpit.scenario.options[o], value: f.paren(row[o]), color: c.alpha('muted', 0.7) })),
        ]}
        src="teamModel"
      />
    );
  };

  return (
    <div dir="ltr" className="h-[15rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 78, bottom: 4, left: -12 }}>
          <defs>
            <linearGradient id={`j-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.brand} stopOpacity={0.05} />
              <stop offset="100%" stopColor={c.brand} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="fy" tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[-185, 0]}
            ticks={[-150, -100, -50, 0]}
            tickFormatter={(v: number) => f.paren(v)}
            tick={{ fill: c.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip cursor={{ stroke: c.alpha('line', 0.2) }} content={<Tip />} />
          {GATES.map((g, i) => (
            <ReferenceLine
              key={g.id}
              y={-g.exposure}
              stroke={c.alpha('gold', 0.55)}
              strokeDasharray="3 5"
              label={{ value: tp(t.cockpit.scenario.gateLine, { n: i + 1, v: f.sarM(g.exposure) }), position: 'right', fill: c.gold, fontSize: 10, fontWeight: 600 }}
            />
          ))}
          {others.map((o) => (
            <Line key={o} dataKey={o} type="monotone" stroke={c.alpha('muted', 0.45)} strokeWidth={1.25} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          ))}
          <Area
            dataKey="value"
            type="monotone"
            stroke={c.gold}
            strokeWidth={2.5}
            fill={`url(#j-${uid})`}
            dot={{ r: 3, fill: c.gold, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: c.gold, stroke: c.bg, strokeWidth: 2 }}
            isAnimationActive={!reduce}
            animationDuration={700}
            animationEasing="ease-out"
          />
          <ReferenceDot
            x={FY[troughIdx]}
            y={sel[troughIdx]}
            r={6}
            fill={c.stop}
            stroke={c.bg}
            strokeWidth={2}
            label={{ value: `${tp(t.cockpit.scenario.trough, { fy: FY[troughIdx] })} ${f.paren(sel[troughIdx])}`, position: 'bottom', fill: c.stop, fontSize: 10, fontWeight: 700, offset: 10 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
