import { UNIT_ECONOMICS as UE } from '../../data/deck';
import { useT, useTpl } from '../../i18n';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { SectionHeader } from '../../components/ui/Controls';
import { SourceChip } from '../../components/ui/Provenance';
import { useFmt } from '../../components/ui/useFmt';
import { BreakEvenGauge, UnitWaterfall } from '../../components/charts/cockpit/UnitCharts';

/** c. Unit economics waterfall per average active customer (FY31) and the break-even gauge. */
export function UnitEconomics() {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const u = t.cockpit.unit;
  return (
    <SpotlightCard className="flex h-full flex-col p-5">
      <SectionHeader eyebrow={u.eyebrow} title={u.title} subtitle={u.subtitle} right={<SourceChip src="teamModel" />} />
      <div className="mt-4">
        <UnitWaterfall />
      </div>
      <div className="mt-5 border-t border-line/10 pt-4">
        <div className="mb-2 text-sm font-semibold">{u.gaugeTitle}</div>
        <BreakEvenGauge />
        <p className="mt-3 text-center text-xs leading-relaxed text-muted">
          {tp(u.gaugeNote, { needed: f.sar(UE.breakEvenNeeded), modelled: f.sar(UE.modelled) })}
        </p>
      </div>
    </SpotlightCard>
  );
}
