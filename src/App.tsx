import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { MotionConfig, useAnimate, useReducedMotion } from 'framer-motion';
import type { Area } from './store';
import { useApp } from './store';
import { useT } from './i18n';
import { Aurora, Grain } from './components/fx/Aurora';
import { Cursor } from './components/fx/Cursor';
import { TopNav } from './components/shell/TopNav';
import { PrototypeBadge, ScrollProgress, ShortcutSheet, SourcesDrawer, Toasts, useDocumentAttributes } from './components/shell/Chrome';
import Story from './views/Story';
import CustomerApp from './views/CustomerApp';
import { useGlobalKeys } from './components/shell/useGlobalKeys';

// The cockpit and strategy areas are lazy-loaded.
const Cockpit = lazy(() => import('./views/Cockpit'));
const Strategy = lazy(() => import('./views/Strategy'));

function Loading() {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-muted">
      <span className="me-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
      {t.common.loading}
    </div>
  );
}

/**
 * Blur-and-scale cross-fade between areas, driven imperatively so that no
 * animation inside the outgoing area can hold the swap back.
 */
function useAreaTransition(area: Area, resetNonce: number) {
  const [shown, setShown] = useState(area);
  const [scope, animate] = useAnimate<HTMLElement>();
  const reduce = useReducedMotion();
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    const el = scope.current;
    if (area === shown) {
      // Switched back before the swap: cancel any pending swap and restore the view.
      if (el && el.style.opacity !== '' && el.style.opacity !== '1')
        animate(el, { opacity: 1, scale: 1, filter: 'blur(0px)' }, { duration: 0.2 }).then(() => {
          el.style.filter = 'none';
          el.style.transform = 'none';
        });
      return;
    }
    const out = el
      ? animate(el, reduce ? { opacity: 0 } : { opacity: 0, scale: 1.01, filter: 'blur(6px)' }, { duration: 0.24, ease: [0.22, 1, 0.36, 1] })
      : Promise.resolve();
    Promise.resolve(out).finally(() => {
      if (seq.current !== id) return;
      setShown(area);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    const ctl = animate(
      el,
      reduce ? { opacity: [0, 1] } : { opacity: [0, 1], scale: [0.985, 1], filter: ['blur(8px)', 'blur(0px)'] },
      { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
    );
    let t = 0;
    ctl.then(() => {
      // Leave no filter/transform behind (even blur(0px) would break position: fixed inside the area).
      t = window.setTimeout(() => {
        el.style.filter = 'none';
        el.style.transform = 'none';
      }, 60);
    });
    return () => {
      ctl.stop();
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, resetNonce]);

  return { shown, scope };
}

export default function App() {
  useDocumentAttributes();
  useGlobalKeys();
  const area = useApp((s) => s.area);
  const resetNonce = useApp((s) => s.resetNonce);
  const { shown, scope } = useAreaTransition(area, resetNonce);

  // Warm the lazy chunks after first paint so area switches feel instant.
  useEffect(() => {
    const id = window.setTimeout(() => {
      import('./views/Cockpit');
      import('./views/Strategy');
    }, 1500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1] }}>
      <Aurora />
      <Grain />
      <ScrollProgress />
      <TopNav />
      <main ref={scope} id="main" className="relative min-h-screen" style={{ opacity: 0 }}>
        <Suspense key={`${shown}-${resetNonce}`} fallback={<Loading />}>
          {shown === 'story' && <Story />}
          {shown === 'app' && <CustomerApp />}
          {shown === 'cockpit' && <Cockpit />}
          {shown === 'strategy' && <Strategy />}
        </Suspense>
      </main>
      <PrototypeBadge />
      <SourcesDrawer />
      <ShortcutSheet />
      <Toasts />
      <Cursor />
    </MotionConfig>
  );
}
