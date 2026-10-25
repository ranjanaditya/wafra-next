import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Fingerprint, Info, ShieldCheck } from 'lucide-react';
import { useApp, useJourney } from '../../../store';
import { useT } from '../../../i18n';
import { PERSONAS } from '../../../config/illustrative';
import { Toggle } from '../../../components/ui/Controls';
import { Illus } from '../../../components/ui/Provenance';
import { finishOnboarding, setOnboard } from '../../../logic/journey';
import { cn } from '../../../lib/cn';
import { CheckMorph, Confetti, DebitCard, PButton, PCard, SimTag, StepHeader } from '../ui';

export function Onboarding() {
  const j = useJourney()!;
  const step = j.onboard;
  return step === 0 ? <IdStep /> : step === 1 ? <NafathStep /> : step === 2 ? <LivenessStep /> : step === 3 ? <ConsentStep /> : <ReadyStep />;
}

function IdStep() {
  const t = useT();
  const pid = useApp((s) => s.personaId)!;
  const p = PERSONAS[pid];
  return (
    <div>
      <StepHeader step={0} title={t.app.onboarding.idTitle} sub={t.app.onboarding.idSub} />
      <label className="mb-1.5 block text-[12px] font-semibold text-muted" htmlFor="nid">
        {t.app.onboarding.idLabel}
      </label>
      <div className="relative">
        <input
          id="nid"
          readOnly
          value={p.maskedId}
          aria-describedby="nid-hint"
          className="num h-[50px] w-full rounded-[14px] border border-line/15 bg-line/[0.05] px-4 text-[17px] font-semibold tracking-[0.2em] text-ink outline-none"
          dir="ltr"
        />
        <ShieldCheck className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-pass" strokeWidth={1.75} />
      </div>
      <p id="nid-hint" className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-muted">
        <Info className="mt-[1px] h-3.5 w-3.5 shrink-0" />
        {t.app.onboarding.idHint}
      </p>
      <PCard className="mt-5" tone="brand">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Fingerprint className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="text-[12.5px] leading-snug text-ink/90">{t.app.onboarding.nafathSub}</div>
        </div>
      </PCard>
      <PButton full className="mt-5" onClick={() => setOnboard(1)}>
        {t.app.onboarding.verifyBtn}
      </PButton>
      <p className="mt-3 text-center text-[11px] text-muted">{t.app.onboarding.eligibility}</p>
    </div>
  );
}

function NafathStep() {
  const t = useT();
  const [phase, setPhase] = useState<'wait' | 'pick' | 'done'>('wait');
  useEffect(() => {
    const a = setTimeout(() => setPhase('pick'), 1100);
    const b = setTimeout(() => setPhase('done'), 2000);
    const c = setTimeout(() => setOnboard(2), 3100);
    return () => [a, b, c].forEach(clearTimeout);
  }, []);
  return (
    <div>
      <StepHeader step={1} title={t.app.onboarding.nafathTitle} sub={t.app.onboarding.nafathSub} />
      <PCard className="flex flex-col items-center py-6">
        <SimTag className="mb-4" />
        <div className="relative mb-4 flex h-[104px] w-[104px] items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 104 104" aria-hidden>
            <circle cx="52" cy="52" r="46" fill="none" stroke="rgb(var(--line) / 0.1)" strokeWidth="6" />
            <motion.circle
              cx="52"
              cy="52"
              r="46"
              fill="none"
              stroke="rgb(var(--pass))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={289}
              initial={{ strokeDashoffset: 289 }}
              animate={{ strokeDashoffset: phase === 'done' ? 0 : phase === 'pick' ? 110 : 220 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="num font-display text-[40px] font-semibold">47</span>
        </div>
        <div className="flex gap-3" dir="ltr">
          {[12, 47, 83].map((n) => (
            <motion.span
              key={n}
              animate={phase !== 'wait' && n === 47 ? { scale: [1, 1.18, 1.06], backgroundColor: 'rgb(var(--pass) / 0.2)' } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className={cn(
                'num flex h-11 w-11 items-center justify-center rounded-full border text-[15px] font-semibold',
                phase !== 'wait' && n === 47 ? 'border-pass text-pass' : 'border-line/20 text-muted',
              )}
            >
              {n}
            </motion.span>
          ))}
        </div>
        <div className="mt-5 flex h-5 items-center gap-1.5 text-[12.5px] font-medium">
          {phase === 'done' ? (
            <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 text-pass">
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {t.app.onboarding.nafathDone}
            </motion.span>
          ) : (
            <span className="flex items-center gap-2 text-muted">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-blink rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
              {t.app.onboarding.nafathWaiting}
            </span>
          )}
        </div>
      </PCard>
    </div>
  );
}

/** Abstract face-mesh outline (no camera, no real face). */
function FaceMesh({ done }: { done: boolean }) {
  const pts: [number, number][] = [
    [70, 22], [48, 30], [92, 30], [34, 52], [106, 52], [30, 78], [110, 78], [36, 104], [104, 104], [50, 126], [90, 126], [70, 136],
    [54, 66], [86, 66], [70, 84], [58, 106], [82, 106], [70, 54],
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 10], [9, 11], [10, 11],
    [12, 17], [13, 17], [12, 14], [13, 14], [14, 15], [14, 16], [15, 16], [15, 9], [16, 10], [1, 17], [2, 17], [12, 3], [13, 4], [12, 5], [13, 6], [15, 7], [16, 8], [0, 17],
  ];
  return (
    <svg viewBox="0 0 140 160" className="h-[170px] w-[150px]" aria-hidden>
      <ellipse cx="70" cy="80" rx="52" ry="66" fill="none" stroke="rgb(var(--line) / 0.25)" strokeDasharray="4 5" />
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={pts[a][0]}
          y1={pts[a][1]}
          x2={pts[b][0]}
          y2={pts[b][1]}
          stroke={done ? 'rgb(var(--pass))' : 'rgb(var(--ai-glow))'}
          strokeWidth="0.9"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ delay: 0.03 * i, duration: 0.4 }}
        />
      ))}
      {pts.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r="2" fill={done ? 'rgb(var(--pass))' : 'rgb(var(--ai-glow))'} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.04 * i }} />
      ))}
    </svg>
  );
}

