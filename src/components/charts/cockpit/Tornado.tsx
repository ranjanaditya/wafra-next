import { motion } from 'framer-motion';
import { SENSITIVITIES, SENS_BASE } from '../../../data/deck';
import type { SensSide } from '../../../store';
import { useFmt } from '../../ui/useFmt';
import { useT, useTpl } from '../../../i18n';
import { cn } from '../../../lib/cn';

interface Props {
  focus: number | null;
  offLever: number | null;
  offSide: SensSide;
  presetActive: boolean;
  onFocus: (i: number) => void;
  onPick: (i: number, side: SensSide) => void;
}

/** Visual half-range of the axis in SAR m; covers the largest change (+38.8). Not a figure. */
const AXIS = 40;

/**
 * Tornado of eight levers sorted by swing (table order). Bars show the change in
 * FY31 net profit vs base (SAR m) exactly as reported. Click a lever to focus it,
 * or a bar to set that side directly.
 */
export function Tornado({ focus, offLever, offSide, presetActive, onFocus, onPick }: Props) {
  const t = useT();
  const tp = useTpl();
  const f = useFmt();
  const s = t.cockpit.sens;
  return (
    <div className="space-y-1">
      {SENSITIVITIES.map((lv, i) => {
        const a = lv.adverse.change;
        const fv = lv.favourable.change;
        const aw = (Math.abs(a) / AXIS) * 50;
        const fw = (Math.abs(fv) / AXIS) * 50;
        const isOff = offLever === i;
        const dim = presetActive || (offLever !== null && !isOff);
        const isFocus = focus === i;
        return (
          <motion.div
            key={lv.id}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className={cn(
              'grid grid-cols-[minmax(0,12rem)_1fr] items-center gap-3 rounded-xl px-2 py-1 transition-colors',
              isFocus ? 'bg-line/[0.07]' : 'hover:bg-line/[0.04]',
            )}
          >
            <button
              type="button"
              onClick={() => onFocus(i)}
              aria-pressed={isFocus}
              aria-label={tp(s.rowAria, { lever: s.levers[lv.id as keyof typeof s.levers], a: f.signed(a, 1), f: f.signed(fv, 1) })}
              className={cn('text-start text-[0.8125rem] leading-tight transition-colors', isFocus || isOff ? 'font-semibold text-ink' : 'text-muted hover:text-ink')}
              data-cursor="explain"
            >
              <span className="num me-1.5 text-[0.6875rem] text-muted">{i + 1}</span>
              {s.levers[lv.id as keyof typeof s.levers]}
            </button>
            <div dir="ltr" className="relative h-8">
              <div className="absolute inset-y-0 left-1/2 w-px bg-line/25" />
              {/* Adverse bar (left of base) */}
              <motion.button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => onPick(i, 'adverse')}
                className={cn(
                  'absolute top-1.5 h-5 origin-right rounded-s-md bg-gradient-to-l from-stop to-stop/60 transition-opacity',
                  isOff && offSide === 'adverse' && 'ring-2 ring-stop ring-offset-1 ring-offset-bg',
                  dim && !(isOff && offSide === 'adverse') ? 'opacity-30' : 'opacity-90 hover:opacity-100',
                )}
                style={{ right: '50%', width: `${aw}%` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
              <span
                className={cn('absolute top-1/2 -translate-y-1/2 pe-1.5 text-[0.6875rem] font-semibold text-stop', dim && !(isOff && offSide === 'adverse') && 'opacity-50')}
                style={{ right: `${50 + aw}%` }}
              >
                {f.signed(a, 1)}
              </span>
              {/* Favourable bar (right of base) */}
              <motion.button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => onPick(i, 'favourable')}
                className={cn(
                  'absolute top-1.5 h-5 origin-left rounded-e-md bg-gradient-to-r from-pass to-pass/60 transition-opacity',
                  isOff && offSide === 'favourable' && 'ring-2 ring-pass ring-offset-1 ring-offset-bg',
                  dim && !(isOff && offSide === 'favourable') ? 'opacity-30' : 'opacity-90 hover:opacity-100',
                )}
                style={{ left: '50%', width: `${fw}%` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
              <span
                className={cn('absolute top-1/2 -translate-y-1/2 ps-1.5 text-[0.6875rem] font-semibold text-pass', dim && !(isOff && offSide === 'favourable') && 'opacity-50')}
                style={{ left: `${50 + fw}%` }}
              >
                {f.signed(fv, 1)}
              </span>
            </div>
          </motion.div>
        );
      })}
      <div className="grid grid-cols-[minmax(0,12rem)_1fr] gap-3 px-2 pt-1">
        <span />
        <div dir="ltr" className="relative flex justify-between text-[0.625rem] text-muted">
          <span>{f.signed(-AXIS, 0)}</span>
          <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-ink/80">
            {t.cockpit.sens.baseCase} · {f.sarM(SENS_BASE.netProfit31)}
          </span>
          <span>{f.signed(AXIS, 0)}</span>
        </div>
      </div>
      <p className="px-2 pt-1 text-center text-[0.6875rem] text-muted">{s.axis}</p>
    </div>
  );
}
