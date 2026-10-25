/**
 * "Ask Wafra" assistant: a deterministic intent engine (English and Arabic
 * keywords) with scripted, persona-aware answers, so the live demo cannot fail.
 * Optional LLM: if VITE_ASK_WAFRA_ENDPOINT is set, low-stakes free text goes to
 * it (3-second timeout, scripted fallback). Safety intents are always scripted.
 */
import { useApp, type IntentId, type Priority, type Sentiment } from '../store';
import { ASSISTANT, PERSONAS, TRANSACTIONS, type PersonaId } from '../config/illustrative';
import { renderMsg } from '../i18n';
import { m, raw, type Msg, type Params } from '../lib/msg';
import type { CreditResult } from './creditEngine';
import { engineFor, projectGoals, setCardFrozen, STAGE_OF, recordDecision } from './journey';

const st = () => useApp.getState();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ───────────── Intent detection ─────────────
const KW: [IntentId | 'thanks', RegExp][] = [
  ['fraud', /(fraud|stolen|lost (my )?card|recogni[sz]e|didn'?t make|unknown (charge|transaction|payment)|hack|scam|احتيال|سرق|مسروق|ضاعت|فقدت البطاقة|ضايعة|عملية غريبة|ما اعرف|ما أعرف|لا أعرف|لا اعرف|مو أنا|مب أنا)/i],
  ['hardship', /(can'?t pay|cannot pay|struggl|lost my job|hardship|in debt|behind on|late payment|difficult time|ما أقدر أسدد|ما اقدر اسدد|صعوبة|ضائقة|فقدت وظيفتي|ديون|متعثر|متأخر في السداد)/i],
  ['complaint', /(complain|complaint|dispute|charged twice|double charge|wrong charge|refund|unacceptable|شكوى|اعتراض|خصم خاطئ|مرتين|استرداد|غير مقبول)/i],
  ['human', /(person|human|agent|specialist|someone|representative|call me|talk to|speak to|موظف|شخص|إنسان|انسان|مختص|أكلم|اكلم|كلمني|اتصل)/i],
  ['borrow', /(borrow|loan|financ|limit|credit|how much can|qualif|اقترض|أقترض|قرض|تمويل|سلفة|حد|حدي|كم أقدر|كم اقدر|ائتمان)/i],
  ['goal', /(goal|sav(e|ing)|put aside|wedding fund|هدف|ادخار|أدخر|ادخر|توفير|أوفر)/i],
  ['salary', /(salary|payday|pay day|paid|wage|راتب|الراتب|رواتب|ينزل)/i],
  ['thanks', /(thank|thanks|great|perfect|شكر|مشكور|يعطيك العافية|تمام)/i],
];

export interface Detection {
  intent: IntentId | 'thanks';
  confidence: number;
  amount: number | null;
}

export const normalizeDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[٬،]/g, ',');

/** Largest SAR-like amount in the text (ignores month counts). */
export function parseAmount(text: string): number | null {
  const t = normalizeDigits(text.toLowerCase());
  let best: number | null = null;
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|الف|ألف|آلاف)?\s*(months?|شهر|أشهر|اشهر)?/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(t))) {
    if (mm[3]) continue;
    let v = Number(mm[1].replace(/,/g, ''));
    if (mm[2]) v *= 1000;
    if (v >= 500 && (best === null || v > best)) best = v;
  }
  return best;
}

export function detect(text: string): Detection {
  const amount = parseAmount(text);
  for (const [intent, re] of KW) {
    if (re.test(text)) {
      if (intent === 'borrow' && amount !== null) return { intent: 'request', confidence: 0.92, amount };
      return { intent, confidence: intent === 'thanks' ? 0.8 : 0.9, amount };
    }
  }
  if (amount !== null) return { intent: 'request', confidence: 0.7, amount };
  return { intent: 'fallback', confidence: 0.3, amount: null };
}

export function sentimentOf(text: string, intent: IntentId | 'thanks'): Sentiment {
  if (/(angry|terrible|worst|unacceptable|ridiculous|غاضب|سيئ|سيء|غير مقبول|زعلان)/i.test(text)) return 'frustrated';
  if (intent === 'fraud' || intent === 'hardship' || /(worried|scared|urgent|help|قلق|خايف|عاجل|ساعدني)/i.test(text)) return 'anxious';
  if (intent === 'complaint') return 'concerned';
  if (intent === 'thanks') return 'positive';
  return 'calm';
}

