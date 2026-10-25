import { Fragment, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ArrowRight, Flag, Gavel, ListChecks, Lock, Rocket, ShieldCheck, type LucideIcon } from 'lucide-react';
import { ASK, FY, GATES, GTM, PLAN_90, STOP_RULE, type GateId } from '../../data/deck';
import { useLang, useT, useTpl } from '../../i18n';
import { useApp } from '../../store';
import { useFmt } from '../../components/ui/useFmt';
import { Fig, SourceChip, Tip } from '../../components/ui/Provenance';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { CardHead, EASE, Item, Rich, SecHead, Stagger } from './ui';

type Metric = (typeof GATES)[number]['metrics'][number];

function useMetricText() {
  const t = useT().strategy.roadmap;
  const f = useFmt();
  /** `plain` renders bare text (for tooltips, where hover chips cannot be reached). */
  return (m: Metric, plain = false): ReactNode => {
    const fig = (s: string) => (plain ? <span className="num font-semibold">{s}</span> : <Fig src="teamGates">{s}</Fig>);
    const v = m.threshold as number;
    switch (m.id) {
      case 'approved':
        return <Rich text={t.metrics.approved} values={{ v: fig(f.mill(v)) }} />;
      case 'activation':
        return <Rich text={t.metrics.activation} values={{ v: fig(f.pct(v, 0)) }} />;
      case 'cac':
        return <Rich text={t.metrics.cac} values={{ v: fig(f.sar(v)) }} />;
      case 'retention':
        return <Rich text={t.metrics.retention} values={{ v: fig(f.pct(v, 0)) }} />;
      case 'cor':
        return <Rich text={t.metrics.cor} values={{ v: fig(f.pct(v, 1)) }} />;
      case 'primary':
        return <Rich text={t.metrics.primary} values={{ v: fig(f.pct(v, 0)) }} />;
      case 'lossNarrowing':
        return t.metrics.lossNarrowing;
    }
  };
}

/** Boundary between year columns k and k+1 in a 5-column grid with 0.5rem gaps. */
const boundary = (k: number) => `calc(${k * 20}% + ${(k * 0.1 - 0.25).toFixed(2)}rem)`;

