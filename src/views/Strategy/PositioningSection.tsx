import { useMemo, useState } from 'react';
import { AlertTriangle, CircleDashed } from 'lucide-react';
import { COMPETITORS, WHITE_SPACES, type CompetitorId, type SourceId } from '../../data/deck';
import { useT, useTpl } from '../../i18n';
import { Fig, SourceChip } from '../../components/ui/Provenance';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { PositioningMap, type MapHighlight, type MapLabels } from '../../components/charts/strategy/PositioningMap';
import { cn } from '../../lib/cn';
import { CardHead, Initials, Item, Rich, SecHead, Stagger } from './ui';

function PeerCard({
  id,
  initials,
  kind,
  source,
  active,
  onHover,
}: {
  id: CompetitorId;
  initials: string;
  kind: 'incumbent' | 'digital';
  source: SourceId;
  active: boolean;
  onHover: (id: MapHighlight) => void;
}) {
  const t = useT().strategy.positioning;
  return (
    <SpotlightCard
      onPointerEnter={() => onHover(id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      className={cn('flex h-full flex-col p-4 transition-shadow duration-300', active && 'shadow-goldglow')}
    >
      <div className="flex items-start gap-2.5">
        <Initials text={initials} tone={active ? 'gold' : 'neutral'} size={34} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-[0.9375rem] font-semibold leading-tight">{t.names[id]}</div>
          <div className="mt-0.5 text-[0.6875rem] text-muted">{t.kinds[kind]}</div>
        </div>
        <SourceChip src={source} />
      </div>
      <ul className="mt-3 flex-1 space-y-1.5">
        {t.facts[id].map((fct, i) => (
          <li key={i} className="flex items-baseline gap-1.5 text-[0.75rem] leading-snug text-ink/85">
            {fct.v ? (
              <Fig src={source} className="shrink-0 font-semibold text-ink">
                {fct.v}
              </Fig>
            ) : (
              <CircleDashed className="h-3 w-3 shrink-0 translate-y-0.5 text-muted" strokeWidth={1.5} aria-hidden />
            )}
            <span>{fct.l}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-xl border border-brand/20 bg-brand/[0.06] p-2.5">
        <div className="text-[0.625rem] font-semibold uppercase tracking-wider text-brand">{t.gapLabel}</div>
        <p className="mt-0.5 text-[0.75rem] leading-snug">{t.gaps[id]}</p>
      </div>
    </SpotlightCard>
  );
}

export function PositioningSection() {
  const t = useT().strategy.positioning;
  const tpl = useTpl();
  const [hl, setHl] = useState<MapHighlight>(null);

  const labels: MapLabels = useMemo(
    () => ({
      title: t.mapTitle,
      axisX0: t.axisX0,
      axisX1: t.axisX1,
      axisY0: t.axisY0,
      axisY1: t.axisY1,
      whiteSpace: t.whiteSpace,
      whiteSpaceLabel: t.whiteSpaceLabel,
      today: t.today,
      target: t.target,
      showMove: t.showMove,
      reset: t.reset,
      dragHint: t.dragHint,
      inside: t.inside,
      outside: t.outside,
      markerAria: (x: number, y: number) => tpl(t.markerAria, { x, y }),
      names: t.names,
    }),
    [t, tpl],
  );

  return (
    <section id="strategy-positioning" aria-label={t.eyebrow} className="scroll-mt-36">
      <SecHead eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <Stagger className="grid gap-4 lg:grid-cols-12">
        <Item className="lg:col-span-7">
          <SpotlightCard border="gold" className="h-full p-5">
            <CardHead title={t.mapTitle} right={<SourceChip src="teamView" />} />
            <PositioningMap labels={labels} highlight={hl} onHighlight={setHl} />
            <p className="mt-3 border-t border-line/10 pt-3 text-[0.75rem] italic text-muted">{t.caption}</p>
          </SpotlightCard>
        </Item>

        <Item className="lg:col-span-5">
          <div className="flex h-full flex-col gap-3">
            <h3 className="font-display text-[1rem] font-semibold leading-snug">{t.peersTitle}</h3>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              {COMPETITORS.map((c) => (
                <PeerCard
                  key={c.id}
                  id={c.id}
                  initials={c.initials}
                  kind={c.kind}
                  source={c.source ?? 'teamView'}
                  active={hl === c.id}
                  onHover={setHl}
                />
              ))}
            </div>
            <p className="text-[0.6875rem] leading-relaxed text-muted">{t.dataGap}</p>
          </div>
        </Item>

        <Item className="lg:col-span-12">
          <SpotlightCard className="p-5">
            <CardHead title={t.spacesTitle} right={<SourceChip src="report" />} />
            <div className="grid gap-3 md:grid-cols-3">
              {WHITE_SPACES.map((id, i) => {
                const s = t.spaces[id];
                return (
                  <div key={id} className="inner relative overflow-hidden p-4">
                    <div aria-hidden className="sadu absolute inset-x-0 top-0 h-4" />
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 font-display text-[0.75rem] font-bold text-gold">
                        {i + 1}
                      </span>
                      <span className="eyebrow text-gold">
                        <Rich text={t.spaceLabel} values={{ n: i + 1 }} />
                      </span>
                    </div>
                    <p className="mt-2.5 font-display text-[0.9375rem] font-semibold leading-snug">{s.title}</p>
                    <p className="mt-1.5 text-[0.75rem] text-muted">{s.pool}</p>
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-line/10 bg-line/[0.03] p-2.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                      <div className="text-[0.75rem] leading-snug">
                        <span className="font-semibold">{t.mainRisk}: </span>
                        {s.risk}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>
        </Item>
      </Stagger>
    </section>
  );
}