function LivenessStep() {
  const t = useT();
  const [done, setDone] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setDone(true), 1900);
    const b = setTimeout(() => setOnboard(3), 2900);
    return () => [a, b].forEach(clearTimeout);
  }, []);
  return (
    <div>
      <StepHeader step={2} title={t.app.onboarding.livenessTitle} sub={t.app.onboarding.livenessSub} />
      <PCard className="relative flex flex-col items-center overflow-hidden py-5" tone="ai">
        <SimTag className="mb-2" />
        <div className="relative">
          <FaceMesh done={done} />
          {!done && <div className="pointer-events-none absolute inset-x-2 top-0 h-10 animate-scan bg-gradient-to-b from-transparent via-ai/40 to-transparent" />}
        </div>
        <div className={cn('mt-2 flex items-center gap-1.5 text-[12.5px] font-medium', done ? 'text-pass' : 'text-ai-glow')}>
          {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <span className="h-2 w-2 animate-pulse rounded-full bg-ai-glow" />}
          {done ? t.app.onboarding.livenessDone : t.app.onboarding.livenessScanning}
        </div>
      </PCard>
    </div>
  );
}

function ConsentStep() {
  const t = useT();
  const [salary, setSalary] = useState(true);
  const [bureau, setBureau] = useState(true);
  const [marketing, setMarketing] = useState(false);
  return (
    <div>
      <StepHeader step={3} title={t.app.onboarding.consentTitle} />
      <PCard className="space-y-4">
        <Toggle checked={salary} onChange={setSalary} label={t.app.onboarding.consentSalary} description={t.app.onboarding.consentSalaryHint} tone="pass" />
        <div className="h-px bg-line/10" />
        <Toggle checked={bureau} onChange={setBureau} label={t.app.onboarding.consentBureau} description={t.app.onboarding.consentBureauHint} tone="pass" />
        <div className="h-px bg-line/10" />
        <Toggle checked={marketing} onChange={setMarketing} label={t.app.onboarding.consentMarketing} description={t.app.onboarding.consentMarketingHint} tone="pass" />
      </PCard>
      <p className="mt-3 text-[11px] text-muted">{t.app.onboarding.eligibility}</p>
      <PButton full className="mt-4" onClick={() => setOnboard(4)}>
        {t.app.onboarding.openBtn}
      </PButton>
    </div>
  );
}

function ReadyStep() {
  const t = useT();
  const pid = useApp((s) => s.personaId)!;
  return (
    <div className="relative">
      <Confetti />
      <div className="flex flex-col items-center pt-2 text-center">
        <CheckMorph />
        <h3 className="mt-3 font-display text-[22px] font-semibold tracking-tight">{t.app.onboarding.readyTitle}</h3>
        <p className="mt-1 text-[13px] text-muted">{t.app.onboarding.readySub}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
          {t.app.onboarding.timeTaken}
          <Illus />
        </div>
      </div>
      <AnimatePresence>
        <motion.div
          initial={{ rotateY: 85, opacity: 0, y: 20 }}
          animate={{ rotateY: 0, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.25 }}
          style={{ transformPerspective: 900 }}
          className="mt-5"
        >
          <DebitCard persona={PERSONAS[pid]} />
        </motion.div>
      </AnimatePresence>
      <PButton full className="mt-6" onClick={finishOnboarding}>
        {t.app.onboarding.continueSalary}
      </PButton>
    </div>
  );
}
