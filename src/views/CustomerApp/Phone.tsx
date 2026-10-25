import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, BatteryFull, CreditCard, Headset, House, Signal, Sparkles, Target, Wifi } from 'lucide-react';
import { JourneySnapshot, useApp, useJourney, type Journey, type PhoneTab } from '../../store';
import { useLang, useMsg, useT } from '../../i18n';
import { BRAND, PERSONAS } from '../../config/illustrative';
import { cn } from '../../lib/cn';
import { Tilt } from '../../components/fx/Tilt';
import { Monogram } from '../../components/shell/TopNav';
import { screenMotion } from './ui';
import { HelpSheet } from './HelpSheet';
import { WhySheet } from './screens/Financing';
import { Welcome } from './screens/Welcome';
import { Onboarding } from './screens/Onboarding';
import { SalaryFlow } from './screens/Salary';
import { Home } from './screens/Home';
import { GoalsScreen } from './screens/GoalsScreen';
import { Assistant } from './screens/Assistant';
import { CardScreen } from './screens/CardScreen';
import { lifeEventParams } from '../../logic/journey';
import { m, type Msg } from '../../lib/msg';

interface Banner {
  id: number;
  tone: 'gold' | 'ai' | 'brand';
  icon: ReactNode;
  title: Msg;
  body?: Msg;
  onClick?: () => void;
}

function useBanners() {
  const pid = useApp((s) => s.personaId);
  const j = useJourney();
  const chats = useApp((s) => (s.personaId ? s.chats[s.personaId] : null));
  const tab = useApp((s) => s.phoneTab);
  const setTab = useApp((s) => s.setPhoneTab);
  const [banner, setBanner] = useState<Banner | null>(null);
  const prev = useRef<{ pid: string | null; feed: number; humans: number; salaryStep: number }>({ pid: null, feed: 0, humans: 0, salaryStep: 0 });

  useEffect(() => {
    const feed = j?.feed.length ?? 0;
    const humans = chats?.filter((c) => c.from === 'human').length ?? 0;
    const salaryStep = j?.salaryStep ?? 0;
    const p = prev.current;
    if (p.pid === pid && pid && j) {
      if (feed > p.feed && j.feed[0]) {
        const ev = j.feed[0].event;
        setBanner({
          id: Date.now(),
          tone: 'gold',
          icon: <Sparkles className="h-4 w-4" />,
          title: m('app.lifeEvents.banner'),
          body: m(`app.lifeEvents.cards.${ev}.title`, lifeEventParams(pid, ev)),
          onClick: () => setTab('home'),
        });
      } else if (humans > p.humans && tab !== 'assistant') {
        const last = [...(chats ?? [])].reverse().find((c) => c.from === 'human');
        setBanner({ id: Date.now(), tone: 'gold', icon: <Headset className="h-4 w-4" />, title: m('app.assistant.humanBadge'), body: last?.msg, onClick: () => setTab('assistant') });
      } else if (salaryStep === 2 && p.salaryStep < 2) {
        const per = PERSONAS[pid];
        setBanner({
          id: Date.now(),
          tone: 'brand',
          icon: <Banknote className="h-4 w-4" />,
          title: m('app.salary.push', { amount: { sar: per.salary } }),
          body: m('app.salary.pushFrom', { employer: { key: `common.employers.${per.employer}` } }),
        });
      }
    }
    prev.current = { pid, feed, humans, salaryStep };
  }, [pid, j, chats, tab, setTab]);

  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => setBanner(null), 3800);
    return () => clearTimeout(id);
  }, [banner]);

  return { banner, dismiss: () => setBanner(null) };
}