// ───────────── Answers ─────────────
interface Escalation {
  intent: IntentId;
  priority: Priority;
  sentiment: Sentiment;
  summary: Msg[];
  nextAction: Msg;
  suggestedReply: Msg;
}
interface Reply {
  answer: Msg;
  chips?: string[];
  escalate?: Escalation;
  freeze?: boolean;
}

const nameP = (pid: PersonaId) => ({ key: `common.personas.${pid}.name` });
const sarP = (v: number) => ({ sar: Math.round(v) });

function because(r: CreditResult): { key: string; params?: Params } {
  const b = r.offer!.binding;
  return {
    key: `app.assistant.ans.because.${b}`,
    params: b === 'bandCap' ? { b: r.band } : b === 'affordability' ? { headroom: sarP(r.offer!.maxInstalment) } : undefined,
  };
}

function stageP(pid: PersonaId) {
  return { key: `app.assistant.stage.${STAGE_OF(st().journeys[pid])}` };
}

function incomeLine(pid: PersonaId): Msg {
  const p = PERSONAS[pid];
  return p.incomeType === 'variable' ? m('app.assistant.sum.incomeVariable', { salary: sarP(p.salary) }) : m('app.assistant.sum.incomeFixed', { salary: sarP(p.salary) });
}

function commitmentsLine(pid: PersonaId): Msg {
  const p = PERSONAS[pid];
  return m('app.assistant.sum.commitments', { amount: sarP(p.commitments), pct: { pct: Math.round((p.commitments / p.salary) * 100) } });
}

/** Financing-review escalation: three-bullet AI summary, suggested action and a pre-filled specialist reply. */
export function financingReview(pid: PersonaId, requested: number | null, sentiment: Sentiment = 'calm'): Escalation {
  const p = PERSONAS[pid];
  const j = st().journeys[pid];
  const r = engineFor(pid, j.month, j.tenor, requested);
  const third: Msg =
    r.stage === 'seasoning'
      ? m('app.assistant.sum.seasoning', { m: j.month, band: r.band })
      : !r.offer
        ? m('app.assistant.sum.noOffer', { band: r.band })
        : requested
          ? m('app.assistant.sum.offerRequest', { band: r.band, limit: sarP(r.offer.limit), n: j.tenor, binding: { key: `app.why.bindingShort.${r.offer.binding}` }, requested: sarP(requested) })
          : m('app.assistant.sum.offer', { band: r.band, limit: sarP(r.offer.limit), n: j.tenor, binding: { key: `app.why.bindingShort.${r.offer.binding}` } });
  const altTenor = j.tenor < 48 ? 48 : 60;
  const alt = engineFor(pid, Math.max(j.month, 6), altTenor);
  const altOffer = alt.offer ?? r.offer;
  const nextAction = m(p.incomeType === 'variable' ? 'app.assistant.next.reviewVariable' : 'app.assistant.next.reviewFixed', { n: altTenor });
  const suggestedReply = altOffer
    ? requested
      ? m('app.assistant.reply.review', { name: nameP(pid), requested: sarP(requested), n: altTenor, limit: sarP(altOffer.limit), instalment: sarP(altOffer.instalment) })
      : m('app.assistant.reply.reviewNoReq', { name: nameP(pid), n: altTenor, limit: sarP(altOffer.limit), instalment: sarP(altOffer.instalment) })
    : m('app.assistant.reply.human', { name: nameP(pid) });
  return { intent: 'request', priority: 'Medium', sentiment, summary: [incomeLine(pid), commitmentsLine(pid), third], nextAction, suggestedReply };
}

function fraudEscalation(pid: PersonaId): Escalation {
  const tx = TRANSACTIONS.find((t) => t.flagged)!;
  const j = st().journeys[pid];
  return {
    intent: 'fraud',
    priority: 'High',
    sentiment: 'anxious',
    summary: [
      m('app.assistant.sum.fraud1', { amount: sarP(Math.abs(tx.amount)), merchant: { key: `app.card.merchants.${tx.merchant}` } }),
      m('app.assistant.sum.fraud2'),
      m('app.assistant.sum.fraud3', { m: j.month }),
    ],
    nextAction: m('app.assistant.next.fraud'),
    suggestedReply: m('app.assistant.reply.fraud', { name: nameP(pid), amount: sarP(Math.abs(tx.amount)) }),
  };
}

const snippet = (text: string) => (text.length > 60 ? `${text.slice(0, 57)}…` : text);

