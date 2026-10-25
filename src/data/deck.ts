/**
 * DECK DATA: exact figures from the team's deck and five-year model.
 * Display every value exactly as given here. Never re-round, interpolate or
 * recompute totals from rounded lines (the model uses unrounded values).
 * Units: SAR m unless stated. FY = Wafra fiscal year. Negative numbers are
 * stored as negatives and shown in parentheses in P&L tables.
 * Labels live in the i18n dictionaries, keyed by the ids used here.
 */

// ───────────────────────── Sources and provenance ─────────────────────────
export type Prov = 'CASE' | 'TEAM' | 'REPORT' | 'GASTAT' | 'SAMA' | 'FSDP' | 'PUBLIC' | 'ILLUS';

export type SourceId =
  | 'gastatPop'
  | 'gastatIct'
  | 'gastatLfs'
  | 'samaBulletin'
  | 'samaArabNews'
  | 'samaFsr'
  | 'fsdp'
  | 'alRajhi'
  | 'digitalBanker'
  | 'menaStartup'
  | 'caseDeck'
  | 'report'
  | 'teamModel'
  | 'teamMarket'
  | 'teamSens'
  | 'teamScoring'
  | 'teamGates'
  | 'teamView'
  | 'illustrative';

export const SOURCES: Record<SourceId, { prov: Prov }> = {
  gastatPop: { prov: 'GASTAT' },
  gastatIct: { prov: 'GASTAT' },
  gastatLfs: { prov: 'GASTAT' },
  samaBulletin: { prov: 'SAMA' },
  samaArabNews: { prov: 'SAMA' },
  samaFsr: { prov: 'SAMA' },
  fsdp: { prov: 'FSDP' },
  alRajhi: { prov: 'PUBLIC' },
  digitalBanker: { prov: 'PUBLIC' },
  menaStartup: { prov: 'PUBLIC' },
  caseDeck: { prov: 'CASE' },
  report: { prov: 'REPORT' },
  teamModel: { prov: 'TEAM' },
  teamMarket: { prov: 'TEAM' },
  teamSens: { prov: 'TEAM' },
  teamScoring: { prov: 'TEAM' },
  teamGates: { prov: 'TEAM' },
  teamView: { prov: 'TEAM' },
  illustrative: { prov: 'ILLUS' },
};

/** The Sources drawer lists these, in this order. */
export const SOURCE_DRAWER: SourceId[] = [
  'gastatPop',
  'gastatIct',
  'gastatLfs',
  'samaBulletin',
  'samaArabNews',
  'samaFsr',
  'fsdp',
  'alRajhi',
  'digitalBanker',
  'menaStartup',
  'caseDeck',
  'report',
  'teamModel',
];

export const FY = ['FY27', 'FY28', 'FY29', 'FY30', 'FY31'] as const;
export type FYKey = (typeof FY)[number];

// ───────────────────────── Market ─────────────────────────
export const MARKET = {
  saudis2034: 5081601, // 5.08m
  saudis2034Short: 5.08, // m
  shareOfSaudis: 25.9, // %
  allSaudis: 19635258,
  serviceablePct: 90, // %, team estimate
  serviceable: 4.57, // m
  arpu: { low: 350, base: 500, high: 650 }, // SAR per customer, team estimate
  tam26: { low: 1.6, base: 2.29, high: 2.97, headline: 2.3 }, // SAR bn (display 1.60 / 2.29 / 2.97)
  employedCore: 2.33, // m
  employmentRatio: 45.8, // %
  sam26: { low: 0.81, base: 1.16, high: 1.51, headline: 1.2 }, // SAR bn
  growth: { base: 6.4, low: 3.0, high: 12.5 }, // % a year
  tam31: 3.1, // SAR bn
  sam31: 1.6, // SAR bn
  som31: 201, // SAR m
  somShareTam: 6.4, // %
  somShareSam: 12.7, // %
  baseVolumeShare: 11.8, // % of Saudis aged 20 to 34
  baseVsCustomers: 1.7, // x Wafra's current customers
  wafraCustomers: 350, // k
  downsideShare: 6.9, // %
  upsideShare: 19.7, // %
} as const;

/** TAM / SAM range values matched to the revenue-per-customer toggle (SAR bn, 2 dp). */
export const TAM_SAM_BY_ARPU = {
  350: { tam: 1.6, sam: 0.81 },
  500: { tam: 2.29, sam: 1.16 },
  650: { tam: 2.97, sam: 1.51 },
} as const;

