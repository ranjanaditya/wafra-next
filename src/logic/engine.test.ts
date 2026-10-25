import { describe, expect, it } from 'vitest';
import { evaluate, personaInputs } from './creditEngine';
import { evaluateGates } from './gates';
import { GATE_DEFAULTS, PERSONAS } from '../config/illustrative';

const run = (id: keyof typeof PERSONAS, t: number, tenor = 36) => evaluate(personaInputs(PERSONAS[id]), t, { tenor });
const r = Math.round;

describe('credit engine: persona expected outputs', () => {
  it('Faisal', () => {
    const m3 = run('faisal', 3);
    expect(m3.score.toFixed(1)).toBe('84.0');
    expect(m3.band).toBe('A');
    expect(m3.offer).toBeNull();

    const m6 = run('faisal', 6);
    expect(m6.score.toFixed(1)).toBe('91.5');
    expect(m6.band).toBe('A');
    expect(m6.offer?.limit).toBe(14000);
    expect(m6.offer?.binding).toBe('incomeLinked');
    expect(r(m6.offer!.instalment)).toBe(423);
    expect(r(m6.offer!.totalProfitCost)).toBe(1219);

    const m12 = run('faisal', 12);
    expect(m12.offer?.limit).toBe(35000);
    expect(m12.offer?.binding).toBe('bandCap');
    expect(r(m12.offer!.instalment)).toBe(1057);
    expect(m12.cardOffer).toBe(true);
    expect(m12.investing).toBe('goal');
  });

  it('Noura', () => {
    const m3 = run('noura', 3);
    expect(m3.score.toFixed(1)).toBe('65.5');
    expect(m3.band).toBe('B');
    expect(m3.offer).toBeNull();

    const m6 = run('noura', 6);
    expect(m6.score.toFixed(1)).toBe('78.0');
    expect(m6.band).toBe('B');
    expect(m6.offer?.limit).toBe(8500);
    expect(m6.offer?.binding).toBe('incomeLinked');
    expect(r(m6.offer!.instalment)).toBe(261);
    expect(r(m6.offer!.totalProfitCost)).toBe(879);

    const m12 = run('noura', 12);
    expect(m12.score.toFixed(1)).toBe('85.0');
    expect(m12.band).toBe('A');
    expect(m12.offer?.limit).toBe(25500);
    expect(m12.offer?.binding).toBe('incomeMultiple');
    expect(r(m12.offer!.instalment)).toBe(770);
    expect(m12.startingOffer?.limit).toBe(8500);
    expect(m12.cardOffer).toBe(true);
  });

  it('Abdullah', () => {
    const m3 = run('abdullah', 3);
    expect(m3.score.toFixed(1)).toBe('48.8');
    expect(m3.band).toBe('D');
    expect(m3.offer).toBeNull();

    const m6 = run('abdullah', 6);
    expect(m6.score.toFixed(1)).toBe('56.3');
    expect(m6.band).toBe('C');
    expect(m6.offer?.limit).toBe(11000);
    expect(m6.offer?.binding).toBe('affordability');
    expect(r(m6.offer!.instalment)).toBe(345);
    expect(r(m6.offer!.totalProfitCost)).toBe(1409);
    expect(m6.humanReview).toBe(true);

    const m6t48 = run('abdullah', 6, 48);
    expect(m6t48.offer?.limit).toBe(12000);
    expect(r(m6t48.offer!.instalment)).toBe(293);

    const m12 = run('abdullah', 12);
    expect(m12.offer?.limit).toBe(11000);
    expect(m12.offer?.binding).toBe('affordability');
    expect(m12.growthBlocked).toBe(true);
    expect(m12.cardOffer).toBe(false);
    expect(m12.investing).toBe('emergencyFirst');

    const m12t48 = run('abdullah', 12, 48);
    expect(m12t48.offer?.limit).toBe(14500);
    expect(r(m12t48.offer!.instalment)).toBe(354);

    const m12t60 = run('abdullah', 12, 60);
    expect(m12t60.offer?.limit).toBe(15000);
    expect(m12t60.offer?.binding).toBe('bandCap');
    expect(r(m12t60.offer!.instalment)).toBe(304);

    const req = evaluate(personaInputs(PERSONAS.abdullah), 6, { tenor: 36, requested: 20000 });
    expect(req.requestAboveLimit).toBe(true);
    expect(req.humanReviewReasons).toContain('request');
  });

  it('never offers financing before month 6', () => {
    for (const id of ['faisal', 'noura', 'abdullah'] as const) for (let t = 0; t < 6; t++) expect(run(id, t).offer).toBeNull();
  });
});

describe('stage gates', () => {
  it('defaults pass all three gates', () => {
    const e = evaluateGates(GATE_DEFAULTS);
    expect(e.gates.map((g) => g.status)).toEqual(['PASS', 'PASS', 'PASS']);
    expect(e.exposureCap).toBe(136);
  });
  it('activation 50% and CAC 380 stop Gate 1 at SAR 61m', () => {
    const e = evaluateGates({ ...GATE_DEFAULTS, activation: 50, cac: 380 });
    expect(e.gates[0].status).toBe('STOP');
    expect(e.gates[1].status).toBe('LOCKED');
    expect(e.exposureCap).toBe(61);
  });
  it('one missed metric is WATCH', () => {
    const e = evaluateGates({ ...GATE_DEFAULTS, cac: 380 });
    expect(e.gates[0].status).toBe('WATCH');
  });
  it('two consecutive quarters above 3.5% cost of risk stop the programme', () => {
    const q = [...GATE_DEFAULTS.quarterly];
    q[5] = 3.8;
    q[6] = 3.9;
    const e = evaluateGates({ ...GATE_DEFAULTS, quarterly: q });
    expect(e.gates[0].status).toBe('PASS');
    expect(e.gates[1].status).toBe('STOP');
    expect(e.exposureCap).toBe(110);
    const q2 = [...GATE_DEFAULTS.quarterly];
    q2[1] = 3.6;
    q2[2] = 3.7;
    expect(evaluateGates({ ...GATE_DEFAULTS, quarterly: q2 }).gates[0].status).toBe('STOP');
    const q3 = [...GATE_DEFAULTS.quarterly];
    q3[1] = 3.6;
    q3[3] = 3.7;
    expect(evaluateGates({ ...GATE_DEFAULTS, quarterly: q3 }).stoppedAt).toBeNull();
  });
});
