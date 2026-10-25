import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, GraduationCap, HeartHandshake, MapPin, RotateCcw, Trash2 } from 'lucide-react';
import { useApp, useJourney } from '../../store';
import { useMsg, useT, useTpl } from '../../i18n';
import { PERSONA_ORDER, PERSONAS, POLICY, type IncomeType, type LifeEventId, type PersonaId } from '../../config/illustrative';
import { evaluate } from '../../logic/creditEngine';
import { pickPersona, triggerLifeEvent } from '../../logic/journey';
import { Avatar, Segmented, Slider, TagPill } from '../../components/ui/Controls';
import { Illus } from '../../components/ui/Provenance';
import { Magnetic } from '../../components/fx/Magnetic';
import { useFmt } from '../../components/ui/useFmt';
import { clock } from '../../lib/format';
import { cn } from '../../lib/cn';
import { logIcon } from './ui';

// ───────────── Persona switcher ─────────────
export function PersonaSwitcher() {
  const t = useT();
  const pid = useApp((s) => s.personaId);
  return (
    <div className="flex w-full items-center justify-center gap-1.5" role="group" aria-label={t.app.persona.label}>
      {PERSONA_ORDER.map((id) => {
        const p = PERSONAS[id];
        const active = pid === id;
        return (
          <Magnetic key={id} strength={8} radius={40}>
            <button
              type="button"
              onClick={() => pickPersona(id)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-2 rounded-full border py-1 pe-3 ps-1 text-[12.5px] font-semibold transition-colors',
                active ? 'border-gold/60 bg-gold/10 text-ink' : 'border-line/10 bg-line/[0.04] text-muted hover:text-ink',
              )}
            >
              <Avatar initials={p.initials} gradient={p.gradient} size={28} />
              {t.common.personas[id].name}
            </button>
          </Magnetic>
        );
      })}
      <button
        type="button"
        onClick={() => pickPersona(null)}
        aria-label={t.app.persona.restart}
        title={t.app.persona.restart}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line/10 text-muted hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ───────────── Life-events dock ─────────────
const EVENTS: { id: LifeEventId; Icon: typeof Banknote }[] = [
  { id: 'firstSalary', Icon: Banknote },
  { id: 'graduation', Icon: GraduationCap },
  { id: 'relocation', Icon: MapPin },
  { id: 'marriage', Icon: HeartHandshake },
];

export function LifeEventsDock() {
  const t = useT();
  const j = useJourney();
  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-[20px] px-3 py-2.5">
      <div className="me-1 min-w-0">
        <div className="eyebrow">{t.app.lifeEvents.title}</div>
        <div className="text-[11px] text-muted">{t.app.lifeEvents.hint}</div>
      </div>
      <div className="flex flex-1 flex-wrap justify-end gap-1.5">
        {EVENTS.map(({ id, Icon }) => {
          const on = j?.feed.some((f) => f.event === id);
          return (
            <Magnetic key={id} strength={6} radius={30}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerLifeEvent(id)}
                data-cursor="play"
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                  on ? 'border-gold/60 bg-gold/15 text-gold' : 'border-line/15 bg-line/[0.04] text-ink/85 hover:border-gold/40 hover:text-ink',
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.common.lifeEvents[id]}
              </motion.button>
            </Magnetic>
          );
        })}
      </div>
    </div>
  );
}

// ───────────── Behind the glass ─────────────
const TAG_ICON_COLOR = { AI: 'text-ai-glow bg-ai/15', Rule: 'text-muted bg-line/10', Human: 'text-gold bg-gold/15', Partner: 'text-brand bg-brand/15', Simulated: 'text-ink/80 border border-dashed border-line/35' } as const;

