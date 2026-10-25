import { useEffect, useRef, useState, type ComponentType } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  Coins,
  LayoutDashboard,
  Milestone,
  MousePointerClick,
  PieChart,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  type LucideProps,
} from 'lucide-react';
import { useApp } from '../../store';
import { useLang, useT } from '../../i18n';
import { BRAND } from '../../config/illustrative';
import { HEADLINE, MARKET, type SourceId } from '../../data/deck';
import { cn } from '../../lib/cn';
import { Particles } from '../../components/fx/Particles';
import { Magnetic } from '../../components/fx/Magnetic';
import { Tilt } from '../../components/fx/Tilt';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { useFxEnabled } from '../../components/fx/hooks';
import { Button } from '../../components/ui/Button';
import { CountUp } from '../../components/ui/CountUp';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { useFmt } from '../../components/ui/useFmt';
import { Monogram } from '../../components/shell/TopNav';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Split-text headline: words rise in, then a slow sand-gold shimmer sweeps the whole line set. */
function Headline() {
  const t = useT();
  const reduce = useReducedMotion();
  const [settled, setSettled] = useState(!!reduce);
  // Fallback in case the language changes mid-reveal and the last word never reports completion.
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(true), 2800);
    return () => window.clearTimeout(id);
  }, []);
  const lines = t.story.headline;
  const total = lines.reduce((n, l) => n + l.split(' ').length, 0);
  let wi = 0;
  return (
    <h1
      aria-label={t.story.headlineAria}
      className={cn(
        'mt-5 font-display text-[length:clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.02em] rtl:text-[length:clamp(2.2rem,4.3vw,3.9rem)] rtl:leading-[1.32]',
        settled && 'story-shimmer',
      )}
    >
      {lines.map((line, li) => (
        <span key={li} aria-hidden className="block">
          {settled
            ? line
            : line.split(' ').map((word, i, arr) => {
                const idx = wi++;
                return (
                  <span key={i}>
                    <motion.span
                      className="inline-block"
                      initial={{ y: '0.55em', opacity: 0 }}
                      animate={{ y: '0em', opacity: 1 }}
                      transition={{ delay: 0.12 + idx * 0.055, duration: 0.75, ease: EASE }}
                      onAnimationComplete={idx === total - 1 ? () => setSettled(true) : undefined}
                    >
                      {word}
                    </motion.span>
                    {i < arr.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
        </span>
      ))}
    </h1>
  );
}

type Icon = ComponentType<LucideProps>;
interface KpiDef {
  icon: Icon;
  value: number;
  from?: number;
  format: (v: number) => string;
  src: SourceId;
  caption: string;
}

function KpiCard({ k, i }: { k: KpiDef; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 + i * 0.05, duration: 0.6, ease: EASE }}
      className="h-full min-w-0"
    >
      <Magnetic className="h-full w-full" innerClassName="h-full w-full" strength={12} radius={90}>
        <Tilt className="h-full w-full" innerClassName="h-full" max={8} glareClassName="rounded-card">
          <SpotlightCard border="gold" className="group h-full min-h-[132px] p-4">
            <div className="relative z-[2] flex items-start justify-between gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand/[0.12] text-brand">
                <k.icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                <SourceChip src={k.src} />
              </span>
            </div>
            <div className="relative z-[2] mt-3 font-display text-[1.65rem] font-semibold leading-none tracking-tight">
              <Fig src={k.src}>
                <CountUp value={k.value} from={k.from ?? 0} format={k.format} duration={1.6} />
              </Fig>
            </div>
            <div className="relative z-[2] mt-2 text-caption text-muted">{k.caption}</div>
          </SpotlightCard>
        </Tilt>
      </Magnetic>
    </motion.div>
  );
}

function KpiRow() {
  const t = useT();
  const f = useFmt();
  const kpis: KpiDef[] = [
    { icon: Users, value: MARKET.saudis2034Short, format: (v) => f.mill(v, 2), src: 'gastatPop', caption: t.common.kpi.saudis },
    { icon: PieChart, value: HEADLINE.tamHeadline, format: (v) => f.sarBn(v, 1), src: 'teamMarket', caption: t.common.kpi.tam },
    { icon: TrendingUp, value: HEADLINE.revenue31, format: (v) => f.sarM(v), src: 'teamModel', caption: t.common.kpi.revenue31 },
    { icon: Coins, value: HEADLINE.netProfit31, format: (v) => f.sarM(v), src: 'teamModel', caption: t.common.kpi.netProfit31 },
    {
      icon: Milestone,
      value: Number(HEADLINE.opBreakEven.replace('FY', '')),
      from: 27,
      format: (v) => f.fy(`FY${Math.round(v)}`),
      src: 'teamModel',
      caption: t.common.kpi.opBE,
    },
    { icon: ShieldCheck, value: HEADLINE.gate1, format: (v) => f.sarM(v), src: 'teamGates', caption: t.common.kpi.gate1 },
  ];
  return (
    <div aria-label={t.story.kpiAria} role="list" className="mx-auto mt-6 grid w-full max-w-shell grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-6 xl:grid-cols-6">
      {kpis.map((k, i) => (
        <div role="listitem" key={k.caption} className="h-full min-w-0">
          <KpiCard k={k} i={i} />
        </div>
      ))}
    </div>
  );
}

export function Hero({ onScrollStory }: { onScrollStory: () => void }) {
  const t = useT();
  const lang = useLang();
  const setArea = useApp((s) => s.setArea);
  const reduce = useReducedMotion();
  const fx = useFxEnabled();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yVisual = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const oText = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);

  return (
    <section
      ref={ref}
      className="story-snap relative flex min-h-[100svh] flex-col overflow-hidden pb-8 pt-[86px]"
    >
      <div aria-hidden className="sadu pointer-events-none absolute inset-x-0 bottom-0 h-4" />
      <div className="mx-auto grid w-full max-w-shell flex-1 items-center gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]">
        <motion.div style={reduce ? undefined : { y: yText, opacity: oText }} className="relative z-[2] order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/[0.04] py-1 pe-3 ps-1 text-[12px]"
          >
            <Monogram size={22} />
            <span className="font-semibold text-ink">{BRAND[lang]}</span>
            <span className="h-3 w-px bg-line/20" aria-hidden />
            <span className="text-muted">{t.story.eyebrow}</span>
          </motion.div>

          <Headline />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6, ease: EASE }}
            className="mt-5 max-w-xl text-[1.125rem] leading-relaxed text-muted"
          >
            {t.story.subline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Button
              variant="primary"
              size="lg"
              magnetic
              cursor="open"
              icon={<Smartphone className="h-4 w-4" strokeWidth={1.5} />}
              iconEnd={<ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
              onClick={() => setArea('app')}
            >
              {t.story.ctaApp}
            </Button>
            <Button
              variant="outline"
              size="lg"
              magnetic
              cursor="open"
              icon={<LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />}
              onClick={() => setArea('cockpit')}
              className="bg-line/[0.03] backdrop-blur"
            >
              {t.story.ctaCockpit}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted"
          >
            <span className="inline-flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden />
              {t.story.hoverHint}
            </span>
            <button type="button" onClick={onScrollStory} className="inline-flex items-center gap-1.5 rounded-full transition-colors hover:text-ink">
              <ArrowDown className="story-bob h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              {t.story.scrollHint}
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          style={reduce ? undefined : { y: yVisual }}
          className="relative order-1 mx-auto aspect-square w-full max-w-[min(300px,40vh)] lg:order-2 lg:max-w-[min(520px,56vh)]"
        >
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE }}
            className="story-halo absolute -inset-[12%] rounded-full"
          />
          <Particles label={t.story.particlesAria} className="h-full w-full" />
          {fx && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="pointer-events-none absolute inset-x-0 -bottom-1 flex justify-center"
            >
              <span className="rounded-full border border-line/10 bg-bg/40 px-3 py-1 text-[11px] text-muted backdrop-blur">{t.story.particlesHint}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      <KpiRow />
    </section>
  );
}
