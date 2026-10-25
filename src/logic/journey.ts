/**
 * Customer-journey actions. They update the shared store and narrate every
 * system step into the "Behind the glass" engine-room log.
 */
import { useApp, type Journey } from '../store';
import {
  PERSONA_ORDER,
  PERSONAS,
  POLICY,
  SERVICE_HUBS,
  TIMELINE,
  type GoalId,
  type LifeEventId,
  type PersonaId,
} from '../config/illustrative';
import { evaluate, personaInputs, type CreditResult, type Stage } from './creditEngine';
import { m, uid, type Msg, type Params } from '../lib/msg';
import type { DecisionRecord } from '../store';

const st = () => useApp.getState();
const nameP = (pid: PersonaId) => ({ key: `common.personas.${pid}.name` });
const bindingP = (b: string) => ({ key: `app.why.bindingShort.${b}` });
const score1 = (r: CreditResult) => r.score.toFixed(1);

export function engineFor(pid: PersonaId, month?: number, tenor?: number, requested?: number | null): CreditResult {
  const j = st().journeys[pid];
  return evaluate(personaInputs(PERSONAS[pid]), month ?? j.month, { tenor: tenor ?? j.tenor, requested });
}

// ───────────── Goals ─────────────
export interface GoalProjection {
  id: GoalId;
  target: number;
  saved: number;
  monthly: number;
  monthsLeft: number | null;
  date: { year: number; month0: number } | null;
}

/** Goals pot split by weight; savings accrue from each salary month; projection in the synthetic calendar. */
export function projectGoals(j: Journey): GoalProjection[] {
  const totalW = j.goals.reduce((a, g) => a + g.weight, 0) || 1;
  const salaryMonths = j.salaryStep >= 5 || j.splitApplied ? j.month : 0;
  return j.goals.map((g) => {
    const monthly = Math.floor((j.split.goals * g.weight) / totalW / 10) * 10;
    const saved = Math.min(g.target, g.saved + monthly * salaryMonths);
    const remaining = g.target - saved;
    const monthsLeft = remaining <= 0 ? 0 : monthly > 0 ? Math.ceil(remaining / monthly) : null;
    const date =
      monthsLeft === null
        ? null
        : (() => {
            const total = TIMELINE.start.month + Math.max(j.month, 1) + monthsLeft;
            return { year: TIMELINE.start.year + Math.floor(total / 12), month0: total % 12 };
          })();
    return { id: g.id, target: g.target, saved, monthly, monthsLeft, date };
  });
}

// ───────────── Persona and onboarding ─────────────
let pending: { pid: PersonaId; from: number; to: number } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function flushMonthLog() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (pending) {
    const p = pending;
    pending = null;
    logMonthChange(p.pid, p.from, p.to);
  }
}

export function pickPersona(pid: PersonaId | null) {
  flushMonthLog();
  const s = st();
  s.selectPersona(pid);
  if (pid) s.pushLog('Rule', 'UserRound', m('app.log.personaSelected', { name: nameP(pid) }));
}

export function setOnboard(step: number) {
  const s = st();
  const pid = s.personaId;
  if (!pid) return;
  const p = PERSONAS[pid];
  s.patchJourney({ onboard: step });
  if (step === 1) {
    s.pushLog('Simulated', 'IdCard', m('app.log.idCaptured'));
    s.pushLog('Simulated', 'Fingerprint', m('app.log.nafathRequested'));
  } else if (step === 2) {
    s.pushLog('Simulated', 'ShieldCheck', m('app.log.nafathConfirmed'));
    s.pushLog('Rule', 'ListChecks', m('app.log.eligibility'));
  } else if (step === 3) {
    s.pushLog('Simulated', 'ScanFace', m('app.log.liveness'));
    s.pushLog('AI', 'Radar', m('app.log.fraudScore'));
  } else if (step === 4) {
    s.pushLog('Rule', 'FileCheck2', m('app.log.consent'));
    s.pushLog('Partner', 'Landmark', m('app.log.bureau', { amount: { sar: p.commitments } }));
    s.pushLog('Rule', 'BadgeCheck', m('app.log.accountOpened'));
    s.pushLog('Rule', 'CreditCard', m('app.log.cardIssued'));
  }
}

