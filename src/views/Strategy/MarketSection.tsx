import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { HEADLINE, MARKET, TAM_SAM_BY_ARPU, WAFRA, DEMAND } from '../../data/deck';
import { useT } from '../../i18n';
import { useFmt } from '../../components/ui/useFmt';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Segmented } from '../../components/ui/Controls';
import { CountUp } from '../../components/ui/CountUp';
import { Funnel, type FunnelStage } from '../../components/charts/strategy/Funnel';
import { cn } from '../../lib/cn';
import { CardHead, Item, Rich, SecHead, Stagger } from './ui';

type ArpuKey = '350' | '500' | '650';
const ARPU_KEYS: ArpuKey[] = ['350', '500', '650'];

export function MarketSection() {
  const t = useT().strategy.market;
  const f = useFmt();
  const [arpu, setArpu] = useState<ArpuKey>('500');
  const [active, setActive] = useState('som');
  const arpuVal = Number(arpu) as 350 | 500 | 650;
  const range = TAM_SAM_BY_ARPU[arpuVal];
  const col = ARPU_KEYS.indexOf(arpu);

  // Decorative funnel widths (no axis): TAM and SAM bars respond gently to the revenue-per-customer toggle.
  const tamW = 72 + (range.tam - TAM_SAM_BY_ARPU[500].tam) * 12;
  const samW = 54 + (range.sam - TAM_SAM_BY_ARPU[500].sam) * 18;

  const F = {
    pop: <Fig src="gastatPop">{f.int(MARKET.saudis2034)}</Fig>,
    share: <Fig src="gastatPop">{f.pct(MARKET.shareOfSaudis, 1)}</Fig>,
    all: <Fig src="gastatPop">{f.int(MARKET.allSaudis)}</Fig>,
    servPct: <Fig src="teamMarket">{f.pct(MARKET.serviceablePct, 0)}</Fig>,
    serv: <Fig src="teamMarket">{f.mill(MARKET.serviceable)}</Fig>,
    internet: <Fig src="gastatIct">{f.pct(DEMAND.internetUse, 1)}</Fig>,
    arpu: <Fig src="teamMarket">{f.sar(arpuVal)}</Fig>,
    low: <Fig src="teamMarket">{f.sarBn(MARKET.tam26.low, 2)}</Fig>,
    high: <Fig src="teamMarket">{f.sarBn(MARKET.tam26.high, 2)}</Fig>,
    employed: <Fig src="teamMarket">{f.mill(MARKET.employedCore)}</Fig>,
    ratio: <Fig src="gastatLfs">{f.pct(MARKET.employmentRatio, 1)}</Fig>,
    active: <Fig src="teamModel">{f.mill(HEADLINE.active31)}</Fig>,
    shareTam: <Fig src="teamModel">{f.pct(MARKET.somShareTam, 1)}</Fig>,
    shareSam: <Fig src="teamModel">{f.pct(MARKET.somShareSam, 1)}</Fig>,
    tam31: <Fig src="teamMarket">{f.sarBn(MARKET.tam31, 1)}</Fig>,
    sam31: <Fig src="teamMarket">{f.sarBn(MARKET.sam31, 1)}</Fig>,
    growth: <Fig src="samaArabNews">{f.pct(MARKET.growth.base, 1)}</Fig>,
  };

  const stages: FunnelStage[] = [
    {
      id: 'population',
      label: t.stages.population,
      value: (
        <Fig src="gastatPop">
          <CountUp value={MARKET.saudis2034} format={(v) => f.int(Math.round(v))} />
        </Fig>
      ),
      width: 100,
      tone: 'neutral',
      detail: <Rich text={t.details.population} values={{ share: F.share, all: F.all }} />,
    },
    {
      id: 'serviceable',
      label: t.stages.serviceable,
      op: <Rich text={t.ops.serviceable} values={{ pct: F.servPct }} />,
      value: F.serv,
      width: 88,
      tone: 'neutral',
      detail: <Rich text={t.details.serviceable} values={{ pct: F.servPct, internet: F.internet }} />,
    },
    {
      id: 'tam',
      label: t.stages.tam,
      op: <Rich text={t.ops.tam} values={{ arpu: F.arpu }} />,
      value: (
        <Fig src="teamMarket">
          <CountUp value={range.tam} format={(v) => f.sarBn(v, 2)} />
        </Fig>
      ),
      badge:
        arpu === '500' ? (
          <span className="chip border-gold/30 bg-gold/10 text-gold">
            <Rich text={t.headline} values={{ v: <Fig src="teamMarket">{f.sarBn(MARKET.tam26.headline, 1)}</Fig> }} />
          </span>
        ) : undefined,
      width: tamW,
      tone: 'gold',
      detail: <Rich text={t.details.tam} values={{ serviceable: F.serv, arpu: F.arpu, low: F.low, high: F.high }} />,
    },
    {
      id: 'sam',
      label: t.stages.sam,
      op: <Rich text={t.ops.sam} values={{ employed: F.employed, ratio: F.ratio }} />,
      value: (
        <Fig src="teamMarket">
          <CountUp value={range.sam} format={(v) => f.sarBn(v, 2)} />
        </Fig>
      ),
      width: samW,
      tone: 'gold',
      detail: <Rich text={t.details.sam} values={{ employed: F.employed, ratio: F.ratio }} />,
    },
    {
      id: 'som',
      label: t.stages.som,
      op: t.ops.som,
      value: (
        <Fig src="teamModel" className="text-gradient-brand">
          <CountUp value={MARKET.som31} format={(v) => f.sarM(Math.round(v))} />
        </Fig>
      ),
      width: 30,
      tone: 'brand',
      detail: (
        <Rich
          text={t.details.som}
          values={{ active: F.active, shareTam: F.shareTam, tam31: F.tam31, shareSam: F.shareSam, sam31: F.sam31 }}
        />
      ),
    },
  ];

  const rows: { label: string; cells: ReactNode[] }[] = [
    {
      label: t.rows.arpu,
      cells: ARPU_KEYS.map((k) => (
        <Fig key={k} src="teamMarket">
          {f.num(Number(k))}
        </Fig>
      )),
    },
    {
      label: t.rows.tam,
      cells: ARPU_KEYS.map((k) => (
        <Fig key={k} src="teamMarket">
          {f.num(TAM_SAM_BY_ARPU[Number(k) as 350 | 500 | 650].tam, 2)}
        </Fig>
      )),
    },
    {
      label: t.rows.sam,
      cells: ARPU_KEYS.map((k) => (
        <Fig key={k} src="teamMarket">
          {f.num(TAM_SAM_BY_ARPU[Number(k) as 350 | 500 | 650].sam, 2)}
        </Fig>
      )),
    },
    {
      label: t.rows.growth,
      cells: [MARKET.growth.low, MARKET.growth.base, MARKET.growth.high].map((g, i) => (
        <Fig key={i} src="teamMarket">
          {f.pct(g, 1)}
        </Fig>
      )),
    },
  ];

  return (
    <section id="strategy-market" aria-label={t.eyebrow} className="scroll-mt-36">
      <SecHead
        eyebrow={t.eyebrow}
        title={
          <Rich
            text={t.title}
            values={{
              tam: <Fig src="teamMarket">{f.sarBn(MARKET.tam26.headline, 1)}</Fig>,
              tam31: F.tam31,
            }}
          />
        }
        subtitle={t.subtitle}
      />
      <Stagger className="grid gap-4 lg:grid-cols-12">
        <Item className="lg:col-span-7">
          <SpotlightCard border="gold" className="h-full p-5">
            <CardHead title={t.funnelTitle} right={<SourceChip src="teamMarket" />} />
            <Funnel stages={stages} active={active} onActive={setActive} hint={t.funnelHint} />
          </SpotlightCard>
        </Item>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Item>
            <SpotlightCard className="p-5">
              <CardHead title={t.arpuTitle} hint={t.arpuHint} right={<SourceChip src="teamMarket" />} />
              <Segmented
                value={arpu}
                onChange={(v) => {
                  setArpu(v);
                  setActive('tam');
                }}
                ariaLabel={t.arpuAria}
                layoutId="strategy-arpu"
                className="w-full justify-between"
                options={ARPU_KEYS.map((k) => ({ value: k, label: <span className="num">{f.sar(Number(k))}</span> }))}
              />
              <table className="mt-4 w-full border-separate border-spacing-0 text-[0.8125rem]">
                <caption className="mb-2 text-start text-[0.75rem] text-muted">{t.tableTitle}</caption>
                <thead>
                  <tr className="text-[0.6875rem] uppercase tracking-wide text-muted">
                    <th className="pb-2 text-start font-medium" />
                    {(['low', 'base', 'high'] as const).map((c, i) => (
                      <th key={c} className={cn('pb-2 text-end font-medium', i === col && 'text-gold')}>
                        {t.cols[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={r.label}>
                      <th scope="row" className="border-t border-line/10 py-2 pe-2 text-start text-[0.75rem] font-normal text-muted">
                        {r.label}
                      </th>
                      {r.cells.map((c, i) => (
                        <td
                          key={i}
                          className={cn(
                            'relative border-t border-line/10 py-2 text-end transition-colors',
                            i === col ? 'font-semibold text-ink' : 'text-ink/70',
                          )}
                        >
                          {i === col && (
                            <motion.span
                              layoutId={`strategy-arpu-col-${ri}`}
                              aria-hidden
                              className="absolute inset-x-0.5 inset-y-0.5 rounded-md bg-gold/10"
                              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                            />
                          )}
                          <span className="relative pe-1">{c}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[0.75rem] leading-relaxed text-muted">
                <Rich text={t.growthNote} values={{ g: F.growth, tam31: F.tam31, sam31: F.sam31 }} />
              </p>
            </SpotlightCard>
          </Item>

          <Item className="flex-1">
            <SpotlightCard className="h-full p-5">
              <CardHead title={t.readTitle} />
              <ul className="space-y-2.5 text-[0.8125rem] leading-relaxed text-ink/85">
                <li className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  <span>
                    <Rich
                      text={t.read.growth}
                      values={{
                        g: F.growth,
                        hi: <Fig src="samaArabNews">{f.pct(MARKET.growth.high, 1)}</Fig>,
                        lo: <Fig src="teamMarket">{f.pct(MARKET.growth.low, 1)}</Fig>,
                      }}
                    />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  <span>
                    <Rich
                      text={t.read.sanity}
                      values={{
                        arpu: <Fig src="teamMarket">{f.sar(MARKET.arpu.base)}</Fig>,
                        share: <Fig src="caseDeck">{f.pct(WAFRA.arpuShareOfBlended, 0)}</Fig>,
                        blended: <Fig src="caseDeck">{f.sar(WAFRA.blendedRevPerCustomer)}</Fig>,
                      }}
                    />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  <span>
                    <Rich
                      text={t.read.scale}
                      values={{
                        assetShare: <Fig src="caseDeck">{f.pct(WAFRA.assetShare, 2)}</Fig>,
                        implied: <Fig src="caseDeck">{f.sarBn(WAFRA.assetsImplied, 1)}</Fig>,
                        sector: <Fig src="caseDeck">{f.sarBn(WAFRA.sectorAssets, 0)}</Fig>,
                      }}
                    />
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  <span>
                    <Rich
                      text={t.read.volume}
                      values={{
                        base: <Fig src="teamModel">{f.pct(MARKET.baseVolumeShare, 1)}</Fig>,
                        x: <Fig src="teamModel">{f.num(MARKET.baseVsCustomers, 1)}</Fig>,
                        k: <Fig src="caseDeck">{f.num(MARKET.wafraCustomers)}</Fig>,
                        down: <Fig src="teamModel">{f.pct(MARKET.downsideShare, 1)}</Fig>,
                        up: <Fig src="teamModel">{f.pct(MARKET.upsideShare, 1)}</Fig>,
                      }}
                    />
                  </span>
                </li>
              </ul>
              <p className="mt-3 border-t border-line/10 pt-3 text-[0.6875rem] text-muted">{t.caveat}</p>
            </SpotlightCard>
          </Item>
        </div>
      </Stagger>
    </section>
  );
}
