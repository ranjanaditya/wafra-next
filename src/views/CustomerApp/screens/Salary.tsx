import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, Copy, FileUp, Send, Sparkles, Wallet } from 'lucide-react';
import { useApp, useJourney } from '../../../store';
import { useT, useTpl } from '../../../i18n';
import { EMPLOYERS, PERSONAS, type EmployerId } from '../../../config/illustrative';
import { useFmt } from '../../../components/ui/useFmt';
import { CountUp } from '../../../components/ui/CountUp';
import { Illus } from '../../../components/ui/Provenance';
import { projectGoals, setSalaryStep } from '../../../logic/journey';
import { m } from '../../../lib/msg';
import { cn } from '../../../lib/cn';
import { Donut, SPLIT_COLORS, type Split } from '../Donut';
import { AiBadge, PButton, PCard, Ring, StepHeader } from '../ui';

export function SalaryFlow() {
  const j = useJourney()!;
  const s = j.salaryStep;
  return s === 0 ? <EmployerStep /> : s === 1 ? <IbanStep /> : s === 2 ? <CreditedStep /> : s === 3 ? <AutopilotStep /> : <GoalsStep />;
}

function EmployerStep() {
  const t = useT();
  const pid = useApp((s) => s.personaId)!;
  const [sel, setSel] = useState<EmployerId>(PERSONAS[pid].employer);
  return (
    <div>
      <StepHeader title={t.app.salary.employerTitle} sub={t.app.salary.employerSub} />
      <div className="space-y-2">
        {EMPLOYERS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setSel(e.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-[16px] border p-3 text-start transition-colors',
              sel === e.id ? 'border-brand/60 bg-brand/10' : 'border-line/10 bg-line/[0.03] hover:bg-line/[0.06]',
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-line/10 text-[12px] font-bold text-ink/80">
              {t.common.employers[e.id].slice(0, 2)}
            </span>
            <span className="flex-1 text-[13.5px] font-medium">{t.common.employers[e.id]}</span>
            {e.partner && <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-[2px] text-[10px] font-semibold text-brand">{t.app.salary.partner}</span>}
            {sel === e.id && <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">{t.app.salary.fictional}</p>
      <PButton full className="mt-4" icon={<Building2 className="h-4 w-4" />} onClick={() => setSalaryStep(1)}>
        {t.common.continue}
      </PButton>
    </div>
  );
}

function IbanStep() {
  const t = useT();
  const tpl = useTpl();
  const pid = useApp((s) => s.personaId)!;
  const toast = useApp((s) => s.toast);
  const p = PERSONAS[pid];
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (!sent) return;
    const id = setTimeout(() => setSalaryStep(2), 1700);
    return () => clearTimeout(id);
  }, [sent]);
  return (
    <div>
      <StepHeader title={t.app.salary.ibanTitle} sub={tpl(t.app.salary.ibanSub, { employer: { key: `common.employers.${p.employer}` } })} />
      <div className="mb-1.5 text-[12px] font-semibold text-muted">{t.app.salary.ibanLabel}</div>
      <div className="flex items-center gap-2 rounded-[14px] border border-line/15 bg-line/[0.05] px-4 py-3">
        <span className="num flex-1 text-[14px] font-semibold tracking-[0.08em]" dir="ltr">
          {p.maskedIban}
        </span>
        <button type="button" aria-label="Copy" onClick={() => toast(m('common.toasts.copied'), 'success')} className="rounded-full p-1.5 text-muted hover:bg-line/10 hover:text-ink">
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-2">
        <PButton full icon={sent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />} onClick={() => setSent(true)} disabled={sent}>
          {sent ? t.app.salary.sent : t.app.salary.sendHr}
        </PButton>
        <PButton full variant="outline" icon={<FileUp className="h-4 w-4" />} onClick={() => setSent(true)} disabled={sent}>
          {t.app.salary.uploadLetter}
        </PButton>
      </div>
      <AnimatePresence>
        {sent && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-muted">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-blink rounded-full bg-gold" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            {t.app.salary.waiting}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreditedStep() {
  const t = useT();
  const f = useFmt();
  const pid = useApp((s) => s.personaId)!;
  const p = PERSONAS[pid];
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <div className="relative mb-4 h-[130px] w-[130px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-gold"
            initial={{ x: Math.cos(i * 0.7) * 110, y: -100 + Math.sin(i * 1.3) * 40, opacity: 0, scale: 0.6 }}
            animate={{ x: -6, y: -6, opacity: [0, 1, 0], scale: 1 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.08, 1], opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="absolute inset-0 flex items-center justify-center rounded-full border border-gold/40 bg-gold/10"
        >
          <Wallet className="h-12 w-12 text-gold" strokeWidth={1.5} />
        </motion.div>
      </div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{t.app.salary.creditedTitle}</div>
      <div className="mt-1 font-display text-[34px] font-semibold tracking-tight">
        <CountUp value={p.salary} format={(v) => f.sar(Math.round(v))} duration={1.2} inView={false} />
      </div>
      <div className="mt-1 text-[12.5px] text-muted">{t.app.salary.pushFrom.replace('{employer}', t.common.employers[p.employer])}</div>
      <PCard className="mt-5 w-full text-start" tone="ai">
        <div className="flex items-center gap-2">
          <AiBadge />
          <span className="text-[12.5px] font-medium">{t.app.salary.aiLooked}</span>
        </div>
      </PCard>
      <PButton full className="mt-4" variant="ai" icon={<Sparkles className="h-4 w-4" />} onClick={() => setSalaryStep(3)}>
        {t.app.salary.autopilotBtn}
      </PButton>
    </div>
  );
}

const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length / 10) * 10;

/** Autopilot editor (donut + legend with a one-line why per part). */
export function AutopilotEditor() {
  const t = useT();
  const tpl = useTpl();
  const f = useFmt();
  const pid = useApp((s) => s.personaId)!;
  const j = useJourney()!;
  const patchJourney = useApp((s) => s.patchJourney);
  const p = PERSONAS[pid];
  const rows: { id: keyof Split; why: string }[] = [
    { id: 'bills', why: tpl(t.app.salary.whyBills, { amount: { sar: avg(p.pattern.bills) } }) },
    { id: 'spending', why: tpl(t.app.salary.whySpending, { amount: { sar: avg(p.pattern.spending) } }) },
    { id: 'goals', why: tpl(t.app.salary.whyGoals, { amount: { sar: j.split.goals } }) },
  ];
  return (
    <div>
      <Donut salary={p.salary} split={j.split} onChange={(split) => patchJourney({ split })} />
      <p className="mt-1 text-center text-[11px] text-muted">{t.app.salary.dragHint}</p>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-[14px] border border-line/10 bg-line/[0.03] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SPLIT_COLORS[r.id] }} />
              <span className="flex-1 text-[13px] font-semibold">{t.app.salary[r.id]}</span>
              <span className="num text-[13px] font-semibold">{f.sar(j.split[r.id])}</span>
              <span className="num w-9 text-end text-[11px] text-muted">{Math.round((j.split[r.id] / p.salary) * 100)}%</span>
            </div>
            <div className="mt-0.5 ps-[18px] text-[11.5px] leading-snug text-muted">{r.why}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutopilotStep() {
  const t = useT();
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-ai/20 text-ai-glow">
          <span className="absolute inset-0 animate-pulseRing rounded-full border border-ai/60" />
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight">{t.app.salary.autopilotTitle}</div>
          <div className="text-[11.5px] text-ai-glow">{t.app.salary.aiLooked}</div>
        </div>
      </div>
      <AutopilotEditor />
      <PButton full className="mt-4" onClick={() => setSalaryStep(4)}>
        {t.app.salary.applyBtn}
      </PButton>
    </div>
  );
}

/** Goal list with progress rings and a live "on track by" projection. */
export function GoalList({ compact }: { compact?: boolean }) {
  const t = useT();
  const tpl = useTpl();
  const f = useFmt();
  const j = useJourney()!;
  const goals = projectGoals(j);
  return (
    <div className={cn('space-y-2', compact && 'space-y-1.5')}>
      {goals.slice(0, compact ? 1 : undefined).map((g, i) => (
        <motion.div key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 rounded-[16px] border border-line/10 bg-line/[0.03] p-3">
          <Ring value={g.saved / g.target} size={46} stroke={5} color={SPLIT_COLORS.goals}>
            <span className="num text-[10.5px] font-semibold">{Math.round((g.saved / g.target) * 100)}%</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13.5px] font-semibold">{t.common.goals[g.id]}</span>
            </div>
            <div className="num text-[11.5px] text-muted">{tpl(t.app.salary.savedOf, { saved: { sar: g.saved }, target: { sar: g.target } })}</div>
            <motion.div key={`${g.monthly}-${g.date?.year}-${g.date?.month0}`} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="mt-0.5 text-[11.5px] font-medium text-pass">
              {g.date ? tpl(t.app.salary.onTrack, { date: { ym: { y: g.date.year, m0: g.date.month0 } } }) : '—'}
            </motion.div>
          </div>
          <div className="num text-end text-[11.5px] font-semibold text-ink/90">{tpl(t.app.salary.perMonth, { amount: { sar: g.monthly } })}</div>
        </motion.div>
      ))}
      {!compact && (
        <div className="flex items-center justify-end gap-1 pt-0.5">
          <Illus />
        </div>
      )}
    </div>
  );
}

function GoalsStep() {
  const t = useT();
  return (
    <div>
      <StepHeader title={t.app.salary.goalsTitle} />
      <GoalList />
      <PButton full className="mt-4" onClick={() => setSalaryStep(5)}>
        {t.app.salary.toHome}
      </PButton>
    </div>
  );
}