export function setSalaryStep(step: number) {
  const s = st();
  const pid = s.personaId;
  if (!pid) return;
  const p = PERSONAS[pid];
  const j = s.journeys[pid];
  s.patchJourney({ salaryStep: step });
  if (step === 1) s.pushLog('Partner', 'Building2', m('app.log.employerPicked', { employer: { key: `common.employers.${p.employer}` } }));
  if (step === 2) {
    s.pushLog('Partner', 'Send', m('app.log.ibanShared'));
    s.pushLog('Partner', 'Banknote', m('app.log.salaryCredited', { amount: { sar: p.salary }, m: 1 }));
    const r = evaluate(personaInputs(p), 1, { tenor: j.tenor });
    s.pushLog('AI', 'Gauge', m('app.log.provisional', { score: score1(r), band: r.band, m: 1 }));
    s.pushLog('Rule', 'Hourglass', m('app.log.noOffer'));
  }
  if (step === 3) s.pushLog('AI', 'Sparkles', m('app.log.autopilotAnalysed'));
  if (step === 4) {
    s.patchJourney({ splitApplied: true });
    s.pushLog('Rule', 'SlidersHorizontal', m('app.log.autopilotApplied', { b: { sar: j.split.bills }, s: { sar: j.split.spending }, g: { sar: j.split.goals } }));
    s.pushLog('AI', 'Target', m('app.log.goalsProjected', { amount: { sar: j.split.goals } }));
  }
}

/** Onboarding finished by the customer (no fast-forward note). */
export function finishOnboarding() {
  st().patchJourney({ onboard: 5 });
  goToMonth(1, { immediate: true });
}

// ───────────── Timeline ─────────────
/** Move the selected persona through time. Logs are debounced while dragging. */
export function goToMonth(target: number, opts: { immediate?: boolean } = {}) {
  const s = st();
  const pid = s.personaId;
  if (!pid) return;
  const j = s.journeys[pid];
  const to = Math.max(0, Math.min(TIMELINE.maxMonth, Math.round(target)));
  const patch: Partial<Journey> = { month: to };
  if (to >= 1 && j.onboard < 5) {
    patch.onboard = 5;
    s.pushLog('Simulated', 'FastForward', m('app.log.fastOnboard'));
  }
  if (to >= 2 && j.salaryStep < 5) {
    patch.salaryStep = 5;
    patch.splitApplied = true;
    s.pushLog('Partner', 'FastForward', m('app.log.fastSalary'));
  }
  s.patchJourney(patch);
  if (s.phoneTab !== 'home') s.setPhoneTab('home');
  if (to === j.month) return;
  if (!pending || pending.pid !== pid) pending = { pid, from: j.month, to };
  pending.to = to;
  if (timer) clearTimeout(timer);
  if (opts.immediate) flushMonthLog();
  else timer = setTimeout(flushMonthLog, 380);
}

