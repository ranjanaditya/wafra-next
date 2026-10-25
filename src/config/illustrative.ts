/**
 * ILLUSTRATIVE configuration. Every value here is a prototype setting, persona
 * detail or pilot input, not a figure from the team's model. The UI tags these
 * values with an "Illustrative" label. Change them here and nowhere else.
 */

// Sub-brand placeholder: rename in one place.
export const BRAND = { en: 'Wafra Next', ar: 'وفرة نكست' } as const;

export type Band = 'A' | 'B' | 'C' | 'D';
export type PersonaId = 'faisal' | 'noura' | 'abdullah';
export type IncomeType = 'fixed' | 'variable';

export const POLICY = {
  version: 'v0.1-illustrative',
  DBR_CAP: 0.33, // share of monthly salary; to be confirmed against SAMA responsible-lending rules
  BAND_CAP: { A: 35000, B: 25000, C: 15000, D: null } as Record<Band, number | null>,
  STARTING_MULTIPLE: 1, // x monthly salary, first financing from month 6
  EXPANDED_MULTIPLE: 3, // x monthly salary, from month 12 after six on-time repayments
  SEASONING_MONTHS: 6,
  EXPANSION_MONTH: 12,
  ROUND_TO: 500,
  APR: { A: 0.055, B: 0.065, C: 0.08 } as Record<Exclude<Band, 'D'>, number>,
  TENOR: { default: 36, min: 12, max: 60, step: 6 },
  BAND_THRESHOLDS: { A: 80, B: 65, C: 50 },
  POINTS_MAX: { income: 20, seasoning: 15, affordability: 25, history: 25, behaviour: 15 },
} as const;

export const TIMELINE = {
  maxMonth: 18,
  accountMonth: 0,
  firstSalaryMonth: 1,
  chevrons: [
    { id: 'account', from: 0, to: 0, jump: 0 },
    { id: 'salary', from: 1, to: 1, jump: 1 },
    { id: 'seasoning', from: 2, to: 5, jump: 3 },
    { id: 'financing', from: 6, to: 11, jump: 6 },
    { id: 'expand', from: 12, to: 18, jump: 12 },
  ],
  /** Synthetic calendar for goal projections: month 0 is January 2027 (FY27 launch). */
  start: { year: 2027, month: 0 },
} as const;

export type GoalId = 'car' | 'wedding' | 'umrah' | 'emergency';
export interface PersonaGoal {
  id: GoalId;
  target: number; // SAR
  saved: number; // SAR at account opening (synthetic)
  weight: number; // share of the monthly goals pot
}
export type LifeEventId = 'firstSalary' | 'graduation' | 'relocation' | 'marriage';

export interface Persona {
  id: PersonaId;
  initials: string;
  age: number;
  city: 'riyadh' | 'jeddah' | 'dammam';
  employer: EmployerId;
  incomeType: IncomeType;
  salary: number; // SAR a month (variable income: average)
  commitments: number; // SAR a month, simulated credit-bureau check
  historyAtOpening: number; // months of credit history at account opening
  behaviour: number; // account-behaviour points, 0 to 15
  lifeEvent: LifeEventId;
  split: { bills: number; spending: number; goals: number }; // autopilot %, sums to 100
  pattern: { bills: number[]; spending: number[]; goals: number[] }; // synthetic last three months, SAR
  goals: PersonaGoal[];
  salaryDay: number;
  gradient: [string, string];
  maskedId: string;
  maskedIban: string;
  cardLast4: string;
}

export type EmployerId = 'najdDigital' | 'baytDesign' | 'gulfCoast' | 'sarabHealth' | 'rimalRetail';
export const EMPLOYERS: { id: EmployerId; partner: boolean }[] = [
  { id: 'najdDigital', partner: true },
  { id: 'baytDesign', partner: true },
  { id: 'gulfCoast', partner: true },
  { id: 'sarabHealth', partner: true },
  { id: 'rimalRetail', partner: false },
];

