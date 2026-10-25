import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, ChevronRight, CreditCard, Headset, Info, LockOpen, ShieldAlert, Sparkles, TrendingUp, X } from 'lucide-react';
import { useApp, useJourney } from '../../../store';
import { useMsg, useT, useTpl } from '../../../i18n';
import { PERSONAS, POLICY } from '../../../config/illustrative';
import type { CreditResult, Offer } from '../../../logic/creditEngine';
import { decide, ensureShown, setTenor } from '../../../logic/journey';
import { requestSpecialist } from '../../../logic/assistant';
import { useFmt } from '../../../components/ui/useFmt';
import { CountUp } from '../../../components/ui/CountUp';
import { Illus } from '../../../components/ui/Provenance';
import { cn } from '../../../lib/cn';
import { useEngine } from '../useEngine';
import { AiBadge, CheckMorph, MilestoneDots, PButton, PCard } from '../ui';

// ───────────── Shared offer pieces ─────────────
function TenorSlider({ value }: { value: number }) {
  const t = useT();
  const { min, max, step } = POLICY.TENOR;
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <label htmlFor="tenor" className="font-medium text-muted">
          {t.app.financing.tenor}
        </label>
        <span className="num font-semibold">{t.app.financing.months.replace('{n}', String(value))}</span>
      </div>
      <input
        id="tenor"
        type="range"
        dir="ltr"
        className="range"
        data-cursor="drag"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setTenor(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%`, ['--accent' as string]: 'var(--ai)' }}
      />
      <div className="num mt-0.5 flex justify-between text-[10px] text-muted" dir="ltr">
        <span>{min}</span>
        <span>36</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function OfferRows({ offer, salary }: { offer: Offer; salary: number }) {
  const t = useT();
  const f = useFmt();
  const used = offer.salaryUsed;
  return (
    <div className="mt-3 space-y-2 text-[12.5px]">
      <div className="flex items-center justify-between">
        <span className="text-muted">{t.app.financing.instalment}</span>
        <span className="num text-[15px] font-semibold">
          <CountUp value={Math.round(offer.instalment)} format={(v) => f.sar(Math.round(v))} duration={0.5} inView={false} from={Math.round(offer.instalment)} />
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted">{t.app.financing.totalCost}</span>
        <span className="num font-semibold">{f.sar(Math.round(offer.totalProfitCost))}</span>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-muted">{t.app.financing.salaryUsed}</span>
          <span className={cn('num font-semibold', used > POLICY.DBR_CAP - 0.005 ? 'text-watch' : 'text-ink')}>{f.pct(used * 100, 0)}</span>
        </div>
        <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-line/10" dir="ltr">
          <motion.div className="h-full rounded-full bg-ai" initial={false} animate={{ width: `${Math.min(100, (used / 0.5) * 100)}%` }} />
          <span className="absolute top-[-2px] h-[10px] w-[2px] bg-gold" style={{ left: `${(POLICY.DBR_CAP / 0.5) * 100}%` }} title="33%" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-muted">
          {t.app.financing.apr} <Illus />
        </span>
        <span className="num font-semibold">{f.pct(offer.apr * 100, 1)}</span>
      </div>
      <p className="text-[10.5px] text-muted">{salary > 0 && t.app.financing.costFirst}</p>
    </div>
  );
}

function DecisionButtons({ r, stage }: { r: CreditResult; stage: 'first' | 'expanded' }) {
  const t = useT();
  const pid = useApp((s) => s.personaId)!;
  const specialistFirst = r.humanReview;
  const specialistBtn = (
    <PButton
      full
      variant={specialistFirst ? 'gold' : 'outline'}
      icon={<Headset className="h-4 w-4" />}
      onClick={() => requestSpecialist(pid, stage)}
      data-cursor="open"
    >
      {t.app.financing.specialist}
    </PButton>
  );
  return (
    <div className="mt-3 space-y-2">
      {specialistFirst && (
        <>
          <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-gold">
            <Info className="mt-[1px] h-3.5 w-3.5 shrink-0" />
            {t.app.financing.reviewNote}
          </p>
          {specialistBtn}
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        <PButton variant={specialistFirst ? 'outline' : 'primary'} onClick={() => decide(stage, 'accepted')}>
          {t.app.financing.accept}
        </PButton>
        <PButton variant={specialistFirst ? 'outline' : 'secondary'} className={specialistFirst ? '' : 'border border-line/25'} onClick={() => decide(stage, 'notNow')}>
          {t.app.financing.notNow}
        </PButton>
      </div>
      {!specialistFirst && specialistBtn}
    </div>
  );
}

function DecisionOutcome({ state, offer, stage }: { state: 'accepted' | 'notNow' | 'specialist'; offer: Offer; stage: 'first' | 'expanded' }) {
  const t = useT();
  const tpl = useTpl();
  const setTab = useApp((s) => s.setPhoneTab);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-2 text-center">
      {state === 'accepted' ? <CheckMorph size={48} /> : state === 'specialist' ? <Headset className="h-10 w-10 text-gold" strokeWidth={1.5} /> : <CheckCircle2 className="h-10 w-10 text-muted" strokeWidth={1.5} />}
      <div className="mt-2 text-[15px] font-semibold">
        {state === 'accepted' ? t.app.financing.acceptedTitle : state === 'specialist' ? t.app.financing.specialistTitle : t.app.financing.notNowTitle}
      </div>
      <p className="mt-1 text-[12px] leading-snug text-muted">
        {state === 'accepted'
          ? tpl(t.app.financing.acceptedSub, { amount: { sar: offer.limit }, instalment: { sar: Math.round(offer.instalment) }, n: offer.tenor })
          : state === 'specialist'
            ? t.app.financing.specialistSub
            : t.app.financing.notNowSub}
      </p>
      <div className="mt-3 flex gap-2">
        {state === 'specialist' && (
          <PButton variant="gold" className="h-[34px] text-[12px]" onClick={() => setTab('assistant')}>
            {t.app.phone.tabs.assistant}
          </PButton>
        )}
        <PButton variant="ghost" className="h-[34px] text-[12px]" onClick={() => decide(stage, 'open')}>
          {state === 'notNow' ? t.app.financing.seeOffer : t.app.financing.undo}
        </PButton>
      </div>
    </motion.div>
  );
}

function UnlockOverlay({ label, onDone }: { label: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 1500);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[18px] bg-bg/85">
      <motion.div initial={{ scale: 0.5, rotate: -25 }} animate={{ scale: [0.5, 1.2, 1], rotate: 0 }} transition={{ duration: 0.7 }} className="relative">
        <span className="absolute inset-0 animate-pulseRing rounded-full border-2 border-ai" />
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ai/20 text-ai-glow">
          <LockOpen className="h-8 w-8" strokeWidth={1.75} />
        </span>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-3 text-[14px] font-semibold">
        {label}
      </motion.div>
    </motion.div>
  );
}

// ───────────── Step 4: first financing (months 6 to 11) ─────────────
export function FirstFinancing() {
  const t = useT();
  const f = useFmt();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  const r = useEngine()!;
  const patchJourney = useApp((s) => s.patchJourney);
  const setWhyOpen = useApp((s) => s.setWhyOpen);
  const p = PERSONAS[pid];

  useEffect(() => {
    ensureShown(pid, 'first');
  }, [pid]);

  if (r.specialistOnly || !r.offer) return <SpecialistOnly r={r} stage="first" />;
  const offer = r.offer;

  return (
    <PCard className="overflow-hidden" tone="ai">
      <AnimatePresence>{!j.seen.unlock && <UnlockOverlay label={t.app.financing.unlocked} onDone={() => patchJourney({ seen: { ...j.seen, unlock: true } })} />}</AnimatePresence>
      <div className="flex items-center gap-2">
        <AiBadge />
        <span className="flex-1 text-[14px] font-semibold">{t.app.financing.title}</span>
        <Illus />
      </div>
      <div className="mt-2 font-display text-[34px] font-semibold leading-none tracking-tight">
        <CountUp value={offer.limit} format={(v) => f.sar(Math.round(v / 10) * 10)} duration={1.1} inView={false} />
      </div>
      <div className="mt-1 text-[12px] text-ai-glow">{t.app.financing.limitLabel}</div>
      <button
        type="button"
        data-cursor="explain"
        onClick={() => setWhyOpen(true)}
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-ai/40 bg-ai/10 px-2.5 py-1 text-[12px] font-semibold text-ai-glow hover:bg-ai/20"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {t.app.financing.whyLimit}
        <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
      </button>

      {j.firstDecision === 'open' ? (
        <>
          <div className="mt-3">
            <TenorSlider value={j.tenor} />
          </div>
          <OfferRows offer={offer} salary={p.salary} />
          <div className="mt-3 rounded-[14px] border border-line/10 bg-line/[0.03] p-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-pass" />
              {t.app.financing.milestone}
            </div>
            <MilestoneDots filled={0} />
          </div>
          <DecisionButtons r={r} stage="first" />
          <p className="mt-2 text-center text-[10.5px] text-muted">{t.app.financing.noPromise}</p>
        </>
      ) : (
        <DecisionOutcome state={j.firstDecision} offer={offer} stage="first" />
      )}
      <p className="mt-2 text-center text-[10px] font-medium text-muted">{t.app.financing.scorecard}</p>
    </PCard>
  );
}

function SpecialistOnly({ r, stage }: { r: CreditResult; stage: 'first' | 'expanded' }) {
  const t = useT();
  const pid = useApp((s) => s.personaId)!;
  const setWhyOpen = useApp((s) => s.setWhyOpen);
  return (
    <PCard tone="gold">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-gold" strokeWidth={1.75} />
        <span className="text-[14px] font-semibold">{t.app.financing.noAuto}</span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{t.app.financing.noAutoSub}</p>
      <div className="mt-3 text-[12px] font-semibold">{t.app.financing.planTitle}</div>
      <ul className="mt-1.5 space-y-1.5 text-[12px]">
        {[t.app.financing.plan1, t.app.financing.plan2, t.app.financing.plan3].map((x) => (
          <li key={x} className="flex items-start gap-2">
            <ArrowUpRight className="mt-[2px] h-3.5 w-3.5 shrink-0 text-gold" />
            {x}
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2">
        <PButton full variant="gold" icon={<Headset className="h-4 w-4" />} onClick={() => requestSpecialist(pid, stage)}>
          {t.app.financing.specialist}
        </PButton>
        <PButton full variant="ghost" icon={<Sparkles className="h-4 w-4" />} onClick={() => setWhyOpen(true)}>
          {t.app.financing.whyLimit}
        </PButton>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted">
        {t.app.financing.scorecard} · {r.score.toFixed(1)}
      </p>
    </PCard>
  );
}

// ───────────── Step 5: credit expands (month 12 onward) ─────────────
export function ExpandedOffer() {
  const t = useT();
  const tpl = useTpl();
  const f = useFmt();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  const r = useEngine()!;
  const patchJourney = useApp((s) => s.patchJourney);
  const setWhyOpen = useApp((s) => s.setWhyOpen);
  const toast = useApp((s) => s.toast);
  const p = PERSONAS[pid];

  useEffect(() => {
    ensureShown(pid, 'expanded');
  }, [pid]);

  if (r.specialistOnly || !r.offer) return <SpecialistOnly r={r} stage="expanded" />;
  const offer = r.offer;
  const from = r.startingOffer?.limit ?? offer.limit;
  const primaryGoal = j.goals[0]?.id ?? 'emergency';

  const tiles = (
    <div className="grid grid-cols-2 gap-2">
      {r.cardOffer ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            if (j.cardOffer !== 'accepted') {
              patchJourney({ cardOffer: 'accepted' });
              toast({ key: 'app.expanded.cardSaved' }, 'success');
            }
          }}
          className="relative rounded-[16px] border border-brand/35 bg-brand/[0.08] p-3 text-start"
        >
          <span className="absolute end-2 top-2 rounded-full bg-gold px-1.5 py-[1px] text-[9.5px] font-bold uppercase text-[#1a1408]">{t.app.expanded.newTile}</span>
          <CreditCard className="h-5 w-5 text-brand" strokeWidth={1.75} />
          <div className="mt-2 text-[13px] font-semibold">{t.app.expanded.cardTitle}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-muted">{tpl(t.app.expanded.cardSub, { b: r.band })}</div>
          <div className="mt-1.5 text-[11.5px] font-semibold text-brand">{j.cardOffer === 'accepted' ? t.app.expanded.cardSaved : t.app.expanded.cardCta}</div>
        </motion.button>
      ) : (
        <div className="rounded-[16px] border border-line/10 bg-line/[0.03] p-3 opacity-80">
          <CreditCard className="h-5 w-5 text-muted" strokeWidth={1.75} />
          <div className="mt-2 text-[12px] leading-snug text-muted">{t.app.expanded.noCard}</div>
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative rounded-[16px] border border-pass/35 bg-pass/[0.07] p-3">
        <span className="absolute end-2 top-2 rounded-full bg-gold px-1.5 py-[1px] text-[9.5px] font-bold uppercase text-[#1a1408]">{t.app.expanded.newTile}</span>
        <TrendingUp className="h-5 w-5 text-pass" strokeWidth={1.75} />
        <div className="mt-2 text-[13px] font-semibold">{r.investing === 'goal' ? t.app.expanded.investTitle : t.app.expanded.investEmergency}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-muted">
          {r.investing === 'goal' ? tpl(t.app.expanded.investSub, { goal: { key: `common.goals.${primaryGoal}` } }) : t.app.expanded.investEmergencySub}
        </div>
      </motion.div>
    </div>
  );

  // Headline first, then the newly unlocked products, then the offer details.
  return (
    <div className="space-y-3">
      <PCard className="overflow-hidden" tone={r.growthBlocked ? 'watch' : 'pass'}>
        <AnimatePresence>{!j.seen.expand && <UnlockOverlay label={t.app.expanded.grew} onDone={() => patchJourney({ seen: { ...j.seen, expand: true } })} />}</AnimatePresence>
        <div className="flex items-center gap-2">
          <AiBadge />
          <span className="flex-1 text-[14px] font-semibold">{r.growthBlocked ? t.app.expanded.blocked : t.app.expanded.grew}</span>
          <Illus />
        </div>
        <div className="mt-2">
          <MilestoneDots filled={6} />
        </div>
        <div className="mt-1 text-[11.5px] text-pass">{t.app.expanded.after}</div>
        <div className="mt-2 font-display text-[34px] font-semibold leading-none tracking-tight">
          <CountUp value={offer.limit} from={from} format={(v) => f.sar(Math.round(v / 10) * 10)} duration={1.4} inView={false} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
          <span>{tpl(t.app.expanded.from, { amount: { sar: from } })}</span>
          <button
            type="button"
            data-cursor="explain"
            onClick={() => setWhyOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-ai/40 bg-ai/10 px-2.5 py-1 text-[12px] font-semibold text-ai-glow hover:bg-ai/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t.app.financing.whyLimit}
            <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </button>
        </div>
        {r.growthBlocked ? (
          <div className="mt-3">
            <p className="text-[12px] leading-snug text-ink/90">{tpl(t.app.expanded.blockedSub, { amount: { sar: offer.limit } })}</p>
            <PButton full variant="gold" className="mt-3" icon={<Headset className="h-4 w-4" />} onClick={() => requestSpecialist(pid, 'expanded')}>
              {t.app.expanded.reviewBtn}
            </PButton>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-muted">{r.affordabilityLimitsGrowth ? t.app.expanded.limited : t.app.expanded.capNote}</p>
        )}
      </PCard>

      {tiles}

      <PCard>
        <TenorSlider value={j.tenor} />
        {!r.growthBlocked &&
          (j.expandDecision === 'open' ? (
            <>
              <OfferRows offer={offer} salary={p.salary} />
              <DecisionButtons r={r} stage="expanded" />
            </>
          ) : (
            <DecisionOutcome state={j.expandDecision} offer={offer} stage="expanded" />
          ))}
        {r.growthBlocked && <OfferRows offer={offer} salary={p.salary} />}
        <p className="mt-2 text-center text-[10px] font-medium text-muted">{t.app.financing.scorecard}</p>
      </PCard>
    </div>
  );
}

// ───────────── "Why this limit" sheet ─────────────
export function WhyPanel({ r }: { r: CreditResult }) {
  const t = useT();
  const tpl = useTpl();
  const render = useMsg();
  const f = useFmt();
  const binding = r.offer?.binding;
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t.app.why.score}</div>
          <div className="flex items-baseline gap-2">
            <span className="num font-display text-[30px] font-semibold">{r.score.toFixed(1)}</span>
            <span className="text-[12px] text-muted">/ 100</span>
            <span className="rounded-full bg-ai/15 px-2 py-[2px] text-[12px] font-semibold text-ai-glow">{tpl(t.common.band, { b: r.band })}</span>
          </div>
        </div>
        <AiBadge />
      </div>
      <div className="space-y-2.5">
        {r.factors.map((fa, i) => (
          <div key={fa.id}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-medium">{t.app.why.factors[fa.id]}</span>
              <span className="num text-muted">{tpl(t.app.why.points, { p: fa.points.toFixed(1), max: fa.max })}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line/10" dir="ltr">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, rgb(var(--ai)), rgb(var(--ai-glow)))' }}
                initial={{ width: 0 }}
                animate={{ width: `${(fa.points / fa.max) * 100}%` }}
                transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      {r.offer && (
        <div>
          <div className="mb-1.5 text-[12px] font-semibold">{t.app.why.binds}</div>
          <div className="space-y-1.5">
            {r.offer.candidates.map((c) => (
              <div
                key={c.id}
                className={cn('flex items-center gap-2 rounded-[12px] border px-2.5 py-2 text-[11.5px]', c.id === binding ? 'border-gold/50 bg-gold/10' : 'border-line/10 bg-line/[0.03]')}
              >
                <span className="flex-1 leading-snug">{tpl(t.app.why.binding[c.id], { b: r.band })}</span>
                <span className="num font-semibold">{f.sar(Math.floor(c.value / 500) * 500)}</span>
                {c.id === binding && <span className="rounded-full bg-gold px-1.5 py-[1px] text-[9.5px] font-bold uppercase text-[#1a1408]">{t.app.why.binds1}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-pass">{t.app.why.strengths}</div>
          <ul className="space-y-1.5">
            {r.strengths.map((x) => (
              <li key={x.key} className="flex items-start gap-2 text-[12px] leading-snug">
                <CheckCircle2 className="mt-[1px] h-3.5 w-3.5 shrink-0 text-pass" />
                {render(x)}
              </li>
            ))}
          </ul>
        </div>
        {r.improve.length > 0 && (
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-watch">{t.app.why.improve}</div>
            <ul className="space-y-1.5">
              {r.improve.map((x) => (
                <li key={x.key} className="flex items-start gap-2 text-[12px] leading-snug">
                  <ArrowUpRight className="mt-[1px] h-3.5 w-3.5 shrink-0 text-watch" />
                  {render(x)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="rounded-[12px] bg-line/[0.04] p-2.5 text-[10.5px] leading-snug text-muted">
        {t.app.financing.scorecard}. {t.app.why.fairness} {tpl(t.app.why.policy, { v: r.policy })}
      </div>
    </div>
  );
}

export function WhySheet() {
  const t = useT();
  const open = useApp((s) => s.whyOpen);
  const setOpen = useApp((s) => s.setWhyOpen);
  const r = useEngine();
  return (
    <AnimatePresence>
      {open && r && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-label={t.app.why.title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[86%] overflow-y-auto rounded-t-[28px] border-t border-line/10 bg-elev px-[18px] pb-8 pt-3 [scrollbar-width:none]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line/25" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[18px] font-semibold">{t.app.why.title}</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.app.why.close} className="rounded-full p-1.5 text-muted hover:bg-line/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <WhyPanel r={r} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