function logMonthChange(pid: PersonaId, from: number, to: number) {
  const s = st();
  const p = PERSONAS[pid];
  const tenor = s.journeys[pid].tenor;
  const eng = (t: number) => evaluate(personaInputs(p), t, { tenor });
  if (to === from) return;
  if (to < from) {
    s.pushLog('Rule', 'Rewind', m('app.log.monthBack', { m: to }));
    if (to >= 1) {
      const r = eng(to);
      s.pushLog('AI', 'Gauge', r.stage === 'seasoning' ? m('app.log.provisional', { score: score1(r), band: r.band, m: to }) : m('app.log.scored', { v: POLICY.version, score: score1(r), band: r.band }));
    }
    return;
  }
  // Month 1 with the salary flow still ahead: the flow itself narrates the first salary.
  if (to === 1 && s.journeys[pid].salaryStep < 2) return;
  const firstSal = Math.max(from + 1, 1);
  if (to >= 1 && firstSal <= to) {
    if (firstSal === to) s.pushLog('Partner', 'Banknote', m('app.log.salaryCredited', { amount: { sar: p.salary }, m: to }));
    else s.pushLog('Partner', 'Banknote', m('app.log.salariesCredited', { from: firstSal, to }));
  }
  if (to < POLICY.SEASONING_MONTHS) {
    if (to >= 1) {
      const r = eng(to);
      s.pushLog('AI', 'Gauge', m('app.log.provisional', { score: score1(r), band: r.band, m: to }));
      s.pushLog('Rule', 'Hourglass', m('app.log.noOffer'));
    }
    return;
  }
  const crossed6 = from < POLICY.SEASONING_MONTHS;
  const crossed12 = from < POLICY.EXPANSION_MONTH && to >= POLICY.EXPANSION_MONTH;
  if (crossed6) {
    const r6 = eng(POLICY.SEASONING_MONTHS);
    s.pushLog('Rule', 'CalendarCheck', m('app.log.seasoned'));
    s.pushLog('AI', 'Gauge', m('app.log.scored', { v: POLICY.version, score: score1(r6), band: r6.band }));
    if (r6.offer) s.pushLog('Rule', 'Calculator', m('app.log.firstOffer', { amount: { sar: r6.offer.limit }, binding: bindingP(r6.offer.binding) }));
    for (const why of r6.humanReviewReasons) s.pushLog('Rule', 'UserCheck', m('app.log.humanReview', { why: { key: `app.review.${why}` } }));
  }
  if (crossed12) {
    const r12 = eng(POLICY.EXPANSION_MONTH);
    s.pushLog('Rule', 'CheckCheck', m('app.log.repayments'));
    s.pushLog('AI', 'Gauge', m('app.log.scored', { v: POLICY.version, score: score1(r12), band: r12.band }));
    if (r12.offer) s.pushLog('Rule', 'Calculator', m('app.log.expanded', { amount: { sar: r12.offer.limit }, binding: bindingP(r12.offer.binding) }));
    if (r12.growthBlocked && r12.offer) s.pushLog('Rule', 'ShieldAlert', m('app.log.growthBlocked', { amount: { sar: r12.offer.limit } }));
    s.pushLog('Rule', 'CreditCard', r12.cardOffer ? m('app.log.cardUnlocked', { band: r12.band }) : m('app.log.noCard', { band: r12.band }));
    s.pushLog('AI', 'TrendingUp', r12.investing === 'goal' ? m('app.log.investUnlocked') : m('app.log.investEmergency'));
  }
  if (!crossed6 && !crossed12) {
    const r = eng(to);
    s.pushLog('AI', 'Gauge', m('app.log.scored', { v: POLICY.version, score: score1(r), band: r.band }));
  }
}

// ───────────── Financing ─────────────
let tenorTimer: ReturnType<typeof setTimeout> | null = null;
export function setTenor(n: number) {
  const s = st();
  const pid = s.personaId;
  if (!pid) return;
  s.patchJourney({ tenor: n });
  if (tenorTimer) clearTimeout(tenorTimer);
  tenorTimer = setTimeout(() => {
    const r = engineFor(pid);
    if (r.offer) s.pushLog('Rule', 'Calculator', m('app.log.tenor', { n, amount: { sar: Math.round(r.offer.instalment) } }));
  }, 450);
}

export function recordDecision(pid: PersonaId, outcome: DecisionRecord['outcome'], requested?: number | null) {
  const s = st();
  const j = s.journeys[pid];
  const r = engineFor(pid, j.month, j.tenor, requested ?? null);
  const reasons: Msg[] = [...r.strengths, ...r.improve].map(({ key, params }) => ({ key, params }));
  s.addDecision({
    personaId: pid,
    month: j.month,
    tenor: j.tenor,
    score: r.score,
    band: r.band,
    stage: r.stage,
    limit: r.offer?.limit ?? null,
    binding: r.offer?.binding ?? null,
    reasons,
    humanReview: r.humanReview,
    outcome,
    requested: requested ?? null,
  });
}

