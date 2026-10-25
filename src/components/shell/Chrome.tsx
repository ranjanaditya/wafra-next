import { useEffect } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { CheckCircle2, CircleAlert, FlaskConical, Info, OctagonX, X } from 'lucide-react';
import { useApp } from '../../store';
import { useMsg, useT } from '../../i18n';
import { SOURCE_DRAWER, SOURCES, type Prov } from '../../data/deck';
import { ProvTag } from '../ui/Provenance';
import { cn } from '../../lib/cn';

/** Thin scroll-progress bar. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[95] h-[2px] origin-left bg-gradient-to-r from-brand via-brand to-gold rtl:origin-right"
      style={{ scaleX: x }}
    />
  );
}

/** "Prototype · synthetic data" badge, visible on every view. */
export function PrototypeBadge() {
  const t = useT();
  return (
    <div className="pointer-events-none fixed bottom-4 start-4 z-[180]">
      <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium text-ink/90 shadow-soft">
        <FlaskConical className="h-3.5 w-3.5 text-gold" strokeWidth={1.75} aria-hidden />
        {t.common.badge}
      </div>
    </div>
  );
}

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-[2px]"
    />
  );
}

/** Slide-over listing every source and the provenance tags. */
export function SourcesDrawer() {
  const t = useT();
  const open = useApp((s) => s.sourcesOpen);
  const setOpen = useApp((s) => s.setSourcesOpen);
  const from = useApp((s) => (s.lang === 'ar' ? '-100%' : '100%'));
  const provs: Prov[] = ['CASE', 'TEAM', 'REPORT', 'GASTAT', 'SAMA', 'FSDP', 'PUBLIC', 'ILLUS'];
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClose={() => setOpen(false)} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t.common.drawer.title}
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            className="fixed inset-y-0 end-0 z-[170] flex w-[420px] max-w-[92vw] flex-col border-s border-line/10 bg-elev/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line/10 p-6">
              <div>
                <div className="eyebrow mb-1">{t.common.controls.sources}</div>
                <h2 className="font-display text-h4 font-semibold">{t.common.drawer.title}</h2>
                <p className="mt-1 text-[13px] text-muted">{t.common.drawer.intro}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.common.close} className="rounded-full p-2 text-muted hover:bg-line/10 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <section>
                <h3 className="eyebrow mb-3">{t.common.drawer.logTitle}</h3>
                <ol className="space-y-2">
                  {SOURCE_DRAWER.map((id, i) => (
                    <li key={id} className="inner flex items-center gap-3 px-3 py-2.5">
                      <span className="num w-5 text-[11px] text-muted">{i + 1}</span>
                      <span className="flex-1 text-[13px] leading-snug">{t.common.sources[id]}</span>
                      <ProvTag prov={SOURCES[id].prov} />
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <h3 className="eyebrow mb-3">{t.common.drawer.provTitle}</h3>
                <ul className="space-y-2">
                  {provs.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <ProvTag prov={p} className="mt-0.5 shrink-0" />
                      <span className="text-[12px] leading-snug text-muted">{t.common.provHint[p]}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="inner p-3 text-[12px] leading-relaxed text-muted">{t.common.drawer.note}</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** "?" shortcut sheet. */
export function ShortcutSheet() {
  const t = useT();
  const open = useApp((s) => s.shortcutsOpen);
  const setOpen = useApp((s) => s.setShortcutsOpen);
  const rows: [string[], string][] = [
    [['1', '2', '3', '4'], t.common.shortcuts.items.areas],
    [['L'], t.common.shortcuts.items.lang],
    [['T'], t.common.shortcuts.items.theme],
    [['R'], t.common.shortcuts.items.reset],
    [['?'], t.common.shortcuts.items.help],
    [['Esc'], t.common.shortcuts.items.esc],
  ];
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClose={() => setOpen(false)} />
          <div className="pointer-events-none fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.common.shortcuts.title}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="card pointer-events-auto w-[420px] max-w-full p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-h4 font-semibold">{t.common.shortcuts.title}</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label={t.common.close} className="rounded-full p-2 text-muted hover:bg-line/10 hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="divide-y divide-line/10">
                {rows.map(([keys, label]) => (
                  <li key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-[13px] text-muted">{label}</span>
                    <span className="flex gap-1" dir="ltr">
                      {keys.map((k) => (
                        <kbd key={k} className="min-w-[28px] rounded-md border border-line/20 bg-line/5 px-2 py-0.5 text-center font-sans text-[12px] font-semibold">
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Toast stack. */
export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  const render = useMsg();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[190] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((tt) => {
          const Icon = tt.tone === 'success' ? CheckCircle2 : tt.tone === 'warn' ? CircleAlert : tt.tone === 'stop' ? OctagonX : Info;
          return (
            <motion.div
              key={tt.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="glass pointer-events-auto flex items-center gap-2.5 rounded-full py-2 pe-2 ps-4 text-[13px] shadow-soft"
            >
              <Icon
                className={cn('h-4 w-4', tt.tone === 'success' ? 'text-pass' : tt.tone === 'warn' ? 'text-watch' : tt.tone === 'stop' ? 'text-stop' : 'text-gold')}
                strokeWidth={1.75}
              />
              <span>{render(tt.msg)}</span>
              <button type="button" onClick={() => dismiss(tt.id)} className="rounded-full p-1 text-muted hover:text-ink" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Keeps <html> lang/dir/theme/presenter attributes in sync with the store. */
export function useDocumentAttributes() {
  const lang = useApp((s) => s.lang);
  const theme = useApp((s) => s.theme);
  const presenter = useApp((s) => s.presenter);
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === 'ar' ? 'rtl' : 'ltr';
    el.dataset.theme = theme;
    el.dataset.presenter = String(presenter);
  }, [lang, theme, presenter]);
}