// ───────────────────────── Wafra today (case deck) ─────────────────────────
export const WAFRA = {
  retailGrowth: 4, // % a year to FY26E (about)
  smeGrowth: 12, // % (about)
  roe: 9.7, // % FY26E
  sectorRoe: 15.0, // % 2024, SAMA FSR 2025
  techSpend: 6.9, // % of revenue (about, flat)
  assetShare: 0.42, // % of Saudi banking assets
  assetsImplied: 19.1, // SAR bn
  sectorAssets: 4494, // SAR bn
  branches: 24,
  smeCorpShare: 46, // % of FY26E revenue (about)
  blendedRevPerCustomer: 4166, // SAR, FY26E
  arpuShareOfBlended: 12, // %
} as const;

// ───────────────────────── Demand ─────────────────────────
export const DEMAND = {
  internetUse: 99.3, // %, Saudis aged 15 to 74 [GASTAT ICT 2025]
  electronicPayments: 79, // % of retail payments [FSDP 2024]
  employmentRatio: 45.8, // % [GASTAT LFS Q1 2026]
  unemployment: 6.4,
  unemploymentWomen: 9.0,
  unemploymentMen: 4.9,
  consumerLoans: 479.8, // SAR bn
  consumerLoansGrowth: 6.41, // %
  creditCards: 30.7, // SAR bn
  creditCardsGrowth: 12.53, // %
} as const;

export const DIGITAL_PEERS = {
  d360Customers: '1m+', // in four months
  stcCustomers: '3m+',
} as const;

// ───────────────────────── Opportunity pools ─────────────────────────
export type PoolRole =
  | 'differentiator'
  | 'leadPhased'
  | 'selective'
  | 'leadEntry'
  | 'digitalDistribution'
  | 'fastFollower'
  | 'differentiated'
  | 'testLearn'
  | 'feeder'
  | 'partnershipOnly';

export const POOL_WEIGHTS = { size: 25, growth: 20, margin: 20, competition: 15, regulation: 10, fit: 10 } as const;

export const POOLS: { id: string; score: number; role: PoolRole; lead?: boolean }[] = [
  { id: 'nextGenHni', score: 3.9, role: 'differentiator' },
  { id: 'consumerFinance', score: 3.85, role: 'leadPhased', lead: true },
  { id: 'smeMicro', score: 3.65, role: 'selective' },
  { id: 'salariedAccounts', score: 3.6, role: 'leadEntry', lead: true },
  { id: 'regions', score: 3.55, role: 'digitalDistribution' },
  { id: 'savingsInvesting', score: 3.5, role: 'fastFollower' },
  { id: 'womenBanking', score: 3.4, role: 'differentiated' },
  { id: 'gigWorkers', score: 3.3, role: 'testLearn' },
  { id: 'students', score: 3.2, role: 'feeder' },
  { id: 'remittance', score: 3.0, role: 'partnershipOnly' },
];

// ───────────────────────── Competitors and positioning ─────────────────────────
export type CompetitorId = 'alRajhi' | 'stc' | 'd360' | 'vision';
export const COMPETITORS: { id: CompetitorId; initials: string; kind: 'incumbent' | 'digital'; source: SourceId | null }[] = [
  { id: 'alRajhi', initials: 'AR', kind: 'incumbent', source: 'alRajhi' },
  { id: 'stc', initials: 'SB', kind: 'digital', source: 'menaStartup' },
  { id: 'd360', initials: 'D3', kind: 'digital', source: 'digitalBanker' },
  { id: 'vision', initials: 'VB', kind: 'digital', source: 'menaStartup' },
];

/** Indicative positioning: x = app-led self-service (0 human-led .. 100), y = salary/credit-led (0 payments-led .. 100). */
export const POSITIONING = {
  wafraToday: { x: 12, y: 50 },
  alRajhi: { x: 18, y: 81 },
  vision: { x: 63, y: 36 },
  d360: { x: 88, y: 36 },
  stc: { x: 82, y: 8 },
  wafraTarget: { x: 69, y: 71 },
  whiteSpace: { x0: 45, x1: 95, y0: 60, y1: 98 },
} as const;

export const WHITE_SPACES = ['salaryToFinancing', 'everydayHuman', 'goalSavings'] as const;

