import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RUN_COST } from '../../../data/deck';
import { ChartTooltipCard, useChartColors } from '../theme';

interface TipProps {
  active?: boolean;
  payload?: { value: number; payload: { fy: string; v: number } }[];
  seriesLabel: string;
  format: (v: number) => string;
}

function RunTip({ active, payload, seriesLabel, format }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <ChartTooltipCard title={p.fy} rows={[{ label: seriesLabel, value: format(p.v) }]} src="teamModel" />;
}

/** Build-and-run cost bars, FY27 to FY31 (time axis stays left-to-right). */
export function RunCostChart({ label, format, height = 190 }: { label: string; format: (v: number) => string; height?: number }) {
  const c = useChartColors();
  const gid = `run-${useId().replace(/:/g, '')}`;
  const data = RUN_COST.years.map((fy, i) => ({ fy, v: RUN_COST.values[i] }));
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 6, left: -14, bottom: 0 }} barCategoryGap="26%">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c.gold} stopOpacity={0.95} />
              <stop offset="0.55" stopColor={c.brand} stopOpacity={0.85} />
              <stop offset="1" stopColor={c['brand-deep']} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="fy" tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={[0, 60]} ticks={[0, 20, 40, 60]} />
          <Tooltip cursor={{ fill: c.alpha('line', 0.05) }} content={<RunTip seriesLabel={label} format={format} />} />
          <Bar dataKey="v" fill={`url(#${gid})`} radius={[8, 8, 3, 3]} animationDuration={900} animationEasing="ease-out">
            <LabelList dataKey="v" position="top" fill={c.text} fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
