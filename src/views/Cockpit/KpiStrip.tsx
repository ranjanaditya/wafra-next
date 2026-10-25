import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { HEADLINE } from '../../data/deck';
import { useT, useTpl } from '../../i18n';
import { useFmt } from '../../components/ui/useFmt';
import { CountUp } from '../../components/ui/CountUp';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Magnetic } from '../../components/fx/Magnetic';
import { Tilt } from '../../components/fx/Tilt';
import { EASE } from './shared';

function Tile({ value, caption, extra, gold, i }: { value: ReactNode; caption: ReactNode; extra?: ReactNode; gold?: boolean; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease: EASE }}
      className="h-full"
    >
      <Magnetic strength={6} radius={60} className="h-full w-full" innerClassName="h-full">
        <Tilt max={6} className="h-full w-full" innerClassName="h-full rounded-card" glareClassName="rounded-card">
          <SpotlightCard border={gold ? 'gold' : 'none'} className="flex h-full flex-col justify-between gap-3 p-4">
            <div className="font-display text-[clamp(1.05rem,1.45vw,1.4rem)] font-semibold leading-tight tracking-tight rtl:text-[clamp(0.95rem,1.15vw,1.2rem)]">{value}</div>
            <div className="flex flex-col items-start gap-1.5">
              <div className="min-w-0 text-xs leading-snug text-muted">
                {caption}
                {extra && <div className="mt-0.5 text-ink/80">{extra}</div>}
              </div>
              <SourceChip src="teamModel" />
            </div>
          </SpotlightCard>
        </Tilt>
      </Magnetic>
    </motion.div>
  );
}

/** a. KPI strip: count-up figures with source chips (team model, base case). */
export function KpiStrip() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const k = t.common.kpi;
  return (
    <section aria-label={t.cockpit.kpiAria} className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      <Tile
        i={0}
        value={
          <Fig src="teamModel" as="div" className="flex flex-col gap-0.5 no-underline">
            <span className="flex items-baseline gap-1.5">
              <CountUp value={HEADLINE.approved31} format={(v) => f.mill(v, 2)} />
              <span className="text-xs font-medium text-muted">{t.cockpit.kpi.approved}</span>
            </span>
            <span className="flex items-baseline gap-1.5 text-ink/85">
              <CountUp value={HEADLINE.active31} format={(v) => f.mill(v, 2)} />
              <span className="text-xs font-medium text-muted">{t.cockpit.kpi.active}</span>
            </span>
          </Fig>
        }
        caption={k.approvedActive}
      />
      <Tile
        i={1}
        gold
        value={
          <Fig src="teamModel">
            <CountUp value={HEADLINE.revenue31} format={(v) => f.sarM(Math.round(v))} />
          </Fig>
        }
        caption={k.revenue31}
      />
      <Tile
        i={2}
        gold
        value={
          <Fig src="teamModel">
            <CountUp value={HEADLINE.netProfit31} format={(v) => f.sarM(Math.round(v))} />
          </Fig>
        }
        caption={k.netProfit31}
      />
      <Tile
        i={3}
        value={
          <Fig src="teamModel">
            <motion.span initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.3 }}>
              {f.fy(HEADLINE.opBreakEven)}
            </motion.span>
          </Fig>
        }
        caption={k.opBE}
      />
      <Tile
        i={4}
        value={
          <Fig src="teamModel">
            <CountUp value={HEADLINE.peakInvestment} format={(v) => f.sarM(Math.round(v))} />
          </Fig>
        }
        caption={k.peak}
      />
      <Tile
        i={5}
        value={
          <Fig src="teamModel">
            <CountUp value={HEADLINE.cet1Consumed31} format={(v) => f.sarM(Math.round(v))} />
          </Fig>
        }
        caption={k.cet1}
      />
      <Tile
        i={6}
        value={
          <Fig src="teamModel">
            <CountUp value={HEADLINE.costToIncome31} format={(v) => f.pct(v, 1)} />
          </Fig>
        }
        caption={k.cti}
        extra={tp(k.ctiVs, { v: f.pct(HEADLINE.costToIncomeStatusQuo31, 1) })}
      />
    </section>
  );
}
