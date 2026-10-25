import { FileSearch, Radio } from 'lucide-react';
import { POLICY } from '../../config/illustrative';
import { useT, useTpl } from '../../i18n';
import { Page, PageHeader } from '../../components/ui/Page';
import { KpiStrip } from './KpiStrip';
import { HitlQueue } from './HitlQueue';
import { DecisionLog } from './DecisionLog';
import { GateSimulator } from './GateSimulator';
import { ScenarioPanel } from './ScenarioPanel';
import { UnitEconomics } from './UnitEconomics';
import { SensitivityLab } from './SensitivityLab';
import { RiskRegister } from './RiskRegister';
import { GtmPanel, PathPanel } from './PathPanel';
import { Reveal } from './shared';

/**
 * 3. Bank cockpit: a dense bento grid. The escalation queue and the stage-gate
 * simulator sit right after the KPI strip, where a live demo turns next.
 */
export default function Cockpit() {
  const t = useT();
  const tp = useTpl();
  return (
    <Page>
      <PageHeader
        eyebrow={t.cockpit.eyebrow}
        title={t.cockpit.title}
        subtitle={t.cockpit.subtitle}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-gold/40 bg-gold/10 text-gold">
              <Radio className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              {t.cockpit.liveChip}
            </span>
            <span className="chip border-ai/35 bg-ai/10 text-ai-glow">
              <FileSearch className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              {t.cockpit.scorecardNote}
            </span>
            <span className="chip font-mono" dir="ltr">
              {tp(t.cockpit.policyChip, { v: POLICY.version })}
            </span>
          </div>
        }
      />

      <KpiStrip />

      <div className="mt-4 grid grid-cols-12 gap-4">
        <Reveal i={0} className="col-span-12 lg:col-span-5">
          <HitlQueue />
        </Reveal>
        <Reveal i={1} className="col-span-12 lg:col-span-7">
          <DecisionLog />
        </Reveal>
        <Reveal i={2} className="col-span-12">
          <GateSimulator />
        </Reveal>
        <Reveal i={0} className="col-span-12 xl:col-span-8">
          <ScenarioPanel />
        </Reveal>
        <Reveal i={1} className="col-span-12 xl:col-span-4">
          <UnitEconomics />
        </Reveal>
        <Reveal i={0} className="col-span-12">
          <SensitivityLab />
        </Reveal>
        <Reveal i={0} className="col-span-12">
          <RiskRegister />
        </Reveal>
        <Reveal i={0} className="col-span-12 lg:col-span-7">
          <PathPanel />
        </Reveal>
        <Reveal i={1} className="col-span-12 lg:col-span-5">
          <GtmPanel />
        </Reveal>
      </div>
    </Page>
  );
}
