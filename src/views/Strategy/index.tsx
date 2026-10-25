import { Page, PageHeader } from '../../components/ui/Page';
import { useT } from '../../i18n';
import { SectionNav } from './SectionNav';
import { MarketSection } from './MarketSection';
import { PoolsSection } from './PoolsSection';
import { PositioningSection } from './PositioningSection';
import { WhereToPlaySection } from './WhereToPlaySection';
import { HowToWinSection } from './HowToWinSection';
import { RoadmapSection } from './RoadmapSection';

/** 4. Strategy explorer: the deck, made interactive (market, pools, positioning, where to play, how to win, roadmap and ask). */
export default function Strategy() {
  const t = useT().strategy;
  return (
    <Page>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <SectionNav />
      <div className="space-y-20">
        <MarketSection />
        <PoolsSection />
        <PositioningSection />
        <WhereToPlaySection />
        <HowToWinSection />
        <RoadmapSection />
      </div>
    </Page>
  );
}