// ───────────────────────── Where to play ─────────────────────────
export const SEGMENTS = {
  targetEmployed: 2.3, // m (proxy)
  feederAged2024: 1.76, // m Saudis aged 20 to 24
  womenUnemployment: 9.0, // %
  menUnemployment: 4.9, // %
} as const;

export const PRODUCT_WAVES = [
  { fy: 'FY27', id: 'fy27' },
  { fy: 'FY28', id: 'fy28' },
  { fy: 'FY29', id: 'fy29' },
  { fy: 'FY30 to FY31', id: 'fy3031' },
] as const;

export const CHANNELS = ['app', 'payroll', 'universities', 'telco', 'smeCorporate', 'touchpoints'] as const;

// ───────────────────────── Go-to-market ─────────────────────────
export const GTM = {
  approved: [0.07, 0.18, 0.33, 0.48, 0.6], // m, year-end FY27..FY31 (display 2 dp)
  active: [0.05, 0.13, 0.24, 0.34, 0.43],
  primary: [0.02, 0.05, 0.1, 0.14, 0.17], // 40% of active
  targets: {
    activation30d: { base: '55 to 65%', note: 'estimate' },
    activeShare: { base: 72, range: [70, 75] },
    retention12m: { base: 80, range: [75, 85] },
    primaryShare: { base: 40, range: [30, 40] },
    cac: { base: 250, range: [150, 350] },
    costToServe: { base: 90, range: [70, 120] },
  },
  waves: [
    { id: 'prove', fy: 'FY27', approved: 0.07 },
    { id: 'scale', fy: 'FY28 to FY29', approved: 0.33 },
    { id: 'deepen', fy: 'FY30 to FY31', approved: 0.6 },
  ],
} as const;

// ───────────────────────── Unit economics, FY31 per average active customer (SAR) ─────────────────────────
export const UNIT_ECONOMICS = {
  depositMargin: 190,
  financingMargin: 209,
  fees: 120,
  revenue: 519,
  acquisition: -102,
  buildRun: -90,
  costToServe: -90,
  impairment: -138,
  cost: -420,
  preTax: 99,
  breakEvenNeeded: 420,
  modelled: 519,
  headroomPct: 24,
} as const;

// ───────────────────────── Assumptions (adverse / base / favourable) ─────────────────────────
export type Unit = 'sar' | 'pct' | 'm' | 'sarm';
export interface AssumptionRow {
  id: string;
  unit: Unit;
  dp: number;
  adverse: number | [number, number];
  base: number | [number, number];
  favourable: number | [number, number];
  source: SourceId;
}
export const ASSUMPTIONS: AssumptionRow[] = [
  { id: 'approved', unit: 'm', dp: 2, adverse: 0.35, base: 0.6, favourable: 1.0, source: 'teamModel' },
  { id: 'activeShare', unit: 'pct', dp: 0, adverse: 70, base: 72, favourable: 75, source: 'report' },
  { id: 'retention', unit: 'pct', dp: 0, adverse: 75, base: 80, favourable: 85, source: 'report' },
  { id: 'cac', unit: 'sar', dp: 0, adverse: 350, base: 250, favourable: 150, source: 'report' },
  { id: 'depositBalance', unit: 'sar', dp: 0, adverse: 3000, base: 5000, favourable: 8000, source: 'report' },
  { id: 'financingPerBorrower', unit: 'sar', dp: 0, adverse: 15000, base: 25000, favourable: 35000, source: 'report' },
  { id: 'financingPenetration', unit: 'pct', dp: 0, adverse: 15, base: 22, favourable: 30, source: 'report' },
  { id: 'netMargin', unit: 'pct', dp: 1, adverse: 3.0, base: 3.8, favourable: 4.5, source: 'report' },
  { id: 'fees', unit: 'sar', dp: 0, adverse: 80, base: 120, favourable: 180, source: 'report' },
  { id: 'costToServe', unit: 'sar', dp: 0, adverse: 120, base: 90, favourable: 70, source: 'report' },
  { id: 'buildRun', unit: 'sarm', dp: 0, adverse: [70, 45], base: [55, 35], favourable: [45, 28], source: 'report' },
  { id: 'costOfRisk', unit: 'pct', dp: 1, adverse: 3.5, base: 2.5, favourable: 1.8, source: 'report' },
  { id: 'cet1', unit: 'pct', dp: 2, adverse: 4.0, base: 3.0, favourable: 2.33, source: 'report' },
  { id: 'tax', unit: 'pct', dp: 0, adverse: 15, base: 12, favourable: 10, source: 'caseDeck' },
];

