/**
 * Shared state across all areas. A credit decision or escalation created in the
 * customer app appears live in the bank cockpit; a specialist's reply in the
 * cockpit appears in the customer's chat.
 */
import { createContext, useContext } from 'react';
import { create } from 'zustand';
import {
  GATE_DEFAULTS,
  PERSONAS,
  POLICY,
  type Band,
  type GateInputs,
  type LifeEventId,
  type PersonaGoal,
  type PersonaId,
} from './config/illustrative';
import type { ScenarioId } from './data/deck';
import type { Binding, Stage } from './logic/creditEngine';
import { m, uid, type Msg } from './lib/msg';
import type { Lang } from './lib/format';

export type Area = 'story' | 'app' | 'cockpit' | 'strategy';
export const AREAS: Area[] = ['story', 'app', 'cockpit', 'strategy'];
export type Theme = 'dark' | 'light';
export type PhoneTab = 'home' | 'goals' | 'assistant' | 'card';
export type LogTag = 'AI' | 'Rule' | 'Human' | 'Partner' | 'Simulated';
export type IntentId =
  | 'salary'
  | 'borrow'
  | 'goal'
  | 'fraud'
  | 'complaint'
  | 'human'
  | 'request'
  | 'hardship'
  | 'callback'
  | 'fallback';
export type Priority = 'High' | 'Medium' | 'Low';
export type Sentiment = 'calm' | 'positive' | 'concerned' | 'anxious' | 'frustrated';

export interface LogEntry {
  id: string;
  ts: number;
  tag: LogTag;
  icon: string; // lucide icon name, resolved in the log view
  msg: Msg;
  personaId?: PersonaId;
}

export interface ChatMessage {
  id: string;
  from: 'user' | 'ai' | 'human' | 'system';
  msg: Msg;
  ts: number;
  streaming?: boolean;
  typing?: boolean;
  chips?: string[];
  handoff?: boolean;
}

export interface Ticket {
  id: string;
  personaId: PersonaId | null; // null = synthetic background customer
  customer: Msg;
  intent: IntentId;
  priority: Priority;
  summary: Msg[];
  sentiment: Sentiment;
  nextAction: Msg;
  suggestedReply: Msg;
  status: 'open' | 'replied' | 'resolved';
  createdAt: number;
  repliedAt?: number;
  reply?: string;
  fresh?: boolean;
}

export interface DecisionRecord {
  id: string;
  ts: number;
  personaId: PersonaId;
  month: number;
  tenor: number;
  score: number;
  band: Band;
  stage: Stage;
  limit: number | null;
  binding: Binding | null;
  reasons: Msg[];
  humanReview: boolean;
  policy: string;
  outcome: 'shown' | 'accepted' | 'notNow' | 'specialist' | 'review';
  requested?: number | null;
}

export interface Toast {
  id: string;
  msg: Msg;
  tone: 'info' | 'success' | 'warn' | 'stop';
}

export type DecisionState = 'open' | 'accepted' | 'notNow' | 'specialist';

export interface Journey {
  month: number;
  onboard: number; // 0 id · 1 nafath · 2 liveness · 3 consents · 4 ready · 5 done
  salaryStep: number; // 0 employer · 1 iban · 2 credited · 3 autopilot · 4 goals · 5 done
  split: { bills: number; spending: number; goals: number }; // SAR
  splitApplied: boolean;
  tenor: number;
  firstDecision: DecisionState;
  expandDecision: DecisionState;
  cardOffer: 'open' | 'accepted' | 'notNow';
  cardFrozen: boolean;
  feed: { id: string; event: LifeEventId; ts: number }[];
  seen: { unlock: boolean; expand: boolean };
  goals: PersonaGoal[];
  letterReady: boolean;
}

export type SensSide = 'adverse' | 'base' | 'favourable';
export type PresetId = 'allAdverse' | 'cannibalisation' | 'arpuLed';

/** Autopilot starts at the persona's suggested split; dragging then snaps to SAR 50. */
const splitFor = (id: PersonaId) => {
  const p = PERSONAS[id];
  const bills = Math.round((p.salary * p.split.bills) / 100);
  const goals = Math.round((p.salary * p.split.goals) / 100);
  return { bills, spending: p.salary - bills - goals, goals };
};

export const newJourney = (id: PersonaId): Journey => ({
  month: 0,
  onboard: 0,
  salaryStep: 0,
  split: splitFor(id),
  splitApplied: false,
  tenor: POLICY.TENOR.default,
  firstDecision: 'open',
  expandDecision: 'open',
  cardOffer: 'open',
  cardFrozen: false,
  feed: [],
  seen: { unlock: false, expand: false },
  goals: PERSONAS[id].goals.map((g) => ({ ...g })),
  letterReady: false,
});

const allJourneys = (): Record<PersonaId, Journey> => ({
  faisal: newJourney('faisal'),
  noura: newJourney('noura'),
  abdullah: newJourney('abdullah'),
});

const emptyChats = (): Record<PersonaId, ChatMessage[]> => ({ faisal: [], noura: [], abdullah: [] });

