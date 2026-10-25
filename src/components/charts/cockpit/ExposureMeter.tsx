import { motion } from 'framer-motion';
import { GATES } from '../../../data/deck';
import { useFmt } from '../../ui/useFmt';
import { useT } from '../../../i18n';
import { cn } from '../../../lib/cn';

/** Exposure meter: fills from 0 to the stop point (or the SAR 136m peak if every gate passes). */
export function ExposureMeter({ cap, peak, stopped }: { cap: number; peak: number; stopped: boolean }) {
  const f = useFmt();
  const t = useT();
  const pct = (cap / peak) * 100;
  return (
    <div dir="ltr" className="w-full">
      <div className="relative h-4 overflow-hidden rounded-full bg-line/10">
        <motion.div
          className={cn('absolute inset-0 origin-left rounded-full', stopped ? 'bg-gradient-to-r from-stop/60 to-stop' : 'bg-gradient-to-r from-brand via-brand to-gold')}
          initial={false}
          animate={{ scaleX: pct / 100 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="relative mt-1 h-10">
        {GATES.map((g) => {
          const x = (g.exposure / peak) * 100;
          const isStop = stopped && g.exposure === cap;
          return (
            <div
              key={g.id}
              className={cn('absolute top-0 flex flex-col', x > 92 ? '-translate-x-full items-end' : '-translate-x-1/2 items-center')}
              style={{ left: `${x}%` }}
            >
              <span className={cn('h-2 w-px', isStop ? 'bg-stop' : 'bg-line/30')} />
              <span className={cn('whitespace-nowrap text-[0.625rem] font-semibold', isStop ? 'text-stop' : 'text-muted')}>{g.id}</span>
              <span className={cn('num whitespace-nowrap text-[0.6875rem]', isStop ? 'font-semibold text-stop' : 'text-ink/80')}>{f.sarM(g.exposure)}</span>
            </div>
          );
        })}
      </div>
      {stopped && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-stop/40 bg-stop/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-stop"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-stop" />
          {t.cockpit.gates.stopPoint}: {f.sarM(cap)}
        </motion.div>
      )}
    </div>
  );
}