// ───────────────────────── Five-year P&L, base (FY27..FY31) ─────────────────────────
export const PNL_BASE = {
  approved: [0.07, 0.18, 0.33, 0.48, 0.6],
  active: [0.05, 0.13, 0.24, 0.34, 0.43],
  depositMargin: [5, 17, 35, 55, 74],
  financingMargin: [1, 8, 26, 52, 81],
  fees: [3, 11, 22, 35, 46],
  revenue: [8, 36, 84, 143, 201],
  acquisition: [-12, -23, -34, -37, -40],
  buildRun: [-55, -48, -42, -38, -35],
  costToServe: [-2, -8, -17, -26, -35],
  operatingCost: [-69, -80, -92, -102, -109],
  impairment: [-1, -6, -17, -34, -53],
  preTax: [-61, -49, -26, 6, 38],
  tax: [0, 0, 0, -1, -5],
  netProfit: [-61, -49, -26, 6, 34],
  cumulative: [-61, -110, -136, -130, -96],
  cet1: [1, 10, 27, 49, 71],
} as const;

export type ScenarioId = 'downside' | 'base' | 'upside';
export interface ScenarioSeries {
  volume: number; // m approved FY31
  revenue: readonly number[];
  opexImpairment: readonly number[]; // chart series, shown as positive cost bars
  netProfit: readonly number[];
  cumulative: readonly number[];
  summary: { revenue31: number; netProfit31: number; opBreakEven: string; peak: number };
}
export const SCENARIOS: Record<ScenarioId, ScenarioSeries> = {
  downside: {
    volume: 0.35,
    revenue: [5, 21, 49, 83, 117],
    opexImpairment: [64, 70, 82, 95, 109],
    netProfit: [-59, -48, -32, -12, 7],
    cumulative: [-59, -107, -140, -152, -145],
    summary: { revenue31: 117, netProfit31: 7, opBreakEven: 'FY31', peak: 152 },
  },
  base: {
    volume: 0.6,
    revenue: [8, 36, 84, 143, 201],
    opexImpairment: [70, 85, 110, 136, 163],
    netProfit: [-61, -49, -26, 6, 34],
    cumulative: [-61, -110, -136, -130, -96],
    summary: { revenue31: 201, netProfit31: 34, opBreakEven: 'FY30', peak: 136 },
  },
  upside: {
    volume: 1.0,
    revenue: [14, 61, 140, 238, 335],
    opexImpairment: [80, 110, 155, 202, 248],
    netProfit: [-66, -49, -15, 32, 77],
    cumulative: [-66, -115, -130, -98, -21],
    summary: { revenue31: 335, netProfit31: 77, opBreakEven: 'FY30', peak: 130 },
  },
};

export const GROUP_IMPACT = {
  years: ['FY27', 'FY29', 'FY31'],
  costToIncomeProForma: [77.1, 74.9, 71.7],
  costToIncomeStatusQuo: [73.1, 73.3, 73.5],
  netProfitUplift: [-31, -11, 13], // %
  roeContribution: [-3.3, -1.4, 1.8], // pp
  groupNetProfit31: 295,
  statusQuoNetProfit31: 261,
  groupUplift31: 13, // %
  cet1Consumed31: 71,
  cet1ShareOfEquity: 3.8, // %
} as const;

export const HEADLINE = {
  approved31: 0.6,
  active31: 0.43,
  revenue31: 201,
  netProfit31: 34,
  opBreakEven: 'FY30',
  cumBreakEven: 'after FY31',
  peakInvestment: 136,
  peakYear: 'FY29',
  gate1: 61,
  gate2: 110,
  gate3: 136,
  cet1Consumed31: 71,
  costToIncome31: 71.7,
  costToIncomeStatusQuo31: 73.5,
  tamHeadline: 2.3, // SAR bn
} as const;

// ───────────────────────── Sensitivities (one lever at a time, base volume) ─────────────────────────
export type BreakEven = 'FY30' | 'FY31' | 'after FY31';
export interface SensResult {
  value: number;
  revenue31: number;
  netProfit31: number;
  change: number; // FY31 net profit vs base, SAR m (unrounded in model, given to 1 dp)
  peak: number;
  opBE: BreakEven;
  cumBE: BreakEven;
}
export interface SensLever {
  id: string;
  unit: Unit;
  dp: number;
  base: number;
  adverse: SensResult;
  favourable: SensResult;
}
export const SENS_BASE = { revenue31: 201, netProfit31: 34, peak: 136, opBE: 'FY30' as BreakEven, cumBE: 'after FY31' as BreakEven };

