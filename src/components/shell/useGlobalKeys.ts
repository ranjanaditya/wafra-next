import { useEffect } from 'react';
import { AREAS, useApp } from '../../store';
import { m } from '../../lib/msg';

const isTyping = (el: EventTarget | null) => {
  const n = el as HTMLElement | null;
  if (!n) return false;
  const tag = n.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT' || n.isContentEditable) return true;
  if (tag === 'INPUT') return (n as HTMLInputElement).type !== 'checkbox' && (n as HTMLInputElement).type !== 'button';
  return false;
};

/**
 * Keyboard: 1 to 4 switch areas · L language · T theme · R reset demo ·
 * ? shortcut sheet · Esc closes panels.
 */
export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      const s = useApp.getState();
      const k = e.key;
      if (k >= '1' && k <= '4') {
        s.setArea(AREAS[Number(k) - 1]);
        window.scrollTo({ top: 0 });
        return;
      }
      switch (k.toLowerCase()) {
        case 'l':
          s.toggleLang();
          return;
        case 't':
          s.toggleTheme();
          return;
        case 'r':
          s.resetDemo();
          s.toast(m('common.toasts.reset'), 'success');
          return;
        case '?':
          s.setShortcutsOpen(!s.shortcutsOpen);
          return;
        case 'escape':
          if (s.shortcutsOpen) s.setShortcutsOpen(false);
          else if (s.sourcesOpen) s.setSourcesOpen(false);
          else if (s.helpOpen) s.setHelpOpen(false);
          return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