function Island({ banner, onDismiss }: { banner: Banner | null; onDismiss: () => void }) {
  const render = useMsg();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[9px] z-40 flex justify-center px-[10px]">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        onClick={() => {
          banner?.onClick?.();
          onDismiss();
        }}
        className={cn('pointer-events-auto overflow-hidden bg-black text-white', banner ? 'w-full cursor-pointer rounded-[24px]' : 'h-[30px] w-[104px] rounded-full')}
        style={{ boxShadow: banner ? '0 12px 30px -10px rgba(0,0,0,.7)' : undefined }}
      >
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.08 }}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  banner.tone === 'gold' ? 'bg-gold text-[#1a1408]' : banner.tone === 'ai' ? 'bg-ai text-white' : 'bg-brand text-white',
                )}
              >
                {banner.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold">{render(banner.title)}</div>
                {banner.body && <div className="line-clamp-2 text-[11.5px] leading-snug text-white/75">{render(banner.body)}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function StatusBar() {
  const t = useT();
  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-[48px] items-center justify-between px-[30px] pt-[6px] text-[13px] font-semibold text-ink">
      <span className="num">{t.app.phone.time}</span>
      <span className="flex items-center gap-1.5">
        <Signal className="h-[14px] w-[14px]" strokeWidth={2.2} />
        <Wifi className="h-[14px] w-[14px]" strokeWidth={2.2} />
        <BatteryFull className="h-[17px] w-[17px]" strokeWidth={1.8} />
      </span>
    </div>
  );
}

function AppHeader() {
  const t = useT();
  const lang = useLang();
  const j = useJourney();
  const setHelpOpen = useApp((s) => s.setHelpOpen);
  return (
    <div className="flex h-[46px] shrink-0 items-center gap-2 px-[16px]">
      <Monogram size={24} />
      {!j && <span className="truncate font-display text-[14px] font-semibold tracking-tight">{BRAND[lang]}</span>}
      {j && (
        <motion.span
          key={j.month}
          initial={{ scale: 1.15, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="num whitespace-nowrap rounded-full bg-line/10 px-2 py-[3px] text-[11px] font-semibold text-muted"
        >
          {t.app.phone.month.replace('{m}', String(j.month))}
        </motion.span>
      )}
      <span className="flex-1" />
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        data-cursor="open"
        className="inline-flex h-[30px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gold px-2.5 text-[12px] font-semibold text-[#1a1408] shadow-[0_6px_16px_-8px_rgb(var(--gold)/0.9)] transition-[filter] hover:brightness-110"
      >
        <Headset className="h-[14px] w-[14px]" strokeWidth={2} />
        {t.app.phone.help}
      </button>
    </div>
  );
}

const TABS: { id: PhoneTab; Icon: typeof House }[] = [
  { id: 'home', Icon: House },
  { id: 'goals', Icon: Target },
  { id: 'assistant', Icon: Sparkles },
  { id: 'card', Icon: CreditCard },
];

function TabBar() {
  const t = useT();
  const tab = useApp((s) => s.phoneTab);
  const setTab = useApp((s) => s.setPhoneTab);
  return (
    <div className="relative z-10 mx-[12px] mb-[4px] flex h-[58px] shrink-0 items-center justify-around rounded-[22px] border border-line/10 bg-elev/90 px-1 shadow-[0_-8px_30px_-16px_rgb(0_0_0/0.6)]">
      {TABS.map(({ id, Icon }) => {
        const active = tab === id;
        const isAi = id === 'assistant';
        return (
          <button key={id} type="button" onClick={() => setTab(id)} aria-current={active ? 'page' : undefined} className="relative flex h-[48px] flex-1 flex-col items-center justify-center gap-[3px]">
            {active && <motion.span layoutId="phone-tab" className={cn('absolute inset-x-1 inset-y-0.5 rounded-[16px]', isAi ? 'bg-ai/15' : 'bg-line/10')} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <Icon className={cn('relative h-[19px] w-[19px]', active ? (isAi ? 'text-ai-glow' : 'text-ink') : 'text-muted')} strokeWidth={1.75} />
            <span className={cn('relative text-[10.5px] font-medium', active ? (isAi ? 'text-ai-glow' : 'text-ink') : 'text-muted')}>{t.app.phone.tabs[id]}</span>
          </button>
        );
      })}
    </div>
  );
}

function useScreen(): { key: string; node: ReactNode; tabs: boolean; snapshot: Journey | null } {
  const pid = useApp((s) => s.personaId);
  const tab = useApp((s) => s.phoneTab);
  const j = useJourney();
  if (!pid || !j) return { key: 'welcome', node: <Welcome />, tabs: false, snapshot: null };
  if (tab === 'assistant') return { key: `assistant-${pid}`, node: <Assistant />, tabs: true, snapshot: j };
  if (tab === 'card') return { key: `card-${pid}`, node: <CardScreen />, tabs: true, snapshot: j };
  if (tab === 'goals') return { key: `goals-${pid}`, node: <GoalsScreen />, tabs: true, snapshot: j };
  if (j.month === 0 && j.onboard < 5) return { key: `onb-${pid}-${j.onboard}`, node: <Onboarding />, tabs: false, snapshot: j };
  if (j.month === 1 && j.salaryStep < 5) return { key: `sal-${pid}-${j.salaryStep}`, node: <SalaryFlow />, tabs: false, snapshot: j };
  const stage = j.month < 6 ? 'seasoning' : j.month < 12 ? 'first' : 'expanded';
  return { key: `home-${pid}-${stage}`, node: <Home />, tabs: true, snapshot: j };
}

export function Phone() {
  const lang = useLang();
  const t = useT();
  const { key, node, tabs, snapshot } = useScreen();
  const { banner, dismiss } = useBanners();
  const dir: 1 | -1 = lang === 'ar' ? -1 : 1;
  const sm = screenMotion(dir);

  return (
    <div className="relative mx-auto" style={{ height: 'clamp(500px, calc(100vh - 188px), 800px)', aspectRatio: '360 / 744' }}>
      <div aria-hidden className="absolute -inset-10 -z-10 rounded-[80px] bg-[radial-gradient(closest-side,rgb(var(--brand)/0.22),transparent)] blur-2xl" />
      <Tilt track="window" max={5} className="h-full w-full" innerClassName="h-full w-full" glareClassName="rounded-[56px]">
        <div
          className="relative h-full w-full rounded-[56px] p-[10px]"
          style={{
            background: 'linear-gradient(150deg, #4a4e58 0%, #1a1c22 22%, #0d0e12 55%, #2b2e36 82%, #121318 100%)',
            boxShadow: '0 60px 120px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 0 2px #050608',
          }}
        >
          <span aria-hidden className="absolute -start-[3px] top-[120px] h-[34px] w-[3px] rounded-s bg-[#2a2c33]" />
          <span aria-hidden className="absolute -start-[3px] top-[170px] h-[58px] w-[3px] rounded-s bg-[#2a2c33]" />
          <span aria-hidden className="absolute -end-[3px] top-[150px] h-[86px] w-[3px] rounded-e bg-[#2a2c33]" />
          <div role="region" aria-label={t.app.phone.aria} className="relative h-full w-full overflow-hidden rounded-[46px] bg-bg">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgb(var(--brand)/0.10),transparent_60%)]" />
            <StatusBar />
            <Island banner={banner} onDismiss={dismiss} />
            <div className="absolute inset-0 flex flex-col pt-[48px]">
              <AppHeader />
              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={key}
                    initial={sm.initial}
                    animate={sm.animate}
                    exit={sm.exit}
                    transition={sm.transition}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden px-[16px] pb-[18px] pt-[4px] [scrollbar-width:none]"
                  >
                    <JourneySnapshot.Provider value={snapshot}>{node}</JourneySnapshot.Provider>
                  </motion.div>
                </AnimatePresence>
              </div>
              {tabs && <TabBar />}
              <div className="h-[20px] shrink-0" />
            </div>
            <WhySheet />
            <HelpSheet />
            <span aria-hidden className="absolute bottom-[7px] left-1/2 z-50 h-[5px] w-[118px] -translate-x-1/2 rounded-full bg-ink/70" />
          </div>
        </div>
      </Tilt>
    </div>
  );
}
