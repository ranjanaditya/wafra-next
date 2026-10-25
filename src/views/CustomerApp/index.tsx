import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '../../i18n';
import { Page } from '../../components/ui/Page';
import { Segmented } from '../../components/ui/Controls';
import { SpotlightCard } from '../../components/fx/Spotlight';
import { Phone } from './Phone';
import { JourneyTimeline } from './JourneyTimeline';
import { EngineLog, LifeEventsDock, PersonaSwitcher, TryNumbers } from './Panels';

/**
 * Customer app (hero demo): the phone on the left follows the deck's customer
 * path; the right side holds the journey timeline, life events and the
 * "Behind the glass" engine room.
 */
export default function CustomerApp() {
  const t = useT();
  const [tab, setTab] = useState<'log' | 'sandbox'>('log');
  return (
    <Page className="pb-8 pt-[82px]">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 flex flex-col items-center gap-3 lg:col-span-5 xl:col-span-4">
          <PersonaSwitcher />
          <Phone />
        </div>
        <div className="col-span-12 flex min-h-0 flex-col gap-3 lg:col-span-7 xl:col-span-8">
          <div className="flex min-w-0 items-baseline gap-3 pt-1">
            <h1 className="shrink-0 font-display text-[24px] font-semibold leading-tight tracking-tight">{t.app.title}</h1>
            <p className="min-w-0 truncate text-[12.5px] text-muted" title={t.app.subtitle}>
              <span className="eyebrow me-2 !text-[11px]">{t.app.eyebrow}</span>
            </p>
          </div>
          <JourneyTimeline />
          <LifeEventsDock />
          <SpotlightCard className="flex min-h-[250px] flex-1 flex-col p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-[17px] font-semibold">{tab === 'log' ? t.app.log.title : t.app.sandbox.title}</h2>
                <p className="text-[12px] text-muted">{tab === 'log' ? t.app.log.sub : t.app.sandbox.sub}</p>
              </div>
              <Segmented
                size="sm"
                value={tab}
                onChange={setTab}
                layoutId="app-panel-tab"
                options={[
                  { value: 'log', label: t.app.tabs.log },
                  { value: 'sandbox', label: t.app.tabs.sandbox },
                ]}
              />
            </div>
            <div className="relative min-h-0 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  {tab === 'log' ? <EngineLog /> : <TryNumbers />}
                </motion.div>
              </AnimatePresence>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </Page>
  );
}