export function EngineLog() {
  const t = useT();
  const render = useMsg();
  const log = useApp((s) => s.log);
  const clear = useApp((s) => s.clearLog);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(['AI', 'Rule', 'Human', 'Partner', 'Simulated'] as const).map((tag) => (
          <TagPill key={tag} tag={tag} />
        ))}
        <span className="flex-1" />
        {log.length > 0 && (
          <button type="button" onClick={clear} className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted hover:bg-line/10 hover:text-ink">
            <Trash2 className="h-3 w-3" />
            {t.app.log.clear}
          </button>
        )}
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto pe-1" aria-live="polite">
        {log.length === 0 ? (
          <div className="flex h-full min-h-[160px] items-center justify-center rounded-inner border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">{t.app.log.empty}</div>
        ) : (
          <ol className="space-y-1.5">
            <AnimatePresence initial={false}>
              {log.map((e) => {
                const Icon = logIcon(e.icon);
                return (
                  <motion.li
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: -10, backgroundColor: 'rgb(var(--gold) / 0.12)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'rgb(var(--line) / 0.03)' }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-2.5 rounded-[14px] border border-line/[0.07] px-2.5 py-2"
                  >
                    <span className={cn('mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-lg', TAG_ICON_COLOR[e.tag])}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1 text-[12.5px] leading-[1.45] text-ink/90">{render(e.msg)}</span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <TagPill tag={e.tag} />
                      <span className="num text-[10px] text-muted">{clock(e.ts)}</span>
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}
      </div>
    </div>
  );
}

// ───────────── Try your own numbers ─────────────
export function TryNumbers() {
  const t = useT();
  const tpl = useTpl();
  const render = useMsg();
  const f = useFmt();
  const pid = useApp((s) => s.personaId);
  const base = PERSONAS[pid ?? 'noura'];
  const [salary, setSalary] = useState(base.salary);
  const [commitments, setCommitments] = useState(base.commitments);
  const [months, setMonths] = useState(6);
  const [history, setHistory] = useState(base.historyAtOpening);
  const [income, setIncome] = useState<IncomeType>(base.incomeType);
  const [behaviour, setBehaviour] = useState(base.behaviour);
  const [tenor, setTenor] = useState<number>(POLICY.TENOR.default);

  const load = (id: PersonaId) => {
    const p = PERSONAS[id];
    setSalary(p.salary);
    setCommitments(p.commitments);
    setHistory(p.historyAtOpening);
    setIncome(p.incomeType);
    setBehaviour(p.behaviour);
  };
  useEffect(() => {
    if (pid) load(pid);
  }, [pid]);

  const r = useMemo(() => evaluate({ salary, incomeType: income, commitments, historyAtOpening: history, behaviour }, months, { tenor }), [salary, income, commitments, history, behaviour, months, tenor]);

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-y-auto pe-1 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted">{t.app.sandbox.load}</span>
          {PERSONA_ORDER.map((id) => (
            <button key={id} type="button" onClick={() => load(id)} className="rounded-full border border-line/15 px-2.5 py-0.5 text-[11.5px] font-medium hover:border-gold/50">
              {t.common.personas[id].name}
            </button>
          ))}
          <Illus className="ms-auto" />
        </div>
        <Slider label={t.app.sandbox.salary} value={salary} min={3000} max={40000} step={500} onChange={setSalary} format={(v) => f.sar(v)} accent="gold" />
        <Slider label={t.app.sandbox.commitments} value={commitments} min={0} max={15000} step={100} onChange={setCommitments} format={(v) => f.sar(v)} accent="gold" />
        <Slider label={t.app.sandbox.months} value={months} min={0} max={18} step={1} onChange={setMonths} format={(v) => tpl(t.app.sandbox.monthsUnit, { n: v })} accent="gold" />
        <Slider label={t.app.sandbox.history} value={history} min={0} max={60} step={1} onChange={setHistory} format={(v) => tpl(t.app.sandbox.monthsUnit, { n: v })} accent="gold" />
        <Slider label={t.app.sandbox.behaviour} value={behaviour} min={0} max={15} step={1} onChange={setBehaviour} format={(v) => `${v} / 15`} accent="gold" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-ink/90">{t.app.sandbox.income}</span>
          <Segmented
            size="sm"
            value={income}
            onChange={setIncome}
            options={[
              { value: 'fixed', label: t.common.incomeType.fixed },
              { value: 'variable', label: t.common.incomeType.variable },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-ink/90">{t.app.sandbox.tenor}</span>
          <Segmented
            size="sm"
            value={String(tenor)}
            onChange={(v) => setTenor(Number(v))}
            options={[12, 24, 36, 48, 60].map((n) => ({ value: String(n), label: <span className="num">{n}</span> }))}
          />
        </div>
      </div>

      <div className="grad-border grad-border-ai relative space-y-3 rounded-inner border border-ai/25 bg-ai/[0.06] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t.app.sandbox.stage}</div>
            <div className="text-[15px] font-semibold">{r.specialistOnly ? t.app.sandbox.specialistOnly : t.app.sandbox.stages[r.stage]}</div>
          </div>
          <div className="text-end">
            <div className="num font-display text-[28px] font-semibold leading-none">{r.score.toFixed(1)}</div>
            <div className="mt-1 inline-flex rounded-full bg-ai/20 px-2 py-[2px] text-[12px] font-semibold text-ai-glow">{tpl(t.common.band, { b: r.band })}</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {r.factors.map((fa) => (
            <div key={fa.id} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-[42%] truncate text-muted">{t.app.why.factors[fa.id]}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/10" dir="ltr">
                <motion.div className="h-full rounded-full bg-ai-glow" initial={false} animate={{ width: `${(fa.points / fa.max) * 100}%` }} />
              </div>
              <span className="num w-12 text-end">
                {fa.points.toFixed(1)}/{fa.max}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-line/[0.05] p-2.5">
            <div className="text-[11px] text-muted">{t.app.sandbox.limit}</div>
            <div className="num text-[17px] font-semibold">{r.offer ? f.sar(r.offer.limit) : '—'}</div>
            {r.offer && <div className="mt-0.5 text-[10.5px] text-gold">{tpl(t.app.why.binding[r.offer.binding], { b: r.band })}</div>}
          </div>
          <div className="rounded-xl bg-line/[0.05] p-2.5">
            <div className="text-[11px] text-muted">{t.app.sandbox.instalment}</div>
            <div className="num text-[17px] font-semibold">{r.offer ? f.sar(Math.round(r.offer.instalment)) : '—'}</div>
            {r.offer && <div className="num mt-0.5 text-[10.5px] text-muted">{t.app.financing.totalCost}: {f.sar(Math.round(r.offer.totalProfitCost))}</div>}
          </div>
        </div>
        {r.humanReview && (
          <div className="rounded-xl border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-gold">
            {t.app.sandbox.primarySpecialist}: {r.humanReviewReasons.map((x) => t.app.review[x]).join(' · ')}
          </div>
        )}
        <ul className="space-y-1 text-[11.5px] leading-snug">
          {r.strengths.map((x) => (
            <li key={x.key} className="text-pass">
              + {render(x)}
            </li>
          ))}
          {r.improve.map((x) => (
            <li key={x.key} className="text-watch">
              − {render(x)}
            </li>
          ))}
        </ul>
        <p className="text-[10.5px] text-muted">{t.app.financing.scorecard}</p>
      </div>
    </div>
  );
}
