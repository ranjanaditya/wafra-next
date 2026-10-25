import { useId } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { FY, GTM } from '../../../data/deck';
import { useChartColors, ChartTooltipCard } from '../theme';
import { useFmt } from '../../ui/useFmt';
import { useT } from '../../../i18n';

type Key = 'approved' | 'active' | 'primary';

/** Approved, active and primary-bank customers (m, year-end FY27 to FY31). */
export function PathChart() {
  const c = useChartColors();
  const f = useFmt();
  const t = useT();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const data = FY.map((fy, i) => ({ fy, approved: GTM.approved[i], active: GTM.active[i], primary: GTM.primary[i] }));
  const series: { key: Key; color: string }[] = [
    { key: 'approved', color: c.gold },
    { key: 'active', color: c.brand },
    { key: 'primary', color: c.pass },
  ];

  const Tip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload as (typeof data)[number];
    return (
      <ChartTooltipCard
        title={label}
        rows={series.map((s) => ({ label: t.cockpit.path.series[s.key], value: f.mill(row[s.key], 2), color: s.color }))}
        src="teamModel"
      />
    );
  };

  const endLabel = (color: string) =>
    function EndLabel(props: { x?: number | string; y?: number | string; value?: number | string; index?: number }) {
      if (props.index !== FY.length - 1 || props.value === undefined) return null;
      return (
        <text x={Number(props.x) + 8} y={Number(props.y) + 4} fill={color} fontSize={11} fontWeight={700}>
          {f.mill(Number(props.value), 2)}
        </text>
      );
    };

  return (
    <div dir="ltr" className="h-[15rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 48, bottom: 0, left: -12 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`p-${s.key}-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="fy" tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 0.7]} ticks={[0, 0.2, 0.4, 0.6]} tickFormatter={(v: number) => f.mill(v, 1)} tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip cursor={{ stroke: c.alpha('line', 0.2) }} content={<Tip />} />
          {series.map((s, i) => (
            <Area
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={s.color}
              strokeWidth={2.25}
              fill={`url(#p-${s.key}-${uid})`}
              dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 4.5, stroke: c.bg, strokeWidth: 2 }}
              isAnimationActive={!reduce}
              animationDuration={900}
              animationBegin={i * 120}
            >
              <LabelList dataKey={s.key} content={endLabel(s.color)} />
            </Area>
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
