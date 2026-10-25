import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, LayoutDashboard, Scale, Smartphone, Users } from 'lucide-react';
import { useApp } from '../../store';
import { useT, useTpl } from '../../i18n';
import { BBP, BBP_MAX, DEMAND, GROUP_IMPACT, HEADLINE, MARKET, SEGMENTS, WAFRA } from '../../data/deck';
import { cn } from '../../lib/cn';
import { CountUp } from '../../components/ui/CountUp';
import { Fig } from '../../components/ui/Provenance';
import { Button } from '../../components/ui/Button';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { useFmt } from '../../components/ui/useFmt';
import { ConvenienceGap, EASE, GateLocks, GrowthGap, JCurve, MiniRing, Pillars, useApprox } from './visuals';

export const CHAPTER_IDS = ['problem', 'insight', 'recommendation', 'economics', 'ask'] as const;
const VIEW = { once: true, margin: '-80px' } as const;

/** One snap section: text column + visual column, with scroll-linked parallax. */
function Chapter({ index, flip, visual, children }: { index: number; flip?: boolean; visual: ReactNode; children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yVisual = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const yText = useTransform(scrollYProgress, [0, 1], [28, -28]);
  const yNum = useTransform(scrollYProgress, [0, 1], [140, -140]);
  const id = CHAPTER_IDS[index];
  return (
    <section
      ref={ref}
      id={`story-${id}`}
      data-chapter={index}
      aria-labelledby={`story-${id}-title`}
      className="story-snap relative flex min-h-[92svh] items-center overflow-hidden py-20"
    >
      <motion.div
        aria-hidden
        style={reduce ? undefined : { y: yNum }}
        className={cn(
          'story-numeral pointer-events-none absolute top-[12%] select-none font-display text-[length:min(26vw,340px)] font-bold leading-none',
          flip ? 'start-[2%]' : 'end-[2%]',
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </motion.div>
      <div aria-hidden className="sadu pointer-events-none absolute inset-x-0 top-0 h-4" />
      <div className="relative mx-auto grid w-full max-w-shell items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
        <motion.div style={reduce ? undefined : { y: yText }} className={cn('lg:col-span-5', flip && 'lg:order-2')}>
          {children}
        </motion.div>
        <motion.div style={reduce ? undefined : { y: yVisual }} className={cn('lg:col-span-7', flip && 'lg:order-1')}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEW} transition={{ duration: 0.7, ease: EASE }}>
            {visual}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ChapterText({ index, title, body, children }: { index: number; title: string; body: string; children?: ReactNode }) {
  const t = useT();
  const tp = useTpl();
  const id = CHAPTER_IDS[index];
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEW}
        transition={{ duration: 0.5, ease: EASE }}
        className="eyebrow flex items-center gap-2.5"
      >
        <span className="num text-gold">{String(index + 1).padStart(2, '0')}</span>
        <span className="h-px w-8 bg-gradient-to-r from-gold/70 to-transparent rtl:bg-gradient-to-l" aria-hidden />
        <span>{t.story.chapters[index]}</span>
        <span className="sr-only">{tp(t.story.chapterCount, { n: index + 1 })}</span>
      </motion.div>
      <motion.h2
        id={`story-${id}-title`}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEW}
        transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
        className="mt-4 font-display text-[length:clamp(1.9rem,3.1vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] rtl:leading-[1.4]"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEW}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        className="mt-4 text-[15px] leading-relaxed text-muted"
      >
        {body}
      </motion.p>
      {children && <div className="mt-7">{children}</div>}
    </div>
  );
}

function Stat({ value, label, ring, i }: { value: ReactNode; label: ReactNode; ring?: ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW}
      transition={{ duration: 0.55, ease: EASE, delay: 0.15 + i * 0.06 }}
      className="flex items-center gap-4 border-t border-line/10 py-3.5"
    >
      {ring}
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
        <div className="whitespace-nowrap font-display text-[1.85rem] font-semibold leading-none tracking-tight">{value}</div>
        <div className="min-w-[10rem] flex-1 text-[13px] leading-snug text-muted">{label}</div>
      </div>
    </motion.div>
  );
}

const Vs = ({ children }: { children: ReactNode }) => <span className="mx-1.5 text-[0.5em] font-medium text-muted">{children}</span>;

// ───────────────────────── Chapters ─────────────────────────
function Problem() {
  const t = useT();
  const f = useFmt();
  const ap = useApprox();
  const p = t.story.problem;
  return (
    <Chapter index={0} visual={<GrowthGap />}>
      <ChapterText index={0} title={p.title} body={p.body}>
        <Stat
          i={0}
          value={
            <>
              <Fig src="caseDeck">
                <CountUp value={WAFRA.retailGrowth} format={(v) => ap.pct(v)} />
              </Fig>
              <Vs>{p.vs}</Vs>
              <Fig src="caseDeck">
                <CountUp value={WAFRA.smeGrowth} format={(v) => ap.pct(v)} />
              </Fig>
            </>
          }
          label={p.growthLabel}
        />
        <Stat
          i={1}
          value={
            <>
              <Fig src="caseDeck">
                <CountUp value={WAFRA.roe} format={(v) => f.pct(v, 1)} />
              </Fig>
              <Vs>{p.vs}</Vs>
              <Fig src="samaFsr">
                <CountUp value={WAFRA.sectorRoe} format={(v) => f.pct(v, 1)} />
              </Fig>
            </>
          }
          label={p.roeLabel}
        />
        <Stat
          i={2}
          value={
            <Fig src="caseDeck">
              <CountUp value={WAFRA.techSpend} format={(v) => ap.pct(v, 1)} />
            </Fig>
          }
          label={p.techLabel}
        />
      </ChapterText>
    </Chapter>
  );
}