/** Log an offer once per persona and stage, so the cockpit's decision log fills as the demo runs. */
export function ensureShown(pid: PersonaId, stage: Stage) {
  const s = st();
  if (s.decisions.some((d) => d.personaId === pid && d.stage === stage)) return;
  const r = engineFor(pid);
  recordDecision(pid, r.specialistOnly ? 'review' : 'shown');
}

export function decide(stage: 'first' | 'expanded', value: 'accepted' | 'notNow' | 'open') {
  const s = st();
  const pid = s.personaId;
  if (!pid) return;
  const key = stage === 'first' ? 'firstDecision' : 'expandDecision';
  s.patchJourney({ [key]: value } as Partial<Journey>);
  if (value === 'open') return;
  const r = engineFor(pid);
  if (value === 'accepted' && r.offer) s.pushLog('Rule', 'CircleCheck', m('app.log.accepted', { amount: { sar: r.offer.limit } }));
  if (value === 'notNow') s.pushLog('Rule', 'Clock', m('app.log.notNow'));
  recordDecision(pid, value);
}

// ───────────── Card ─────────────
export function setCardFrozen(pid: PersonaId, frozen: boolean) {
  const s = st();
  s.patchJourney({ cardFrozen: frozen }, pid);
  s.pushLog('Rule', frozen ? 'Lock' : 'LockOpen', m(frozen ? 'app.log.cardFrozen' : 'app.log.cardUnfrozen'));
  if (frozen) s.toast(m('common.toasts.cardFrozen'), 'success');
}

// ───────────── Life events ─────────────
export function lifeEventParams(pid: PersonaId, ev: LifeEventId): Params | undefined {
  if (ev !== 'relocation') return undefined;
  const p = PERSONAS[pid];
  const hub = SERVICE_HUBS[p.city][0];
  return { city: { key: `common.cities.${p.city}` }, hub: { key: `app.help.hubs.${hub.id}` }, km: { key: 'app.help.km', params: { km: hub.km } } };
}

export function triggerLifeEvent(ev: LifeEventId) {
  let s = st();
  let pid = s.personaId;
  if (!pid) {
    pid = PERSONA_ORDER.find((id) => PERSONAS[id].lifeEvent === ev) ?? 'noura';
    pickPersona(pid);
    s = st();
  }
  const j = s.journeys[pid];
  s.patchJourney({ feed: [{ id: uid('ev'), event: ev, ts: Date.now() }, ...j.feed.filter((f) => f.event !== ev)] }, pid);
  const params = lifeEventParams(pid, ev);
  s.pushLog(
    'AI',
    'Sparkles',
    m('app.log.lifeEvent', { event: { key: `common.lifeEvents.${ev}` }, why: { key: `app.lifeEvents.cards.${ev}.why`, params } }),
  );
  if (ev === 'relocation' && params) s.pushLog('Rule', 'MapPin', m('app.log.serviceHub', { hub: params.hub }));
  if (ev === 'firstSalary' && j.month < 1) goToMonth(1, { immediate: true });
  else if (s.phoneTab !== 'home') s.setPhoneTab('home');
}

export function addGoal(pid: PersonaId, id: GoalId, target: number) {
  const s = st();
  const j = s.journeys[pid];
  if (j.goals.some((g) => g.id === id)) return;
  s.patchJourney({ goals: [{ id, target, saved: 0, weight: 0.35 }, ...j.goals] }, pid);
  s.pushLog('Rule', 'Target', m('app.log.goalAdded', { goal: { key: `common.goals.${id}` } }));
}

export function dismissFeed(pid: PersonaId, id: string) {
  const s = st();
  s.patchJourney({ feed: s.journeys[pid].feed.filter((f) => f.id !== id) }, pid);
}

export const STAGE_OF = (j: Journey): 'onboarding' | Stage =>
  j.month === 0 && j.onboard < 5 ? 'onboarding' : j.month < POLICY.SEASONING_MONTHS ? 'seasoning' : j.month < POLICY.EXPANSION_MONTH ? 'first' : 'expanded';
