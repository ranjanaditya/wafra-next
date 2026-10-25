import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { HelpCircle, Info } from 'lucide-react';
import { POOLS, POOL_WEIGHTS } from '../../data/deck';
import { useT } from '../../i18n';
import { useFmt } from '../../components/ui/useFmt';
import { Fig, SourceChip, Tip } from '../../components/ui/Provenance';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { PoolsBars } from '../../components/charts/strategy/PoolsBars';
import { CardHead, EASE, Item, SecHead, Stagger } from './ui';

const WEIGHT_KEYS = ['size', 'growth', 'margin', 'competition', 'regulation', 'fit'] as const;

function WeightsList({ compact }: { compact?: boolean }) {
  const t = useT().strategy.pools;
  const f = useFmt();
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <ul ref={ref} className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      {WEIGHT_KEYS.map((k, i) => (
        <li key={k} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_2.5rem] items-center gap-3">
          <span className="text-[0.75rem] text-ink/85">{t.weights[k]}</span>
          <span className="relative h-1.5 rounded-full bg-line/[0.08]">
            <motion.span
              className="absolute inset-y-0 start-0 rounded-full bg-gold/70"
              initial={{ width: compact ? `${(POOL_WEIGHTS[k] / 25) * 100}%` : '0%' }}
              animate={inView || compact ? { width: `${(POOL_WEIGHTS[k] / 25) * 100}%` } : undefined}
              transition={{ duration: 0.7, delay: i * 0.05, ease: EASE }}
            />
          </span>
          <span className="text-end text-[0.75rem] font-semibold">
            {compact ? <span className="num">{f.pct(POOL_WEIGHTS[k], 0)}</span> : <Fig src="teamScoring">{f.pct(POOL_WEIGHTS[k], 0)}</Fig>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PoolsSection() {
  const t = useT().strategy.pools;
  const f = useFmt();
  const rows = POOLS.map((p, i) => ({
    id: p.id,
    rank: i + 1,
    label: t.items[p.id as keyof typeof t.items],
    role: t.roles[p.role],
    score: p.score,
    lead: p.lead,
    value: <Fig src="teamScoring">{f.num(p.score, 2)}</Fig>,
  }));

  return (
    <section id="strategy-pools" aria-label={t.eyebrow} className="scroll-mt-36">
      <SecHead eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <Stagger className="grid gap-4 lg:grid-cols-12">
        <Item className="lg:col-span-7">
          <SpotlightCard border="gold" className="h-full p-5">
            <CardHead
              title={t.chartTitle}
              hint={t.weightsHint}
              right={
                <>
                  <Tip
                    className="inline-flex"
                    content={
                      <div className="w-60 space-y-2">
                        <div className="font-semibold">{t.weightsTitle}</div>
                        <WeightsList compact />
                        <div className="text-[0.6875rem] text-muted">{t.weightsNote}</div>
                      </div>
                    }
                  >
                    <span data-cursor="explain" className="chip cursor-help gap-1 text-[0.6875rem] text-ink/85">
                      <Info className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                      {t.weightsButton}
                    </span>
                  </Tip>
                  <SourceChip src="teamScoring" />
                </>
              }
            />
            <PoolsBars rows={rows} leadLabel={t.lead} scaleLabel={t.scale} />
          </SpotlightCard>
        </Item>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Item>
            <SpotlightCard className="p-5">
              <CardHead title={t.weightsTitle} hint={t.weightsHint} right={<SourceChip src="teamScoring" />} />
              <WeightsList />
              <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted">{t.weightsNote}</p>
            </SpotlightCard>
          </Item>
          <Item className="flex-1">
            <SpotlightCard className="h-full p-5">
              <CardHead title={t.priorityTitle} />
              <p className="text-[0.8125rem] leading-relaxed text-ink/85">{t.priority}</p>
              <div className="mt-4 rounded-inner border border-gold/25 bg-gold/[0.06] p-3.5">
                <div className="mb-1 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-gold">
                  <HelpCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  {t.hniTitle}
                </div>
                <p className="text-[0.8125rem] leading-relaxed text-ink/85">{t.hni}</p>
              </div>
            </SpotlightCard>
          </Item>
        </div>
      </Stagger>
    </section>
  );
}
