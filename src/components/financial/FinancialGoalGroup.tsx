import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import type { FinancialGoal, FinancialGoalGroupWithGoals } from '../../types/financialGoals';
import { PHASE_COLORS } from '../../types/financialGoals';
import { calcGroupCompletion, formatPercent } from '../../utils/financialGoalCalculations';
import FinancialGoalCard from './FinancialGoalCard';

interface FinancialGoalGroupProps {
  group: FinancialGoalGroupWithGoals;
  missionGoalId: string | null;
  defaultOpen?: boolean;
  onToggleGoal: (goal: FinancialGoal) => void;
  onEditGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onMoveGoal: (groupId: string, goalId: string, direction: 'up' | 'down') => void;
  onAddGoal: (groupId: string) => void;
}

const FinancialGoalGroupCard = ({
  group,
  missionGoalId,
  defaultOpen = false,
  onToggleGoal,
  onEditGoal,
  onDeleteGoal,
  onMoveGoal,
  onAddGoal,
}: FinancialGoalGroupProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const { percent, completedCount, total } = calcGroupCompletion(group.goals);
  const colors = PHASE_COLORS[group.color ?? 'safe'] ?? PHASE_COLORS.safe;
  const sortedGoals = [...group.goals].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="w-full max-w-full min-w-0 border border-gray-800 bg-void">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4 sm:p-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase tracking-[0.25em] font-bold ${colors.text}`}>
              {group.title}
            </span>
            <span className={`text-[9px] uppercase tracking-wider border ${colors.border} ${colors.bg} ${colors.text} px-1.5 py-0.5 font-bold shrink-0`}>
              {formatPercent(percent)}
            </span>
          </div>
          {group.description && <p className="text-xs text-gray-500 mt-1 break-words">{group.description}</p>}
          <p className="text-[10px] text-gray-600 mt-1">{completedCount} / {total} checkpoints cleared</p>
          <div className="w-full h-1.5 bg-gray-900 mt-2 max-w-full">
            <div
              className={`h-full ${colors.bg.replace('/10', '')} transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-4 sm:p-5 pt-0 min-w-0">
              {sortedGoals.map((goal, index) => (
                <FinancialGoalCard
                  key={goal.id}
                  goal={goal}
                  isMission={goal.id === missionGoalId}
                  isFirst={index === 0}
                  isLast={index === sortedGoals.length - 1}
                  onToggle={onToggleGoal}
                  onEdit={onEditGoal}
                  onDelete={onDeleteGoal}
                  onMoveUp={() => onMoveGoal(group.id, goal.id, 'up')}
                  onMoveDown={() => onMoveGoal(group.id, goal.id, 'down')}
                />
              ))}

              <button
                type="button"
                onClick={() => onAddGoal(group.id)}
                className="mt-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-800 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe hover:border-safe/50 transition-colors"
              >
                <Plus size={12} /> Add checkpoint to this phase
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default FinancialGoalGroupCard;