export const SENSITIVITIES: SensLever[] = [
  {
    id: 'depositBalance', unit: 'sar', dp: 0, base: 5000,
    adverse: { value: 3000, revenue31: 171, netProfit31: 8, change: -25.9, peak: 174, opBE: 'FY31', cumBE: 'after FY31' },
    favourable: { value: 8000, revenue31: 245, netProfit31: 73, change: 38.8, peak: 102, opBE: 'FY30', cumBE: 'FY31' },
  },
  {
    id: 'netMargin', unit: 'pct', dp: 1, base: 3.8,
    adverse: { value: 3.0, revenue31: 168, netProfit31: 5, change: -28.6, peak: 171, opBE: 'FY31', cumBE: 'after FY31' },
    favourable: { value: 4.5, revenue31: 229, netProfit31: 59, change: 25.0, peak: 119, opBE: 'FY30', cumBE: 'after FY31' },
  },
  {
    id: 'fees', unit: 'sar', dp: 0, base: 120,
    adverse: { value: 80, revenue31: 185, netProfit31: 20, change: -13.6, peak: 153, opBE: 'FY31', cumBE: 'after FY31' },
    favourable: { value: 180, revenue31: 224, netProfit31: 54, change: 20.4, peak: 118, opBE: 'FY30', cumBE: 'after FY31' },
  },
  {
    id: 'costOfRisk', unit: 'pct', dp: 1, base: 2.5,
    adverse: { value: 3.5, revenue31: 201, netProfit31: 15, change: -18.7, peak: 152, opBE: 'FY31', cumBE: 'after FY31' },
    favourable: { value: 1.8, revenue31: 201, netProfit31: 47, change: 13.1, peak: 129, opBE: 'FY30', cumBE: 'after FY31' },
  },
  {
    id: 'cac', unit: 'sar', dp: 0, base: 250,
    adverse: { value: 350, revenue31: 201, netProfit31: 20, change: -13.9, peak: 172, opBE: 'FY31', cumBE: 'after FY31' },
    favourable: { value: 150, revenue31: 201, netProfit31: 48, change: 13.9, peak: 108, opBE: 'FY30', cumBE: 'after FY31' },
  },
  {
    id: 'costToServe', unit: 'sar', dp: 0, base: 90,
    adverse: { value: 120, revenue31: 201, netProfit31: 23, change: -10.2, peak: 147, opBE: 'FY31', cumBE: 'after FY31' },
    favourable: { value: 70, revenue31: 201, netProfit31: 40, change: 6.8, peak: 130, opBE: 'FY30', cumBE: 'after FY31' },
  },
  {
    id: 'financingPenetration', unit: 'pct', dp: 0, base: 22,
    adverse: { value: 15, revenue31: 175, netProfit31: 26, change: -7.7, peak: 140, opBE: 'FY30', cumBE: 'after FY31' },
    favourable: { value: 30, revenue31: 230, netProfit31: 43, change: 8.9, peak: 131, opBE: 'FY30', cumBE: 'after FY31' },
  },
  {
    id: 'activeShare', unit: 'pct', dp: 0, base: 72,
    adverse: { value: 70, revenue31: 195, netProfit31: 32, change: -1.8, peak: 136, opBE: 'FY30', cumBE: 'after FY31' },
    favourable: { value: 75, revenue31: 209, netProfit31: 36, change: 2.7, peak: 135, opBE: 'FY30', cumBE: 'after FY31' },
  },
];

/** Stress presets: change vs base is not reported by the model for these, so it is never shown. */
export const STRESS_PRESETS: { id: 'allAdverse' | 'cannibalisation' | 'arpuLed'; revenue31: number; netProfit31: number; peak: number; opBE: BreakEven; cumBE: BreakEven }[] = [
  { id: 'allAdverse', revenue31: 89, netProfit31: -90, peak: 452, opBE: 'after FY31', cumBE: 'after FY31' },
  { id: 'cannibalisation', revenue31: 161, netProfit31: -2, peak: 185, opBE: 'after FY31', cumBE: 'after FY31' },
  { id: 'arpuLed', revenue31: 142, netProfit31: -21, peak: 204, opBE: 'after FY31', cumBE: 'after FY31' },
];

