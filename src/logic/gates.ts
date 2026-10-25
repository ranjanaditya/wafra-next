/**
 * Stage-gate evaluation (deck slide 8) with the team stop rule.
 * PASS: all metrics met. WATCH: one metric missed (prototype interpretation:
 * continue with a fix plan). STOP: two or more metrics missed, or cost of risk
 * above 3.5% for two consecutive quarters. Gates are sequential: once one stops,
 * later gates are not reached and exposure is capped at the stopping gate.
 */
import { GATES, STOP_RULE, type GateId } from '../data/deck';
import type { GateInputs } from '../config/illustrative';

export type GateStatus = 'PASS' | 'WATCH' | 'STOP' | 'LOCKED';
export type MetricId = (typeof GATES)[number]['metrics'][number]['id'];

export interface MetricResult {
  id: MetricId;
  op: '>=' | '<=' | 'yes';
  threshold: number | boolean;
  value: number | boolean;
  met: boolean;
}

export interface GateResult {
  id: GateId;
  fyEnd: string;
  exposure: number;
  metrics: MetricResult[];
  missed: number;
  corBreach: boolean;
  status: GateStatus;
}

export interface GatesEvaluation {
  gates: GateResult[];
  breach: { index: number; gate: GateId } | null;
  stoppedAt: GateId | null;
  exposureCap: number;
  peak: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function metricValue(id: MetricId, gate: GateId, inp: GateInputs): number | boolean {
  switch (id) {
    case 'approved':
      return gate === 'G1' ? inp.approvedG1 : gate === 'G2' ? inp.approvedG2 : inp.approvedG3;
    case 'activation':
      return inp.activation;
    case 'cac':
      return inp.cac;
    case 'retention':
      return inp.retention;
    case 'cor':
      return inp.cor;
    case 'primary':
      return inp.primary;
    case 'lossNarrowing':
      return inp.lossNarrowing;
  }
}

/** First pair of consecutive quarters above the threshold; returns the index of the second quarter. */
export function findCorBreach(quarterly: number[], threshold: number = STOP_RULE.corThreshold, run: number = STOP_RULE.consecutiveQuarters) {
  let streak = 0;
  for (let i = 0; i < quarterly.length; i++) {
    streak = r2(quarterly[i]) > threshold ? streak + 1 : 0;
    if (streak >= run) return i;
  }
  return null;
}

export function evaluateGates(inp: GateInputs): GatesEvaluation {
  const breachIdx = findCorBreach(inp.quarterly);
  // Quarters 0-3 are FY27 (Gate 1), 4-7 are FY28 (Gate 2).
  const breach = breachIdx === null ? null : { index: breachIdx, gate: (breachIdx <= 3 ? 'G1' : 'G2') as GateId };
  let stoppedAt: GateId | null = null;

  const gates: GateResult[] = GATES.map((g) => {
    const metrics: MetricResult[] = g.metrics.map((mt) => {
      const value = metricValue(mt.id, g.id, inp);
      let met: boolean;
      if (mt.op === 'yes') met = value === true;
      else if (mt.op === '>=') met = r2(value as number) >= (mt.threshold as number);
      else met = r2(value as number) <= (mt.threshold as number);
      return { id: mt.id, op: mt.op, threshold: mt.threshold, value, met };
    });
    const missed = metrics.filter((x) => !x.met).length;
    const corBreach = breach?.gate === g.id;
    let status: GateStatus;
    if (stoppedAt) status = 'LOCKED';
    else if (corBreach || missed >= STOP_RULE.missedMetrics) status = 'STOP';
    else if (missed === 1) status = 'WATCH';
    else status = 'PASS';
    if (status === 'STOP') stoppedAt = g.id;
    return { id: g.id, fyEnd: g.fyEnd, exposure: g.exposure, metrics, missed, corBreach, status };
  });

  const peak = GATES[GATES.length - 1].exposure;
  const exposureCap = stoppedAt ? GATES.find((g) => g.id === stoppedAt)!.exposure : peak;
  return { gates, breach, stoppedAt, exposureCap, peak };
}
