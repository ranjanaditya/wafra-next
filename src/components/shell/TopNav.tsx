import { motion } from 'framer-motion';
import { BookOpen, Keyboard, Monitor, Moon, Sun } from 'lucide-react';
import { AREAS, useApp, type Area } from '../../store';
import { useT, useLang } from '../../i18n';
import { BRAND } from '../../config/illustrative';
import { cn } from '../../lib/cn';
import { Magnetic } from '../fx/Magnetic';

export function Monogram({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      <defs>
        <linearGradient id="wm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--brand))" />
          <stop offset="1" stopColor="rgb(var(--gold))" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="rgb(var(--elev))" stroke="rgb(var(--line) / 0.12)" />
      <path d="M14 20l9 26 9-18 9 18 9-26" fill="none" stroke="url(#wm-g)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/10 hover:text-ink',
        active && 'bg-line/10 text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function TopNav() {
  const t = useT();
  const lang = useLang();
  const area = useApp((s) => s.area);
  const setArea = useApp((s) => s.setArea);
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const toggleLang = useApp((s) => s.toggleLang);
  const presenter = useApp((s) => s.presenter);
  const togglePresenter = useApp((s) => s.togglePresenter);
  const setSourcesOpen = useApp((s) => s.setSourcesOpen);
  const setShortcutsOpen = useApp((s) => s.setShortcutsOpen);
  const unseen = useApp((s) => s.unseenTickets);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-3">
      <nav
        aria-label={t.common.navAria}
        className="glass pointer-events-auto flex w-full max-w-shell items-center gap-2 rounded-full py-1.5 pe-1.5 ps-2.5 shadow-soft"
      >
        <button type="button" onClick={() => setArea('story')} className="flex shrink-0 items-center gap-2 rounded-full pe-2" aria-label={BRAND[lang]}>
          <Monogram size={30} />
          <span className="hidden font-display text-[15px] font-semibold tracking-tight lg:inline">{BRAND[lang]}</span>
        </button>

        <div className="mx-auto flex items-center gap-0.5 overflow-x-auto rounded-full bg-line/5 p-1">
          {AREAS.map((a: Area, i) => {
            const active = a === area;
            return (
              <Magnetic key={a} strength={6} radius={40}>
                <button
                  type="button"
                  onClick={() => setArea(a)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors xl:px-4',
                    active ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-line/[0.12] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_6px_20px_-10px_rgb(var(--brand)/0.7)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <kbd className="hidden rounded border border-line/15 px-1 font-sans text-[10px] text-muted xl:inline">{i + 1}</kbd>
                    {t.common.nav[a]}
                    {a === 'cockpit' && unseen > 0 && (
                      <span className="relative ms-0.5 inline-flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                      </span>
                    )}
                  </span>
                </button>
              </Magnetic>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t.common.controls.langAria}
            className="h-9 rounded-full px-3 text-[13px] font-semibold text-muted transition-colors hover:bg-line/10 hover:text-ink"
            style={{ fontFamily: lang === 'en' ? 'IBM Plex Sans Arabic' : 'Inter' }}
          >
            {t.common.controls.langToggle}
          </button>
          <IconBtn label={t.common.controls.themeAria} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
          </IconBtn>
          <IconBtn label={t.common.controls.presenterAria} onClick={togglePresenter} active={presenter}>
            <Monitor className="h-4 w-4" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn label={t.common.controls.sources} onClick={() => setSourcesOpen(true)}>
            <BookOpen className="h-4 w-4" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn label={t.common.controls.shortcuts} onClick={() => setShortcutsOpen(true)}>
            <Keyboard className="h-4 w-4" strokeWidth={1.5} />
          </IconBtn>
        </div>
      </nav>
    </header>
  );
}