const seedTickets = (): Ticket[] => {
  const now = Date.now();
  return [
    {
      id: 'T-1039',
      personaId: null,
      customer: m('common.seed.customerA'),
      intent: 'complaint',
      priority: 'Medium',
      summary: [m('common.seed.a1'), m('common.seed.a2'), m('common.seed.a3')],
      sentiment: 'concerned',
      nextAction: m('common.seed.aNext'),
      suggestedReply: m('common.seed.aReply'),
      status: 'open',
      createdAt: now - 9 * 60 * 1000,
    },
    {
      id: 'T-1041',
      personaId: null,
      customer: m('common.seed.customerB'),
      intent: 'callback',
      priority: 'Low',
      summary: [m('common.seed.b1'), m('common.seed.b2'), m('common.seed.b3')],
      sentiment: 'calm',
      nextAction: m('common.seed.bNext'),
      suggestedReply: m('common.seed.bReply'),
      status: 'open',
      createdAt: now - 4 * 60 * 1000,
    },
  ];
};

function readPref<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* storage unavailable: preference lasts for this session only */
  }
}

let ticketSeq = 1042;

export interface AppState {
  // global
  area: Area;
  lang: Lang;
  theme: Theme;
  presenter: boolean;
  sourcesOpen: boolean;
  shortcutsOpen: boolean;
  sessionStart: number;
  resetNonce: number;
  setArea: (a: Area) => void;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  toggleTheme: () => void;
  togglePresenter: () => void;
  setSourcesOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;

  // customer app
  personaId: PersonaId | null;
  journeys: Record<PersonaId, Journey>;
  phoneTab: PhoneTab;
  helpOpen: boolean;
  whyOpen: boolean;
  selectPersona: (id: PersonaId | null) => void;
  patchJourney: (patch: Partial<Journey>, id?: PersonaId) => void;
  setPhoneTab: (t: PhoneTab) => void;
  setHelpOpen: (v: boolean) => void;
  setWhyOpen: (v: boolean) => void;

  // engine-room log
  log: LogEntry[];
  pushLog: (tag: LogTag, icon: string, msg: Msg) => void;
  clearLog: () => void;

  // chat
  chats: Record<PersonaId, ChatMessage[]>;
  addChat: (pid: PersonaId, msg: Omit<ChatMessage, 'id' | 'ts'> & { id?: string }) => string;
  patchChat: (pid: PersonaId, id: string, patch: Partial<ChatMessage>) => void;
  lowConfidence: Record<PersonaId, number>;
  setLowConfidence: (pid: PersonaId, n: number) => void;

  // tickets and decisions
  tickets: Ticket[];
  unseenTickets: number;
  addTicket: (t: Omit<Ticket, 'id' | 'createdAt' | 'status'>) => string;
  replyTicket: (id: string, text: string) => void;
  resolveTicket: (id: string) => void;
  markTicketsSeen: () => void;
  decisions: DecisionRecord[];
  addDecision: (d: Omit<DecisionRecord, 'id' | 'ts' | 'policy'>) => void;

