import { motion } from 'framer-motion';
import { Flag, Rocket, Sprout } from 'lucide-react';
import { GTM } from '../../data/deck';
import { useT, useTpl } from '../../i18n';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { SectionHeader } from '../../components/ui/Controls';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { useFmt } from '../../components/ui/useFmt';
import { useChartColors } from '../../components/charts/theme';
import { PathChart } from '../../components/charts/cockpit/PathChart';
import { EASE, LegendDot } from './shared';

/** i (left). Customer path chart. */
export function PathPanel() {
  const t = useT();
  const c = useChartColors();
  const p = t.cockpit.path;
  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <SectionHeader eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} right={<SourceChip src="teamModel" />} />
      <div className="mt-2 flex flex-wrap gap-3">
        <LegendDot color={c.gold} label={p.series.approved} />
        <LegendDot color={c.brand} label={p.series.active} />
        <LegendDot color={c.pass} label={p.series.primary} />
      </div>
      <div className="mt-3 flex-1">
        <PathChart />
      </div>
      <p className="mt-2 text-xs text-muted">{p.primaryNote}</p>
    </SpotlightCard>
  );
}

/** i (right). Go-to-market targets and the three waves. */
export function GtmPanel() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const g = t.cockpit.gtm;
  const T = GTM.targets;
  const [a30, b30] = (T.activation30d.base.match(/\d+/g) ?? ['55', '65']).map(Number);
  const range = (a: string, b: string) => tp(g.rangeTo, { a, b });
  const rows = [
    { key: 'activation30d' as const, value: range(f.int(a30), f.pct(b30, 0)), note: g.estimate },
    { key: 'activeShare' as const, value: f.pct(T.activeShare.base, 0), note: range(f.int(T.activeShare.range[0]), f.pct(T.activeShare.range[1], 0)) },
    { key: 'retention12m' as const, value: f.pct(T.retention12m.base, 0), note: range(f.int(T.retention12m.range[0]), f.pct(T.retention12m.range[1], 0)) },
    { key: 'primaryShare' as const, value: f.pct(T.primaryShare.base, 0), note: range(f.int(T.primaryShare.range[0]), f.pct(T.primaryShare.range[1], 0)) },
    { key: 'cac' as const, value: f.sar(T.cac.base), note: range(f.sar(T.cac.range[0]), f.sar(T.cac.range[1])) },
    { key: 'costToServe' as const, value: f.sar(T.costToServe.base), note: range(f.sar(T.costToServe.range[0]), f.sar(T.costToServe.range[1])) },
  ];
  const waveIcon = { prove: Flag, scale: Rocket, deepen: Sprout } as const;

  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <SectionHeader eyebrow={g.eyebrow} title={g.title} right={<SourceChip src="report" />} />
      <ul className="mt-3 divide-y divide-line/[0.07]">
        {rows.map((r, i) => (
          <motion.li
            key={r.key}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: EASE }}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="min-w-0 text-[0.8125rem] text-ink/85">{g.rows[r.key]}</span>
            <span className="shrink-0 text-end">
              <span className="block text-sm font-semibold">
                <Fig src="report">{r.value}</Fig>
              </span>
              <span className="block text-[0.6875rem] text-muted">{r.note}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-4 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">{g.wavesTitle}</div>
      <ol className="mt-2 space-y-2">
        {GTM.waves.map((w, i) => {
          const Icon = waveIcon[w.id];
          return (
            <li key={w.id} className="inner flex items-start gap-3 p-3">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="text-[0.8125rem] font-semibold">
                    {i + 1}. {g.waves[w.id].name} <span className="font-normal text-muted">· {f.fy(w.fy)}</span>
                  </span>
                  <span className="text-xs font-semibold text-gold">
                    <Fig src="teamModel">{tp(g.approvedBy, { v: f.mill(w.approved, 2) })}</Fig>
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-muted">{g.waves[w.id].text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </SpotlightCard>
  );
}