function Insight() {
  const t = useT();
  const f = useFmt();
  const ins = t.story.insight;
  return (
    <Chapter index={1} flip visual={<ConvenienceGap />}>
      <ChapterText index={1} title={ins.title} body={ins.body}>
        <Stat
          i={0}
          ring={<MiniRing value={DEMAND.internetUse} tone="gold" />}
          value={
            <Fig src="gastatIct">
              <CountUp value={DEMAND.internetUse} format={(v) => f.pct(v, 1)} />
            </Fig>
          }
          label={ins.internetLabel}
        />
        <Stat
          i={1}
          ring={<MiniRing value={DEMAND.electronicPayments} tone="brand" />}
          value={
            <Fig src="fsdp">
              <CountUp value={DEMAND.electronicPayments} format={(v) => f.pct(v, 0)} />
            </Fig>
          }
          label={ins.paymentsLabel}
        />
        <Stat
          i={2}
          ring={
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line/10 bg-line/[0.04] text-gold" aria-hidden>
              <Users className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </span>
          }
          value={
            <Fig src="gastatPop">
              <CountUp value={MARKET.saudis2034Short} format={(v) => f.mill(v, 2)} />
            </Fig>
          }
          label={ins.saudisLabel}
        />
      </ChapterText>
    </Chapter>
  );
}

function Recommendation() {
  const t = useT();
  const f = useFmt();
  const tp = useTpl();
  const ap = useApprox();
  const r = t.story.recommendation;
  const hybrid = BBP.find((b) => b.recommended)!;
  return (
    <Chapter index={2} visual={<Pillars />}>
      <ChapterText index={2} title={r.title} body={r.body}>
        <Stat
          i={0}
          value={
            <Fig src="teamMarket">
              <CountUp value={SEGMENTS.targetEmployed} format={(v) => ap.mill(v, 1)} />
            </Fig>
          }
          label={r.targetLabel}
        />
        <Stat
          i={1}
          value={
            <Fig src="caseDeck">
              <CountUp value={WAFRA.branches} format={(v) => f.int(Math.round(v))} />
            </Fig>
          }
          label={r.branchesLabel}
        />
        <Stat
          i={2}
          value={
            <Fig src="teamScoring">
              <CountUp value={hybrid.total} format={(v) => f.int(Math.round(v))} />
              <span className="ms-1.5 text-[0.5em] font-medium text-muted">{tp(r.scoreOf, { max: BBP_MAX })}</span>
            </Fig>
          }
          label={r.scoreLabel}
        />
      </ChapterText>
    </Chapter>
  );
}

function Economics() {
  const t = useT();
  const f = useFmt();
  const e = t.story.economics;
  return (
    <Chapter index={3} flip visual={<JCurve />}>
      <ChapterText index={3} title={e.title} body={e.body}>
        <Stat
          i={0}
          value={
            <>
              <Fig src="teamModel">
                <CountUp value={HEADLINE.approved31} format={(v) => f.mill(v, 2)} />
              </Fig>
              <Vs>/</Vs>
              <Fig src="teamModel">
                <CountUp value={HEADLINE.active31} format={(v) => f.mill(v, 2)} />
              </Fig>
            </>
          }
          label={e.customersLabel}
        />
        <Stat
          i={1}
          value={
            <Fig src="teamModel">
              <CountUp value={HEADLINE.peakInvestment} format={(v) => f.sarM(v)} />
            </Fig>
          }
          label={e.peakLabel}
        />
        <Stat
          i={2}
          value={
            <Fig src="teamModel">
              <CountUp value={GROUP_IMPACT.costToIncomeProForma[2]} format={(v) => f.pct(v, 1)} />
            </Fig>
          }
          label={
            <>
              {e.ctiLabel} · {e.ctiVs}{' '}
              <Fig src="teamModel" className="font-semibold text-ink">
                {f.pct(GROUP_IMPACT.costToIncomeStatusQuo[2], 1)}
              </Fig>{' '}
              {e.ctiStatusQuo}
            </>
          }
        />
      </ChapterText>
    </Chapter>
  );
}

function Ask() {
  const t = useT();
  const setArea = useApp((s) => s.setArea);
  const a = t.story.ask;
  return (
    <Chapter index={4} visual={<GateLocks />}>
      <ChapterText index={4} title={a.title} body={a.body}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
        >
          <SpotlightCard border="gold" className="p-5">
            <div className="relative z-[2]">
              <div className="eyebrow mb-2 flex items-center gap-2 !text-gold">
                <Scale className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                {a.decisionTitle}
              </div>
              <p className="text-[14.5px] leading-relaxed">{a.decisionBody}</p>
            </div>
          </SpotlightCard>
          <div className="mt-6">
            <div className="eyebrow mb-3">{t.story.closing.eyebrow}</div>
            <p className="mb-4 font-display text-[1.15rem] font-medium leading-snug">{t.story.closing.title}</p>
            <div className="flex flex-wrap gap-3">
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
              >
                {t.story.ctaCockpit}
              </Button>
            </div>
          </div>
        </motion.div>
      </ChapterText>
    </Chapter>
  );
}

export function Chapters() {
  return (
    <>
      <Problem />
      <Insight />
      <Recommendation />
      <Economics />
      <Ask />
    </>
  );
}