  // toasts
  toasts: Toast[];
  toast: (msg: Msg, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;

  // cockpit
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;
  sensLever: number | null;
  sensSide: SensSide;
  sensPreset: PresetId | null;
  setSens: (lever: number | null, side: SensSide) => void;
  setPreset: (p: PresetId | null) => void;
  gateInputs: GateInputs;
  setGateInputs: (patch: Partial<GateInputs>) => void;
  setQuarter: (i: number, v: number) => void;
  resetGates: () => void;


  resetDemo: () => void;
}

const demoState = () => ({
  personaId: null as PersonaId | null,
  journeys: allJourneys(),
  phoneTab: 'home' as PhoneTab,
  helpOpen: false,
  whyOpen: false,
  log: [] as LogEntry[],
  chats: emptyChats(),
  lowConfidence: { faisal: 0, noura: 0, abdullah: 0 } as Record<PersonaId, number>,
  tickets: seedTickets(),
  unseenTickets: 0,
  decisions: [] as DecisionRecord[],
  toasts: [] as Toast[],
  scenario: 'base' as ScenarioId,
  sensLever: null as number | null,
  sensSide: 'base' as SensSide,
  sensPreset: null as PresetId | null,
  gateInputs: { ...GATE_DEFAULTS, quarterly: [...GATE_DEFAULTS.quarterly] },
});

export const useApp = create<AppState>()((set, get) => ({
  area: 'story',
  lang: readPref<Lang>('wafra-next-lang', ['en', 'ar'], 'en'),
  theme: readPref<Theme>('wafra-next-theme', ['dark', 'light'], 'dark'),
  presenter: false,
  sourcesOpen: false,
  shortcutsOpen: false,
  sessionStart: Date.now(),
  resetNonce: 0,
  setArea: (area) => set(area === 'cockpit' ? { area, unseenTickets: 0 } : { area }),
  setLang: (lang) => {
    writePref('wafra-next-lang', lang);
    set({ lang });
  },
  toggleLang: () => get().setLang(get().lang === 'en' ? 'ar' : 'en'),
  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    writePref('wafra-next-theme', theme);
    set({ theme });
  },
  togglePresenter: () => set((s) => ({ presenter: !s.presenter })),
  setSourcesOpen: (sourcesOpen) => set({ sourcesOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

  ...demoState(),

  selectPersona: (personaId) => set({ personaId, phoneTab: 'home', helpOpen: false, whyOpen: false }),
  patchJourney: (patch, id) =>
    set((s) => {
      const pid = id ?? s.personaId;
      if (!pid) return {};
      return { journeys: { ...s.journeys, [pid]: { ...s.journeys[pid], ...patch } } };
    }),
  setPhoneTab: (phoneTab) => set({ phoneTab, helpOpen: false }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setWhyOpen: (whyOpen) => set({ whyOpen }),

  pushLog: (tag, icon, msg) =>
    set((s) => ({
      log: [{ id: uid('log'), ts: Date.now(), tag, icon, msg, personaId: s.personaId ?? undefined }, ...s.log].slice(0, 120),
    })),
  clearLog: () => set({ log: [] }),

  addChat: (pid, msg) => {
    const id = msg.id ?? uid('chat');
    set((s) => ({ chats: { ...s.chats, [pid]: [...s.chats[pid], { ...msg, id, ts: Date.now() }] } }));
    return id;
  },
  patchChat: (pid, id, patch) =>
    set((s) => ({ chats: { ...s.chats, [pid]: s.chats[pid].map((c) => (c.id === id ? { ...c, ...patch } : c)) } })),
  setLowConfidence: (pid, n) => set((s) => ({ lowConfidence: { ...s.lowConfidence, [pid]: n } })),

  addTicket: (t) => {
    const id = `T-${ticketSeq++}`;
    set((s) => ({
      tickets: [{ ...t, id, createdAt: Date.now(), status: 'open', fresh: true }, ...s.tickets],
      unseenTickets: s.area === 'cockpit' ? 0 : s.unseenTickets + 1,
    }));
    return id;
  },
  replyTicket: (id, text) => {
    const t = get().tickets.find((x) => x.id === id);
    if (!t) return;
    set((s) => ({
      tickets: s.tickets.map((x) => (x.id === id ? { ...x, status: 'replied', reply: text, repliedAt: Date.now(), fresh: false } : x)),
    }));
    if (t.personaId) {
      get().addChat(t.personaId, { from: 'human', msg: { text } });
      get().pushLog('Human', 'Headset', m('app.log.specialistReplied', { id }));
    }
  },
  resolveTicket: (id) =>
    set((s) => ({ tickets: s.tickets.map((x) => (x.id === id ? { ...x, status: 'resolved', fresh: false } : x)) })),
  markTicketsSeen: () => set({ unseenTickets: 0 }),

  addDecision: (d) =>
    set((s) => ({ decisions: [{ ...d, id: uid('dec'), ts: Date.now(), policy: POLICY.version }, ...s.decisions].slice(0, 60) })),

  toast: (msg, tone = 'info') => {
    const id = uid('toast');
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, msg, tone }] }));
    setTimeout(() => get().dismissToast(id), 3600);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setScenario: (scenario) => set({ scenario }),
  setSens: (lever, side) => {
    const s = get();
    const switching = lever !== null && side !== 'base' && s.sensLever !== null && s.sensLever !== lever && s.sensSide !== 'base';
    if (switching || (lever !== null && side !== 'base' && s.sensPreset)) s.toast(m('common.toasts.oneLever'), 'info');
    set({ sensLever: side === 'base' ? null : lever, sensSide: side, sensPreset: null });
  },
  setPreset: (sensPreset) => {
    const s = get();
    if (sensPreset && s.sensLever !== null && s.sensSide !== 'base') s.toast(m('common.toasts.oneLever'), 'info');
    set({ sensPreset, sensLever: null, sensSide: 'base' });
  },
  setGateInputs: (patch) => set((s) => ({ gateInputs: { ...s.gateInputs, ...patch } })),
  setQuarter: (i, v) =>
    set((s) => {
      const quarterly = [...s.gateInputs.quarterly];
      quarterly[i] = Math.round(v * 10) / 10;
      return { gateInputs: { ...s.gateInputs, quarterly } };
    }),
  resetGates: () => set({ gateInputs: { ...GATE_DEFAULTS, quarterly: [...GATE_DEFAULTS.quarterly] } }),


  resetDemo: () => {
    ticketSeq = 1042;
    set((s) => ({ ...demoState(), resetNonce: s.resetNonce + 1, sessionStart: Date.now() }));
  },
}));

/**
 * Snapshot of the journey for a phone screen. A screen that is animating out
 * keeps the journey it was rendered with, so it never flashes the next step.
 */
export const JourneySnapshot = createContext<Journey | null>(null);

/** Current persona's journey (or null on the welcome screen). */
export const useJourney = () => {
  const snap = useContext(JourneySnapshot);
  const live = useApp((s) => (s.personaId ? s.journeys[s.personaId] : null));
  return snap ?? live;
};
