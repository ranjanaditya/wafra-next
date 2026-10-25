/**
 * Transparent, deterministic credit scorecard staged along the customer path.
 * Illustrative scorecard, not a production credit model.
 *
 * t = months since account opening. The account opens at month 0 and the first
 * salary lands at month 1, so salary months = t.
 * Fairness: gender, nationality, marital status and age are never inputs
 * (age is used for eligibility only, outside this engine).
 */
import { POLICY, type Band, type IncomeType, type Persona } from '../config/illustrative';
import type { Msg } from '../lib/msg';

export interface CreditInputs {
  salary: number;
  incomeType: IncomeType;
  commitments: number;
  historyAtOpening: number;
  behaviour: number;
}

export type FactorId = 'income' | 'seasoning' | 'affordability' | 'history' | 'behaviour';
export interface Factor {
  id: FactorId;
  points: number;
  max: number;
}

export type Stage = 'seasoning' | 'first' | 'expanded';
export type Binding = 'incomeLinked' | 'incomeMultiple' | 'bandCap' | 'affordability';

export interface Offer {
  limit: number;
  binding: Binding;
  candidates: { id: Binding; value: number }[];
  apr: number;
  tenor: number;
  instalment: number;
  totalProfitCost: number;
  salaryUsed: number;
  maxInstalment: number;
  affordablePrincipal: number;
}

export interface Reason extends Msg {
  factor: FactorId;
  kind: 'strength' | 'improve';
}

export interface CreditResult {
  t: number;
  inputs: CreditInputs;
  factors: Factor[];
  score: number;
  band: Band;
  stage: Stage;
  offer: Offer | null;
  /** First-financing offer (month 6, same tenor), used to show growth at month 12. */
  startingOffer: Offer | null;
  growthBlocked: boolean;
  affordabilityLimitsGrowth: boolean;
  cardOffer: boolean;
  investing: 'goal' | 'emergencyFirst' | null;
  specialistOnly: boolean;
  humanReview: boolean;
  humanReviewReasons: ('band' | 'variable' | 'request')[];
  strengths: Reason[];
  improve: Reason[];
  requested: number | null;
  requestAboveLimit: boolean;
  policy: string;
}

const { DBR_CAP, BAND_CAP, STARTING_MULTIPLE, EXPANDED_MULTIPLE, SEASONING_MONTHS, EXPANSION_MONTH, ROUND_TO, APR, BAND_THRESHOLDS, POINTS_MAX } = POLICY;

export const personaInputs = (p: Persona): CreditInputs => ({
  salary: p.salary,
  incomeType: p.incomeType,
  commitments: p.commitments,
  historyAtOpening: p.historyAtOpening,
  behaviour: p.behaviour,
});

export function historyPoints(months: number) {
  if (months >= 24) return 25;
  if (months >= 12) return 15;
  if (months >= 6) return 8;
  return 3;
}

export function scoreFactors(inp: CreditInputs, t: number): Factor[] {
  const seasoningPts = (Math.min(Math.max(t, 0), SEASONING_MONTHS) / SEASONING_MONTHS) * POINTS_MAX.seasoning;
  const ratio = inp.salary > 0 ? inp.commitments / inp.salary : 1;
  const affordPts = Math.max(0, (DBR_CAP - ratio) / DBR_CAP) * POINTS_MAX.affordability;
  return [
    { id: 'income', points: inp.incomeType === 'fixed' ? 20 : 8, max: POINTS_MAX.income },
    { id: 'seasoning', points: seasoningPts, max: POINTS_MAX.seasoning },
    { id: 'affordability', points: Math.min(affordPts, POINTS_MAX.affordability), max: POINTS_MAX.affordability },
    { id: 'history', points: historyPoints(inp.historyAtOpening + Math.max(t, 0)), max: POINTS_MAX.history },
    { id: 'behaviour', points: Math.min(Math.max(inp.behaviour, 0), POINTS_MAX.behaviour), max: POINTS_MAX.behaviour },
  ];
}

/** Scores are shown to one decimal; banding uses the shown score so screen and band always agree. */
export const roundScore = (s: number) => Math.round(s * 10) / 10;

export function bandFor(score: number): Band {
  const s = roundScore(score);
  if (s >= BAND_THRESHOLDS.A) return 'A';
  if (s >= BAND_THRESHOLDS.B) return 'B';
  if (s >= BAND_THRESHOLDS.C) return 'C';
  return 'D';
}

export function stageFor(t: number): Stage {
  if (t < SEASONING_MONTHS) return 'seasoning';
  if (t < EXPANSION_MONTH) return 'first';
  return 'expanded';
}

/** Present-value annuity factor: (1 - (1 + r)^-n) / r with r = APR / 12. */
export function annuityFactor(apr: number, n: number) {
  const r = apr / 12;
  if (r === 0) return n;
  return (1 - Math.pow(1 + r, -n)) / r;
}

export const instalmentFor = (limit: number, apr: number, n: number) => limit / annuityFactor(apr, n);

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;