function respond(pid: PersonaId, det: Detection, text: string, lastTopic: string): Reply {
  const p = PERSONAS[pid];
  const j = st().journeys[pid];
  const r = engineFor(pid, j.month, j.tenor, det.amount);
  const sentiment = sentimentOf(text, det.intent);
  switch (det.intent) {
    case 'salary':
      if (j.month < 1 || j.salaryStep < 2) return { answer: m('app.assistant.ans.salaryNone') };
      return {
        answer: m('app.assistant.ans.salary', {
          amount: sarP(p.salary),
          employer: { key: `common.employers.${p.employer}` },
          day: p.salaryDay,
          b: sarP(j.split.bills),
          s: sarP(j.split.spending),
          g: sarP(j.split.goals),
        }),
      };
    case 'borrow': {
      if (r.stage === 'seasoning') return { answer: m('app.assistant.ans.borrowSeasoning', { m: j.month, score: r.score.toFixed(1), band: r.band }) };
      if (!r.offer) return { answer: m('app.assistant.ans.borrowSpecialist', { score: r.score.toFixed(1), band: r.band }), chips: ['human'] };
      const base = { limit: sarP(r.offer.limit), because: because(r), score: r.score.toFixed(1), band: r.band, n: j.tenor, instalment: sarP(r.offer.instalment) };
      return r.stage === 'first'
        ? { answer: m('app.assistant.ans.borrowOffer', { ...base, cost: sarP(r.offer.totalProfitCost) }), chips: r.humanReview ? ['human'] : undefined }
        : { answer: m('app.assistant.ans.borrowExpanded', base) };
    }
    case 'request': {
      const amt = det.amount ?? 0;
      if (r.stage === 'seasoning') return { answer: m('app.assistant.ans.requestSeasoning', { requested: sarP(amt), m: j.month }), escalate: financingReview(pid, amt, sentiment) };
      if (!r.offer) return { answer: m('app.assistant.ans.borrowSpecialist', { score: r.score.toFixed(1), band: r.band }), escalate: financingReview(pid, amt, sentiment) };
      if (amt > r.offer.limit) {
        return {
          answer: m('app.assistant.ans.requestAbove', { limit: sarP(r.offer.limit), n: j.tenor, because: because(r), requested: sarP(amt) }),
          escalate: financingReview(pid, amt, sentiment),
        };
      }
      return { answer: m('app.assistant.ans.requestWithin', { requested: sarP(amt), limit: sarP(r.offer.limit) }) };
    }
    case 'goal': {
      const g = projectGoals(j)[0];
      if (!g) return { answer: m('app.assistant.ans.fallback'), chips: ['human'] };
      return {
        answer: m('app.assistant.ans.goal', {
          goal: { key: `common.goals.${g.id}` },
          target: sarP(g.target),
          monthly: sarP(g.monthly),
          date: g.date ? { ym: { y: g.date.year, m0: g.date.month0 } } : '—',
        }),
      };
    }
    case 'fraud':
      return { answer: m('app.assistant.ans.fraud'), freeze: true, escalate: fraudEscalation(pid) };
    case 'complaint':
      return {
        answer: m('app.assistant.ans.complaint'),
        escalate: {
          intent: 'complaint',
          priority: 'Medium',
          sentiment,
          summary: [m('app.assistant.sum.complaint1'), m('app.assistant.sum.quote', { snippet: snippet(text) }), m('app.assistant.sum.context', { m: j.month, stage: stageP(pid) })],
          nextAction: m('app.assistant.next.complaint'),
          suggestedReply: m('app.assistant.reply.complaint', { name: nameP(pid) }),
        },
      };
    case 'hardship':
      return {
        answer: m('app.assistant.ans.hardship'),
        escalate: {
          intent: 'hardship',
          priority: 'Medium',
          sentiment: 'anxious',
          summary: [m('app.assistant.sum.hardship1'), commitmentsLine(pid), j.firstDecision === 'accepted' ? m('app.assistant.sum.context', { m: j.month, stage: stageP(pid) }) : m('app.assistant.sum.noFinancing')],
          nextAction: m('app.assistant.next.hardship'),
          suggestedReply: m('app.assistant.reply.hardship', { name: nameP(pid) }),
        },
      };
    case 'human':
      return {
        answer: m('app.assistant.ans.human'),
        escalate: {
          intent: 'human',
          priority: r.stage !== 'seasoning' && r.humanReview ? 'Medium' : 'Low',
          sentiment,
          summary: [m('app.assistant.sum.human1'), m('app.assistant.sum.context', { m: j.month, stage: stageP(pid) }), m('app.assistant.sum.lastTopic', { topic: { key: `common.intents.${lastTopic}` } })],
          nextAction: m('app.assistant.next.human'),
          suggestedReply: m('app.assistant.reply.human', { name: nameP(pid) }),
        },
      };
    case 'thanks':
      return { answer: m('app.assistant.ans.thanks') };
    default:
      return { answer: m('app.assistant.ans.fallback'), chips: ['salary', 'borrow', 'goal', 'human'] };
  }
}

