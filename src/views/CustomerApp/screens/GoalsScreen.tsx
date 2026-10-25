import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useJourney } from '../../../store';
import { useT, useTpl } from '../../../i18n';
import { PButton } from '../ui';
import { AutopilotEditor, GoalList } from './Salary';

export function GoalsScreen() {
  const t = useT();
  const tpl = useTpl();
  const j = useJourney()!;
  const [edit, setEdit] = useState(false);
  return (
    <div className="space-y-3">
      <div className="pt-1 text-[18px] font-semibold">{t.app.goalsScreen.title}</div>
      <div className="num text-[12.5px] text-muted">{tpl(t.app.goalsScreen.pot, { amount: { sar: j.split.goals } })}</div>
      <GoalList />
      <PButton full variant={edit ? 'secondary' : 'outline'} icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setEdit((v) => !v)}>
        {t.app.goalsScreen.adjust}
      </PButton>
      <AnimatePresence>
        {edit && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <AutopilotEditor />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