function buildOffer(inp: CreditInputs, band: Band, stage: Exclude<Stage, 'seasoning'>, tenor: number): Offer | null {
  if (band === 'D') return null;
  const apr = APR[band];
  const cap = BAND_CAP[band] as number;
  const maxInstalment = inp.salary * DBR_CAP - inp.commitments;
  const affordablePrincipal = maxInstalment > 0 ? maxInstalment * annuityFactor(apr, tenor) : 0;
  const candidates: { id: Binding; value: number }[] =
    stage === 'first'
      ? [
          { id: 'incomeLinked', value: STARTING_MULTIPLE * inp.salary },
          { id: 'bandCap', value: cap },
          { id: 'affordability', value: affordablePrincipal },
        ]
      : [
          { id: 'bandCap', value: cap },
          { id: 'incomeMultiple', value: EXPANDED_MULTIPLE * inp.salary },
          { id: 'affordability', value: affordablePrincipal },
        ];
  let bind = candidates[0];
  for (const c of candidates) if (c.value < bind.value) bind = c;
  const limit = floorTo(bind.value, ROUND_TO);
  if (limit < ROUND_TO) return null;
  const instalment = instalmentFor(limit, apr, tenor);
  return {
    limit,
    binding: bind.id,
    candidates,
    apr,
    tenor,
    instalment,
    totalProfitCost: instalment * tenor - limit,
    salaryUsed: inp.salary > 0 ? (inp.commitments + instalment) / inp.salary : 1,
    maxInstalment,
    affordablePrincipal,
  };
}

const STRENGTH_PRIORITY: FactorId[] = ['income', 'affordability', 'history', 'seasoning', 'behaviour'];

function reasonFor(f: Factor, kind: 'strength' | 'improve', inp: CreditInputs, t: number): Reason {
  const k = (key: string, params?: Reason['params']): Reason => ({ key: `app.reasons.${key}`, params, factor: f.id, kind });
  const ratio = f.points / f.max;
  switch (f.id) {
    case 'income':
      return kind === 'strength' ? k('stableSalary') : k('variableIncome');
    case 'seasoning':
      return kind === 'strength' ? k('seasoned') : k('seasoningProgress', { m: Math.min(t, SEASONING_MONTHS) });
    case 'affordability':
      return kind === 'strength' ? k('lowCommitments') : ratio < 0.5 ? k('commitmentsHigh') : k('commitmentsSome');
    case 'history':
      return kind === 'strength' ? k('longHistory', { m: inp.historyAtOpening + t }) : k('shortHistory');
    case 'behaviour':
      return kind === 'strength' ? k('goodBehaviour') : k('buildBehaviour');
  }
}

export function reasonCodes(factors: Factor[], inp: CreditInputs, t: number) {
  const strengths = factors
    .filter((f) => f.points / f.max >= 0.6)
    .sort((a, b) => b.points / b.max - a.points / a.max || STRENGTH_PRIORITY.indexOf(a.id) - STRENGTH_PRIORITY.indexOf(b.id))
    .slice(0, 2)
    .map((f) => reasonFor(f, 'strength', inp, t));
  const improve = factors
    .filter((f) => f.points / f.max < 0.9 && f.max - f.points > 0.5)
    .sort((a, b) => b.max - b.points - (a.max - a.points))
    .slice(0, 2)
    .map((f) => reasonFor(f, 'improve', inp, t));
  return { strengths, improve };
}

export interface EvaluateOptions {
  tenor?: number;
  requested?: number | null;
}

export function evaluate(inp: CreditInputs, t: number, opts: EvaluateOptions = {}): CreditResult {
  const tenor = opts.tenor ?? POLICY.TENOR.default;
  const factors = scoreFactors(inp, t);
  const score = roundScore(factors.reduce((s, f) => s + f.points, 0));
  const band = bandFor(score);
  const stage = stageFor(t);

  let offer: Offer | null = null;
  let startingOffer: Offer | null = null;
  if (stage === 'first') offer = buildOffer(inp, band, 'first', tenor);
  if (stage === 'expanded') {
    offer = buildOffer(inp, band, 'expanded', tenor);
    const at6 = bandFor(scoreFactors(inp, SEASONING_MONTHS).reduce((s, f) => s + f.points, 0));
    startingOffer = buildOffer(inp, at6, 'first', tenor);
  }

  const specialistOnly = stage !== 'seasoning' && offer === null;
  const growthBlocked =
    stage === 'expanded' && !!offer && !!startingOffer && offer.limit <= startingOffer.limit && offer.binding === 'affordability';
  const affordabilityLimitsGrowth = stage === 'expanded' && !!offer && offer.binding === 'affordability';
  const cardOffer = stage === 'expanded' && !!offer && (band === 'A' || band === 'B') && offer.binding !== 'affordability';
  const investing: CreditResult['investing'] =
    stage === 'expanded' ? (band === 'C' || band === 'D' || affordabilityLimitsGrowth || !offer ? 'emergencyFirst' : 'goal') : null;

  const requested = opts.requested ?? null;
  const requestAboveLimit = requested !== null && requested > (offer?.limit ?? 0);
  const humanReviewReasons: CreditResult['humanReviewReasons'] = [];
  if (band === 'C' || band === 'D') humanReviewReasons.push('band');
  if (inp.incomeType === 'variable') humanReviewReasons.push('variable');
  if (requestAboveLimit) humanReviewReasons.push('request');

  const { strengths, improve } = reasonCodes(factors, inp, t);

  return {
    t,
    inputs: inp,
    factors,
    score,
    band,
    stage,
    offer,
    startingOffer,
    growthBlocked,
    affordabilityLimitsGrowth,
    cardOffer,
    investing,
    specialistOnly,
    humanReview: humanReviewReasons.length > 0,
    humanReviewReasons,
    strengths,
    improve,
    requested,
    requestAboveLimit,
    policy: POLICY.version,
  };
}

/** Rounded display helpers (instalments and costs to whole SAR). */
export const sarRound = (v: number) => Math.round(v);
