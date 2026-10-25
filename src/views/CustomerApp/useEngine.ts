import { useMemo } from 'react';
import { useApp, useJourney } from '../../store';
import { PERSONAS } from '../../config/illustrative';
import { evaluate, personaInputs, type CreditResult } from '../../logic/creditEngine';

/** Credit-engine output for the selected persona at the current month and tenor. */
export function useEngine(): CreditResult | null {
  const pid = useApp((s) => s.personaId);
  const j = useJourney();
  return useMemo(() => (pid && j ? evaluate(personaInputs(PERSONAS[pid]), j.month, { tenor: j.tenor }) : null), [pid, j?.month, j?.tenor]);
}