// ───────────────────────── Stage gates (deck slide 8) ─────────────────────────
export type GateId = 'G1' | 'G2' | 'G3';
export const GATES: {
  id: GateId;
  fyEnd: FYKey;
  exposure: number;
  metrics: { id: 'approved' | 'activation' | 'cac' | 'retention' | 'cor' | 'primary' | 'lossNarrowing'; op: '>=' | '<=' | 'yes'; threshold: number | boolean }[];
}[] = [
  {
    id: 'G1',
    fyEnd: 'FY27',
    exposure: 61,
    metrics: [
      { id: 'approved', op: '>=', threshold: 0.07 },
      { id: 'activation', op: '>=', threshold: 55 },
      { id: 'cac', op: '<=', threshold: 350 },
    ],
  },
  {
    id: 'G2',
    fyEnd: 'FY28',
    exposure: 110,
    metrics: [
      { id: 'approved', op: '>=', threshold: 0.18 },
      { id: 'retention', op: '>=', threshold: 75 },
      { id: 'cor', op: '<=', threshold: 3.5 },
    ],
  },
  {
    id: 'G3',
    fyEnd: 'FY29',
    exposure: 136,
    metrics: [
      { id: 'approved', op: '>=', threshold: 0.33 },
      { id: 'primary', op: '>=', threshold: 30 },
      { id: 'lossNarrowing', op: 'yes', threshold: true },
    ],
  },
];
export const STOP_RULE = { missedMetrics: 2, corThreshold: 3.5, consecutiveQuarters: 2 } as const;
export const QUARTERS = ['FY27 Q1', 'FY27 Q2', 'FY27 Q3', 'FY27 Q4', 'FY28 Q1', 'FY28 Q2', 'FY28 Q3', 'FY28 Q4'] as const;

// ───────────────────────── Risk register ─────────────────────────
export type RiskImpact =
  | { kind: 'netProfit'; value: number; condition: 'cor35' | 'cac350' | 'cannib20' }
  | { kind: 'loss'; value: number; condition: 'arpu367' }
  | { kind: 'notModelled' };

export const RISKS: { id: string; impact: RiskImpact }[] = [
  { id: 'credit', impact: { kind: 'netProfit', value: 15, condition: 'cor35' } },
  { id: 'arpu', impact: { kind: 'loss', value: 21, condition: 'arpu367' } },
  { id: 'cac', impact: { kind: 'netProfit', value: 20, condition: 'cac350' } },
  { id: 'cannibalisation', impact: { kind: 'netProfit', value: -2, condition: 'cannib20' } },
  { id: 'brand', impact: { kind: 'notModelled' } },
  { id: 'fraud', impact: { kind: 'notModelled' } },
  { id: 'regulatory', impact: { kind: 'notModelled' } },
  { id: 'competitive', impact: { kind: 'notModelled' } },
];
/** Heat strip order by FY31 impact (most severe first): FY31 net profit -21, -2, 15, 20, then not modelled. */
export const RISK_HEAT_ORDER = ['arpu', 'cannibalisation', 'credit', 'cac', 'brand', 'fraud', 'regulatory', 'competitive'] as const;

// ───────────────────────── How to win ─────────────────────────
export const BBP_CRITERIA = ['fit', 'speed', 'control', 'capability', 'execRisk', 'capital'] as const;
export const BBP: { id: string; scores: [number, number, number, number, number, number]; total: number; recommended?: boolean }[] = [
  { id: 'buildFull', scores: [4, 2, 5, 2, 2, 3], total: 18 },
  { id: 'buySaas', scores: [3, 4, 3, 4, 3, 4], total: 21 },
  { id: 'partner', scores: [4, 5, 2, 4, 3, 4], total: 22 },
  { id: 'newBank', scores: [2, 1, 5, 2, 1, 1], total: 12 },
  { id: 'partnerOnly', scores: [2, 5, 1, 4, 3, 5], total: 20 },
  { id: 'hybrid', scores: [5, 4, 4, 4, 3, 4], total: 24, recommended: true },
];
export const BBP_MAX = 30;

export const OPERATING_LAYERS = ['customers', 'digitalUnit', 'staysInBank', 'modularTech', 'partners'] as const;

export const RUN_COST = { years: ['FY27', 'FY28', 'FY29', 'FY30', 'FY31'], values: [55, 48, 42, 38, 35] } as const;

export const PLAN_90 = ['d0_30', 'd31_60', 'd61_90'] as const;

export const ASK = { gate1: 61, gate2: 110, peak: 136 } as const;