function Timeline() {
  const t = useT().strategy.roadmap;
  const tpl = useTpl();
  const f = useFmt();
  const lang = useLang();
  const setArea = useApp((s) => s.setArea);
  const metricText = useMetricText();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const textDir = lang === 'ar' ? 'rtl' : 'ltr';

  const waves = [
    { id: 'prove' as const, span: 'col-span-1', n: 1, approved: GTM.waves[0].approved, tone: 'border-brand/35 bg-brand/[0.08]' },
    { id: 'scale' as const, span: 'col-span-2', n: 2, approved: GTM.waves[1].approved, tone: 'border-gold/30 bg-gold/[0.06]' },
    { id: 'deepen' as const, span: 'col-span-2', n: 3, approved: GTM.waves[2].approved, tone: 'border-line/15 bg-line/[0.04]' },
  ];

  return (
    <SpotlightCard className="h-full p-5">
      <CardHead
        title={t.timelineTitle}
        right={
          <>
            <Button
              size="sm"
              variant="secondary"
              cursor="open"
              iconEnd={<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />}
              onClick={() => {
                setArea('cockpit');
                window.scrollTo({ top: 0 });
              }}
            >
              {t.testGates}
            </Button>
            <SourceChip src="teamGates" />
          </>
        }
      />

      <div ref={ref} dir="ltr" className="overflow-x-auto pb-1">
        <div className="relative min-w-[560px]">
          <div className="grid grid-cols-5 gap-2 text-center">
            {FY.map((fy) => (
              <div key={fy} className="num rounded-lg bg-line/[0.04] py-1.5 text-[0.75rem] font-semibold text-muted">
                {fy}
              </div>
            ))}
          </div>

          <div className="relative mt-2 grid grid-cols-5 gap-2">
            {waves.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: EASE }}
                className={cn('rounded-inner border p-3', w.span, w.tone)}
              >
                <div dir={textDir}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-[0.9375rem] font-semibold">{t.waves[w.id].name}</span>
                    <span className="text-[0.6875rem] text-muted">
                      <Rich text={t.wave} values={{ n: w.n }} />
                    </span>
                  </div>
                  <p className="mt-1 text-[0.75rem] leading-snug text-ink/80">{t.waves[w.id].body}</p>
                  <span className="chip mt-2 text-[0.6875rem]">
                    <Rich text={t.waves[w.id].approved} values={{ v: <Fig src="teamModel">{f.mill(w.approved)}</Fig> }} />
                  </span>
                </div>
              </motion.div>
            ))}
            {GATES.map((g, i) => (
              <motion.span
                key={g.id}
                aria-hidden
                className="pointer-events-none absolute -bottom-3 -top-1 w-px border-s border-dashed border-gold/50"
                style={{ left: boundary(i + 1) }}
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : undefined}
                transition={{ delay: 0.45 + i * 0.12, duration: 0.5, ease: EASE }}
              />
            ))}
          </div>

          <div className="relative mt-3 h-[4.5rem]">
            {GATES.map((g, i) => (
              <motion.div
                key={g.id}
                className="absolute top-0"
                style={{ left: boundary(i + 1), x: '-50%' }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={inView ? { opacity: 1, scale: 1 } : undefined}
                transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 300, damping: 18 }}
              >
                <Tip
                  className="flex flex-col items-center text-center"
                  content={
                    <div className="w-60 space-y-1.5" dir={textDir}>
                      <div className="font-semibold">
                        {g.id} · <Rich text={t.gateEnd} values={{ fy: g.fyEnd }} />
                      </div>
                      <div className="text-[0.6875rem] uppercase tracking-wide text-muted">{t.tableIf}</div>
                      <ul className="space-y-1">
                        {g.metrics.map((m) => (
                          <li key={m.id} className="flex gap-1.5 text-[0.75rem]">
                            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                            <span>{metricText(m, true)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  }
                >
                  <span
                    data-cursor="explain"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-elev text-gold shadow-goldglow"
                  >
                    <Lock className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="mt-1 text-[0.75rem] font-semibold">{g.id}</span>
                  <span className="text-[0.6875rem] text-muted">
                    <Fig src="teamGates">{f.sarM(g.exposure)}</Fig>
                    {g.id === 'G3' && <span> {t.peak}</span>}
                  </span>
                </Tip>
              </motion.div>
            ))}
          </div>

          <div className="mt-2 text-[0.6875rem] text-muted" dir={textDir}>
            {t.approvedRow}
          </div>
          <div className="mt-1 grid grid-cols-5 gap-2 text-center">
            {GTM.approved.map((v, i) => (
              <div key={FY[i]} className="rounded-lg border border-line/10 py-1.5 text-[0.8125rem] font-semibold">
                <Fig src="teamModel">{f.mill(v)}</Fig>
              </div>
            ))}
          </div>
        </div>
      </div>

      <table className="mt-5 w-full border-separate border-spacing-0 text-[0.8125rem]">
        <thead>
          <tr className="text-[0.6875rem] uppercase tracking-wide text-muted">
            <th scope="col" className="pb-2 text-start font-medium">
              {t.tableGate}
            </th>
            <th scope="col" className="pb-2 text-start font-medium">
              {t.tableIf}
            </th>
            <th scope="col" className="pb-2 text-end font-medium">
              {t.tableExposure}
            </th>
          </tr>
        </thead>
        <tbody>
          {GATES.map((g) => (
            <tr key={g.id}>
              <td className="whitespace-nowrap border-t border-line/10 py-2.5 pe-3 align-top">
                <span className="font-semibold">{g.id}</span>{' '}
                <span className="text-[0.75rem] text-muted">{tpl(t.gateEnd, { fy: g.fyEnd })}</span>
              </td>
              <td className="border-t border-line/10 py-2.5 pe-3 align-top text-[0.75rem] leading-relaxed text-ink/85">
                {g.metrics.map((m, i) => (
                  <Fragment key={m.id}>
                    {i > 0 && '; '}
                    {metricText(m)}
                  </Fragment>
                ))}
              </td>
              <td className="whitespace-nowrap border-t border-line/10 py-2.5 text-end align-top font-semibold">
                <Fig src="teamGates">{f.sarM(g.exposure)}</Fig>
                {g.id === 'G3' && <span className="text-[0.6875rem] font-normal text-muted"> ({t.peak})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[0.75rem] leading-relaxed text-muted">
        <Rich text={t.stopRule} values={{ cor: <Fig src="teamGates">{f.pct(STOP_RULE.corThreshold, 1)}</Fig> }} />
      </p>
    </SpotlightCard>
  );
}

function AskCard() {
  const t = useT().strategy.roadmap;
  const f = useFmt();
  const [approved, setApproved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const exp = (v: number) => <Fig src="teamGates">{f.sarM(v)}</Fig>;

  return (
    <SpotlightCard border="gold" className="flex h-full flex-col p-5">
      <div aria-hidden className="sadu pointer-events-none absolute inset-x-6 top-0 h-4" />
      <div className="eyebrow text-gold">{t.askEyebrow}</div>
      <h3 className="mt-1.5 font-display text-[1.375rem] font-semibold leading-tight">{t.askTitle}</h3>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink/85">
        <Rich text={t.askBody} values={{ g1: exp(ASK.gate1), g2: exp(ASK.gate2), peak: exp(ASK.peak) }} />
      </p>

      <div ref={ref} className="mt-4 space-y-2.5">
        {GATES.map((g, i) => (
          <div key={g.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[0.75rem]">
              <span className="text-muted">{t.ladder[g.id as GateId]}</span>
              <span className="font-semibold">{exp(g.exposure)}</span>
            </div>
            <div className="h-2 rounded-full bg-line/[0.07]">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  i === 0 ? 'bg-gradient-to-r from-brand to-gold shadow-[0_0_14px_-2px_rgb(var(--brand)/0.7)] rtl:bg-gradient-to-l' : 'bg-line/25',
                )}
                initial={{ width: '0%' }}
                animate={inView ? { width: `${(g.exposure / ASK.peak) * 100}%` } : undefined}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: EASE }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-inner border border-line/10 bg-line/[0.03] p-3 text-[0.8125rem] leading-relaxed">{t.decision}</p>
      <p className="mt-3 flex items-start gap-2 text-[0.75rem] text-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        {t.sama}
      </p>

      <div className="mt-auto pt-4">
        <AnimatePresence mode="wait" initial={false}>
          {approved ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex flex-wrap items-center gap-3"
            >
              <div role="status" className="flex flex-1 items-center gap-2 rounded-full border border-pass/40 bg-pass/10 px-4 py-2.5 text-[0.8125rem] font-semibold text-pass">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
                  <motion.path
                    d="M5 12.5l4.2 4.2L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
                  />
                </svg>
                {t.approved}
              </div>
              <button type="button" onClick={() => setApproved(false)} className="text-[0.75rem] text-muted underline underline-offset-4 hover:text-ink">
                {t.undo}
              </button>
            </motion.div>
          ) : (
            <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Button variant="primary" full magnetic icon={<Gavel className="h-4 w-4" strokeWidth={1.5} />} onClick={() => setApproved(true)}>
                {t.approve}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-2 text-[0.6875rem] text-muted">{t.approveNote}</p>
      </div>
    </SpotlightCard>
  );
}

const PLAN_ICONS: LucideIcon[] = [Flag, ListChecks, Rocket];

function Plan90() {
  const t = useT().strategy.roadmap;
  return (
    <SpotlightCard className="p-5">
      <CardHead title={t.planTitle} right={<SourceChip src="teamView" />} />
      <ol className="grid gap-3 md:grid-cols-3">
        {PLAN_90.map((id, i) => {
          const Icon = PLAN_ICONS[i];
          return (
            <li key={id} className="inner relative p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand/35 bg-brand/10 text-brand">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="text-[0.75rem] font-semibold text-gold">{t.plan[id].when}</span>
              </div>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink/85">{t.plan[id].body}</p>
            </li>
          );
        })}
      </ol>
    </SpotlightCard>
  );
}

export function RoadmapSection() {
  const t = useT().strategy.roadmap;
  const f = useFmt();
  return (
    <section id="strategy-roadmap" aria-label={t.eyebrow} className="scroll-mt-36">
      <SecHead
        eyebrow={t.eyebrow}
        title={<Rich text={t.title} values={{ g1: <Fig src="teamGates">{f.sarM(ASK.gate1)}</Fig> }} />}
        subtitle={t.subtitle}
      />
      <Stagger className="grid gap-4 lg:grid-cols-12">
        <Item className="lg:col-span-8">
          <Timeline />
        </Item>
        <Item className="lg:col-span-4">
          <AskCard />
        </Item>
        <Item className="lg:col-span-12">
          <Plan90 />
        </Item>
      </Stagger>
    </section>
  );
}
