import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, CheckCircle2, Hourglass, Info, Sparkles, Wallet, X } from 'lucide-react';
import { useApp, useJourney } from '../../../store';
import { useT, useTpl } from '../../../i18n';
import { PERSONAS, POLICY, type LifeEventId } from '../../../config/illustrative';
import { evaluate, personaInputs } from '../../../logic/creditEngine';
import { addGoal, dismissFeed, lifeEventParams, setSalaryStep } from '../../../logic/journey';
import { useFmt } from '../../../components/ui/useFmt';
import { CountUp } from '../../../components/ui/CountUp';
import { Illus } from '../../../components/ui/Provenance';
import { cn } from '../../../lib/cn';
import { useEngine } from '../useEngine';
import { AiBadge, PButton, PCard, Ring } from '../ui';
import { SPLIT_COLORS } from '../Donut';
import { GoalList } from './Salary';
import { ExpandedOffer, FirstFinancing } from './Financing';

function Feed() {
  const t = useT();
  const tpl = useTpl();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  const setTab = useApp((s) => s.setPhoneTab);
  const setHelpOpen = useApp((s) => s.setHelpOpen);
  const patchJourney = useApp((s) => s.patchJourney);
  const act = (ev: LifeEventId) => {
    if (ev === 'firstSalary') {
      if (j.month === 1 && j.salaryStep < 5) setSalaryStep(3);
      else setTab('goals');
    } else if (ev === 'graduation') patchJourney({ letterReady: true });
    else if (ev === 'relocation') setHelpOpen(true);
    else if (ev === 'marriage') {
      addGoal(pid, 'wedding', 50000);
      setTab('goals');
    }
  };
  const ref = useRef<HTMLDivElement>(null);
  const count = useRef(j.feed.length);
  useEffect(() => {
    if (j.feed.length > count.current) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    count.current = j.feed.length;
  }, [j.feed.length]);
  if (j.feed.length === 0) return null;
  return (
    <div ref={ref} className="scroll-mt-2 space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t.app.home.forYou}</div>
      <AnimatePresence initial={false}>
        {j.feed.map((f) => {
          const c = t.app.lifeEvents.cards[f.event];
          const params = lifeEventParams(pid, f.event);
          return (
            <motion.div
              key={f.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <PCard tone="gold" className="pe-9">
                <button type="button" onClick={() => dismissFeed(pid, f.id)} aria-label={t.app.home.dismiss} className="absolute end-2 top-2 rounded-full p-1 text-muted hover:bg-line/10">
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gold">
                  <Sparkles className="h-3 w-3" />
                  {t.common.lifeEvents[f.event]}
                </div>
                <div className="mt-1 text-[14px] font-semibold leading-snug">{tpl(c.title, params)}</div>
                <p className="mt-1 text-[12px] leading-snug text-ink/80">{tpl(c.body, params)}</p>
                <div className="mt-2 flex items-start gap-1.5 rounded-[10px] bg-line/[0.05] px-2 py-1.5 text-[11px] leading-snug text-muted">
                  <Info className="mt-[1px] h-3 w-3 shrink-0" />
                  <span>
                    <span className="font-semibold text-ink/80">{t.app.home.why}</span> {tpl(c.why, params)}
                  </span>
                </div>
                <PButton variant="gold" className="mt-2.5 h-[34px] text-[12px]" onClick={() => act(f.event)}>
                  {f.event === 'graduation' && j.letterReady ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                  {c.cta}
                </PButton>
              </PCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function BalanceCard() {
  const t = useT();
  const tpl = useTpl();
  const f = useFmt();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  const p = PERSONAS[pid];
  const total = p.salary;
  return (
    <div className="relative overflow-hidden rounded-[20px] p-4 text-white" style={{ background: 'radial-gradient(140% 120% at 100% 0%, #ff3b52 0%, #9e0f25 45%, #3d0010 100%)' }}>
      <div className="sadu absolute inset-x-0 bottom-3 h-4 !opacity-20" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11.5px] text-white/75">{t.app.home.balance}</div>
          <div className="num mt-0.5 font-display text-[26px] font-semibold tracking-tight">
            <CountUp value={j.month >= 1 ? j.split.spending : 0} format={(v) => f.sar(Math.round(v))} duration={0.9} inView={false} />
          </div>
        </div>
        <Wallet className="h-5 w-5 text-white/80" strokeWidth={1.5} />
      </div>
      {j.month >= 1 ? (
        <>
          <div className="relative mt-3 flex h-2 overflow-hidden rounded-full bg-white/15" dir="ltr">
            {(['bills', 'spending', 'goals'] as const).map((k) => (
              <motion.span key={k} initial={false} animate={{ width: `${(j.split[k] / total) * 100}%` }} style={{ background: k === 'bills' ? '#ffd1d8' : k === 'spending' ? 'rgb(var(--gold))' : 'rgb(var(--pass))' }} />
            ))}
          </div>
          <div className="relative mt-1.5 flex justify-between text-[10.5px] text-white/80">
            <span>{t.app.salary.bills} {f.sar(j.split.bills)}</span>
            <span>{t.app.salary.goals} {f.sar(j.split.goals)}</span>
          </div>
          <div className="relative mt-2 flex items-center gap-1.5 text-[11px] text-white/80">
            <CalendarClock className="h-3.5 w-3.5" />
            {tpl(t.app.home.nextSalary, { day: p.salaryDay })}
          </div>
        </>
      ) : (
        <div className="relative mt-2 text-[11.5px] text-white/80">{t.app.home.accountOpen}</div>
      )}
    </div>
  );
}

function Seasoning() {
  const t = useT();
  const tpl = useTpl();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  const r = useEngine()!;
  const p = PERSONAS[pid];
  const months = Array.from({ length: Math.max(1, j.month) }, (_, i) => i + 1);
  const scores = months.map((mo) => evaluate(personaInputs(p), mo).score);
  const left = POLICY.SEASONING_MONTHS - j.month;
  return (
    <div className="space-y-3">
      <PCard>
        <div className="flex items-center gap-4">
          <Ring value={j.month / POLICY.SEASONING_MONTHS} size={104} stroke={9}>
            <span className="num font-display text-[24px] font-semibold leading-none">
              {j.month}
              <span className="text-[14px] text-muted">/6</span>
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold leading-snug">{tpl(t.app.seasoning.ring, { m: j.month })}</div>
            <p className="mt-1 text-[12px] leading-snug text-muted">{t.app.seasoning.message}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-line/[0.05] px-2.5 py-2 text-[11.5px]">
          <Hourglass className="h-3.5 w-3.5 text-gold" />
          <span className="flex-1 text-ink/85">{t.app.seasoning.noOffer}</span>
          <span className="num font-semibold text-gold">{left === 1 ? t.app.seasoning.unlocksNext : tpl(t.app.seasoning.unlocksIn, { n: left })}</span>
        </div>
      </PCard>

      <PCard tone="ai">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AiBadge />
            <span className="text-[13px] font-semibold">{t.app.seasoning.provisional}</span>
          </div>
          <Illus />
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="num font-display text-[30px] font-semibold leading-none">
              <CountUp value={r.score} format={(v) => v.toFixed(1)} duration={0.8} inView={false} from={scores[Math.max(0, scores.length - 2)] ?? 0} />
            </span>
            <motion.span key={r.band} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="rounded-full bg-ai/20 px-2 py-[2px] text-[12px] font-semibold text-ai-glow">
              {tpl(t.common.band, { b: r.band })}
            </motion.span>
          </div>
          <div className="flex h-[44px] items-end gap-1" dir="ltr" aria-label={t.app.seasoning.history}>
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span
                key={i}
                className={cn('w-[9px] rounded-t-[3px]', i < scores.length ? 'bg-ai-glow' : 'bg-line/15')}
                initial={false}
                animate={{ height: i < scores.length ? `${Math.max(12, ((scores[i] - 30) / 70) * 44)}px` : '6px' }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 200, damping: 20 }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ai-glow">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ai-glow opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ai-glow" />
          </span>
          {t.app.seasoning.learning}
        </div>
        <ul className="mt-1.5 space-y-1 text-[12px]">
          {[tpl(t.app.seasoning.sigSalary, { n: j.month }), t.app.seasoning.sigBills, t.app.seasoning.sigBalance].map((x, i) => (
            <motion.li key={x} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-pass" />
              {x}
            </motion.li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-muted">{t.app.financing.scorecard}</p>
      </PCard>
    </div>
  );
}

function AutopilotMini() {
  const t = useT();
  const f = useFmt();
  const j = useJourney()!;
  const setTab = useApp((s) => s.setPhoneTab);
  if (j.month < 1) return null;
  return (
    <button type="button" onClick={() => setTab('goals')} className="flex w-full items-center gap-2 rounded-[16px] border border-line/10 bg-line/[0.03] px-3 py-2.5 text-start">
      <Sparkles className="h-4 w-4 text-ai-glow" />
      <span className="text-[12px] font-semibold">{t.app.home.autopilot}</span>
      <span className="flex flex-1 justify-end gap-2 text-[11px]">
        {(['bills', 'spending', 'goals'] as const).map((k) => (
          <span key={k} className="num flex items-center gap-1 text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: SPLIT_COLORS[k] }} />
            {f.sar(j.split[k])}
          </span>
        ))}
      </span>
    </button>
  );
}

export function Home() {
  const t = useT();
  const tpl = useTpl();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  // The path content leads; life-event cards and everyday money follow.
  return (
    <div className="space-y-3">
      <div className="pt-1 text-[18px] font-semibold">{tpl(t.app.home.hi, { name: { key: `common.personas.${pid}.name` } })}</div>
      {j.month === 0 && <BalanceCard />}
      {j.month >= 1 && j.month < POLICY.SEASONING_MONTHS && <Seasoning />}
      {j.month >= POLICY.SEASONING_MONTHS && j.month < POLICY.EXPANSION_MONTH && <FirstFinancing />}
      {j.month >= POLICY.EXPANSION_MONTH && <ExpandedOffer />}
      <Feed />
      {j.month >= 1 && <BalanceCard />}
      <AutopilotMini />
      {j.month >= 1 && <GoalList compact />}
    </div>
  );
}