// ───────────── Optional LLM ─────────────
async function callLLM(pid: PersonaId, text: string): Promise<{ reply: string } | null> {
  if (!ASSISTANT.endpoint) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ASSISTANT.timeoutMs);
  try {
    const j = st().journeys[pid];
    const r = engineFor(pid);
    const p = PERSONAS[pid];
    const res = await fetch(ASSISTANT.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        system: ASSISTANT.systemPrompt,
        messages: [{ role: 'user', content: text }],
        context: {
          persona: { salary: p.salary, incomeType: p.incomeType, commitments: p.commitments, month: j.month, synthetic: true },
          engine: { score: r.score, band: r.band, stage: r.stage, limit: r.offer?.limit ?? null, binding: r.offer?.binding ?? null, tenor: j.tenor },
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply?: unknown };
    return typeof data.reply === 'string' && data.reply.trim() ? { reply: data.reply.trim() } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ───────────── Orchestration ─────────────
const streamMs = (msg: Msg) => Math.min(2600, 260 + renderMsg(msg, st().lang).length * 12);
const lastTopicOf: Partial<Record<PersonaId, string>> = {};
let busy = false;

/** Post the handoff message and create the ticket (appears in the cockpit queue immediately). */
export async function escalate(pid: PersonaId, e: Escalation) {
  const s = st();
  const id = s.addTicket({
    personaId: pid,
    customer: nameP(pid),
    intent: e.intent,
    priority: e.priority,
    summary: e.summary,
    sentiment: e.sentiment,
    nextAction: e.nextAction,
    suggestedReply: e.suggestedReply,
  });
  s.pushLog('Human', 'Headset', m('app.log.escalated', { id, p: { key: `common.priority.${e.priority}` } }));
  if (e.priority === 'High') s.pushLog('Rule', 'Siren', m('app.log.fraudEscalated'));
  const handoff = m('app.assistant.handoff');
  const hid = s.addChat(pid, { from: 'ai', msg: handoff, handoff: true, streaming: true });
  s.toast(m('common.toasts.ticketArrived', { id }), 'info');
  await sleep(streamMs(handoff));
  st().patchChat(pid, hid, { streaming: false });
  st().addChat(pid, { from: 'system', msg: m('app.assistant.ticket', { id, p: { key: `common.priority.${e.priority}` } }) });
  return id;
}

export function greet(pid: PersonaId) {
  const s = st();
  if (s.chats[pid].length === 0) s.addChat(pid, { from: 'ai', msg: m('app.assistant.greeting', { name: nameP(pid) }), chips: chipsFor(pid) });
}

export function chipsFor(pid: PersonaId): string[] {
  const base = ['salary', 'borrow', 'goal', 'fraud', 'human'];
  return pid === 'abdullah' ? ['request', ...base] : base;
}

/** Ask a question (free text or a quick-reply chip). */
export async function ask(pid: PersonaId, text: string, chip?: IntentId) {
  if (busy) return;
  busy = true;
  try {
    const s = st();
    greet(pid);
    s.addChat(pid, { from: 'user', msg: chip ? m(`app.assistant.chips.${chip}`) : raw(text) });
    const det: Detection = chip
      ? { intent: chip, confidence: 1, amount: chip === 'request' ? 20000 : null }
      : detect(text);
    s.pushLog('AI', 'Sparkles', m('app.log.intent', { intent: { key: `common.intents.${det.intent === 'thanks' ? 'fallback' : det.intent}` }, conf: det.confidence.toFixed(2) }));
    const typingId = s.addChat(pid, { from: 'ai', msg: {}, typing: true });
    await sleep(700);

    let reply: Reply;
    const lc = st().lowConfidence[pid];
    if (det.intent === 'fallback') {
      st().setLowConfidence(pid, lc + 1);
      if (lc + 1 >= 2) {
        const j = st().journeys[pid];
        reply = {
          answer: m('app.assistant.ans.lowConfidence'),
          escalate: {
            intent: 'fallback',
            priority: 'Low',
            sentiment: sentimentOf(text, 'fallback'),
            summary: [m('app.assistant.sum.lowConf1'), m('app.assistant.sum.quote', { snippet: snippet(text) }), m('app.assistant.sum.context', { m: j.month, stage: stageP(pid) })],
            nextAction: m('app.assistant.next.clarify'),
            suggestedReply: m('app.assistant.reply.clarify', { name: nameP(pid) }),
          },
        };
        st().setLowConfidence(pid, 0);
      } else reply = respond(pid, det, text, lastTopicOf[pid] ?? 'fallback');
    } else {
      st().setLowConfidence(pid, 0);
      reply = respond(pid, det, text, lastTopicOf[pid] ?? 'fallback');
    }

    // Optional LLM for low-stakes free text; safety intents stay scripted.
    if (!chip && ASSISTANT.endpoint && !reply.escalate && ['salary', 'borrow', 'goal', 'thanks', 'fallback'].includes(det.intent)) {
      const llm = await callLLM(pid, text);
      if (llm) reply = { answer: raw(llm.reply) };
      else st().pushLog('Rule', 'CircleSlash', m('app.log.llm'));
    }

    if (det.intent !== 'fallback' && det.intent !== 'thanks') lastTopicOf[pid] = det.intent;
    st().patchChat(pid, typingId, { typing: false, streaming: true, msg: reply.answer, chips: reply.chips });
    await sleep(streamMs(reply.answer));
    st().patchChat(pid, typingId, { streaming: false });

    if (reply.freeze && !st().journeys[pid].cardFrozen) setCardFrozen(pid, true);
    if (reply.escalate) {
      if (reply.escalate.intent === 'request') {
        st().pushLog('Rule', 'UserCheck', m('app.log.humanReview', { why: { key: 'app.review.request' } }));
        const lim = engineFor(pid).offer?.limit ?? 0;
        if (det.amount) st().pushLog('Rule', 'Scale', m('app.log.requestAbove', { requested: sarP(det.amount), limit: sarP(lim) }));
        recordDecision(pid, 'review', det.amount);
      }
      await escalate(pid, reply.escalate);
    }
  } finally {
    busy = false;
  }
}

/** "Talk to a specialist" from a financing screen. */
export async function requestSpecialist(pid: PersonaId, stage: 'first' | 'expanded') {
  const s = st();
  s.patchJourney(stage === 'first' ? { firstDecision: 'specialist' } : { expandDecision: 'specialist' }, pid);
  s.pushLog('Human', 'UserRound', m('app.log.specialist'));
  recordDecision(pid, 'specialist');
  greet(pid);
  s.setPhoneTab('assistant');
  await escalate(pid, financingReview(pid, null));
}

/** Security moment: one-tap freeze plus priority escalation to the fraud team. */
export async function reportUnrecognised(pid: PersonaId) {
  if (!st().journeys[pid].cardFrozen) setCardFrozen(pid, true);
  greet(pid);
  st().addChat(pid, { from: 'user', msg: m('app.assistant.chips.fraud') });
  st().addChat(pid, { from: 'ai', msg: m('app.assistant.ans.fraud') });
  await escalate(pid, fraudEscalation(pid));
}

/** Call-back booked from the Human help sheet. */
export async function bookCallback(pid: PersonaId, slot: 'today' | 'tomorrow') {
  const s = st();
  const j = s.journeys[pid];
  const slotP = { key: `app.help.slots.${slot}` };
  s.pushLog('Human', 'PhoneCall', m('app.log.callback', { slot: slotP }));
  s.addTicket({
    personaId: pid,
    customer: nameP(pid),
    intent: 'callback',
    priority: 'Low',
    summary: [
      m('app.assistant.sum.callback1', { slot: slotP }),
      m('app.assistant.sum.context', { m: j.month, stage: stageP(pid) }),
      m('app.assistant.sum.language', { lang: s.lang === 'ar' ? 'العربية' : 'English' }),
    ],
    sentiment: 'calm',
    nextAction: m('app.assistant.next.callback'),
    suggestedReply: m('app.assistant.reply.callback', { name: nameP(pid), slot: slotP }),
  });
}