export const PERSONAS: Record<PersonaId, Persona> = {
  faisal: {
    id: 'faisal',
    initials: 'FA',
    age: 26,
    city: 'riyadh',
    employer: 'najdDigital',
    incomeType: 'fixed',
    salary: 14000,
    commitments: 1200,
    historyAtOpening: 30,
    behaviour: 13,
    lifeEvent: 'marriage',
    split: { bills: 35, spending: 40, goals: 25 },
    pattern: { bills: [4850, 4950, 4900], spending: [5700, 5500, 5650], goals: [3450, 3550, 3450] },
    goals: [
      { id: 'wedding', target: 60000, saved: 18000, weight: 0.6 },
      { id: 'emergency', target: 20000, saved: 6000, weight: 0.25 },
      { id: 'umrah', target: 8000, saved: 1500, weight: 0.15 },
    ],
    salaryDay: 27,
    gradient: ['#E5243B', '#E9C46A'],
    maskedId: '1•••••••42',
    maskedIban: 'SA•• 80•• •••• •••• 2741',
    cardLast4: '2741',
  },
  noura: {
    id: 'noura',
    initials: 'NO',
    age: 23,
    city: 'jeddah',
    employer: 'baytDesign',
    incomeType: 'fixed',
    salary: 8500,
    commitments: 0,
    historyAtOpening: 2,
    behaviour: 10,
    lifeEvent: 'firstSalary',
    split: { bills: 30, spending: 45, goals: 25 },
    pattern: { bills: [2500, 2600, 2550], spending: [3900, 3800, 3850], goals: [2100, 2100, 2100] },
    goals: [
      { id: 'car', target: 15000, saved: 0, weight: 0.7 },
      { id: 'emergency', target: 10000, saved: 0, weight: 0.2 },
      { id: 'umrah', target: 6000, saved: 0, weight: 0.1 },
    ],
    salaryDay: 25,
    gradient: ['#8B5CF6', '#E5243B'],
    maskedId: '1•••••••87',
    maskedIban: 'SA•• 80•• •••• •••• 5530',
    cardLast4: '5530',
  },
  abdullah: {
    id: 'abdullah',
    initials: 'AB',
    age: 31,
    city: 'dammam',
    employer: 'gulfCoast',
    incomeType: 'variable',
    salary: 12000,
    commitments: 3600,
    historyAtOpening: 40,
    behaviour: 6,
    lifeEvent: 'relocation',
    split: { bills: 45, spending: 40, goals: 15 },
    pattern: { bills: [5300, 5500, 5400], spending: [4900, 4700, 4800], goals: [1800, 1800, 1800] },
    goals: [
      { id: 'emergency', target: 36000, saved: 4000, weight: 0.8 },
      { id: 'car', target: 25000, saved: 0, weight: 0.2 },
    ],
    salaryDay: 28,
    gradient: ['#E9C46A', '#2DD4BF'],
    maskedId: '1•••••••19',
    maskedIban: 'SA•• 80•• •••• •••• 0916',
    cardLast4: '0916',
  },
};
export const PERSONA_ORDER: PersonaId[] = ['faisal', 'noura', 'abdullah'];

/** Autopilot donut snaps to SAR 50. */
export const AUTOPILOT_SNAP = 50;

/** Service hubs: the existing 24 branches act as service hubs (no new branches). Distances illustrative. */
export const SERVICE_HUBS: Record<Persona['city'], { id: string; km: number }[]> = {
  riyadh: [
    { id: 'olaya', km: 2.4 },
    { id: 'malqa', km: 6.8 },
  ],
  jeddah: [
    { id: 'rawdah', km: 3.1 },
    { id: 'tahlia', km: 5.2 },
  ],
  dammam: [
    { id: 'faisaliyah', km: 4.0 },
    { id: 'khobar', km: 9.5 },
  ],
};

/** Synthetic card transactions for the security moment. */
export const TRANSACTIONS = [
  { id: 'tx1', merchant: 'qahwa', amount: -18, flagged: false },
  { id: 'tx2', merchant: 'souq', amount: -249, flagged: false },
  { id: 'tx3', merchant: 'unknown', amount: -1150, flagged: true },
  { id: 'tx4', merchant: 'fuel', amount: -95, flagged: false },
] as const;

/** Gate simulator defaults ("on plan") and slider ranges. */
export const GATE_DEFAULTS = {
  approvedG1: 0.07,
  approvedG2: 0.18,
  approvedG3: 0.33,
  activation: 60,
  cac: 250,
  retention: 80,
  cor: 2.5,
  primary: 40,
  lossNarrowing: true,
  quarterly: [2.2, 2.4, 2.5, 2.6, 2.4, 2.5, 2.7, 2.5],
};
export type GateInputs = typeof GATE_DEFAULTS;

export const GATE_RANGES = {
  approved: { min: 0, max: 0.5, step: 0.01 },
  activation: { min: 40, max: 75, step: 1 },
  cac: { min: 150, max: 450, step: 10 },
  retention: { min: 60, max: 90, step: 1 },
  cor: { min: 1.5, max: 5.0, step: 0.1 },
  primary: { min: 20, max: 50, step: 1 },
  quarterly: { min: 1.0, max: 5.0, step: 0.1 },
} as const;

/** Optional LLM endpoint for free-text answers (falls back to scripts on error or after 3 s). */
export const ASSISTANT = {
  endpoint: (import.meta.env?.VITE_ASK_WAFRA_ENDPOINT as string | undefined) ?? '',
  timeoutMs: 3000,
  systemPrompt:
    'You are Ask Wafra, the in-app assistant of a youth digital bank in Saudi Arabia. This is a prototype with synthetic data. Reply in the user\'s language (English or Arabic) in one to three short, warm, plain sentences. Use only facts given in context (persona data and credit-engine output). Never promise approval, never give investment advice, and never ask for passwords, one-time codes or ID numbers. Explain the reason behind any number you mention. Hand off to a human when the user asks, mentions fraud, a complaint or hardship, or wants more credit than offered. When handing off, return JSON: {escalate: true, summary: [three bullets], priority, nextAction}.',
};
