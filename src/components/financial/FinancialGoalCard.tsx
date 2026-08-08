import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import type { FinancialGoal } from '../../types/financialGoals';
import { formatNaira, formatPercent } from '../../utils/financialGoalCalculations';

interface FinancialGoalCardProps {
  goal: FinancialGoal;
  isMission: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (goal: FinancialGoal) => void;
  onEdit: (goal: FinancialGoal) => void;
  onDelete: (goalId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const FinancialGoalCard = ({
  goal,
  isMission,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FinancialGoalCardProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const stateClasses = goal.is_completed
    ? 'border-safe/50 bg-safe/10'
    : isMission
      ? 'border-caution/50 bg-caution/10'
      : 'border-gray-800 bg-surface';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-full min-w-0 border ${stateClasses} p-4 sm:p-5 transition-colors`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isMission && !goal.is_completed && (
              <span className="text-[9px] uppercase tracking-widest text-caution border border-caution/40 px-1.5 py-0.5 font-bold shrink-0">
                Current Mission
              </span>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-white break-words min-w-0">
              {formatNaira(goal.target_amount)}
            </h3>
          </div>

          {goal.is_completed ? (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-safe text-xs font-bold uppercase tracking-widest">
                <CheckCircle2 size={14} /> Achieved
              </span>
              {goal.completed_at && (
                <span className="text-[10px] text-gray-500">
                  Completed on {new Date(goal.completed_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400">{formatPercent(goal.target_percentage)} of overall goal</p>
          )}

          {goal.notes && <p className="mt-2 text-xs text-gray-500 break-words">{goal.notes}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex flex-col border border-gray-800">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="w-7 h-6 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 disabled:hover:text-gray-500 border-b border-gray-800"
              aria-label="Move up"
            >
              <ArrowUp size={11} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="w-7 h-6 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 disabled:hover:text-gray-500"
              aria-label="Move down"
            >
              <ArrowDown size={11} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="w-8 h-8 flex items-center justify-center border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 transition-colors"
            aria-label="Edit goal"
          >
            <Pencil size={13} />
          </button>

          {confirmingDelete ? (
            <div className="flex items-center gap-1 border border-panic/50 bg-panic/10 px-2 py-1">
              <span className="text-[9px] uppercase text-panic font-bold">Delete?</span>
              <button
                type="button"
                onClick={() => onDelete(goal.id)}
                className="text-[9px] uppercase font-bold text-panic hover:underline"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-[9px] uppercase font-bold text-gray-400 hover:underline"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="w-8 h-8 flex items-center justify-center border border-gray-800 text-gray-500 hover:text-panic hover:border-panic/50 transition-colors"
              aria-label="Delete goal"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggle(goal)}
            className={`px-3 py-2 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
              goal.is_completed
                ? 'border-gray-700 text-gray-400 hover:border-gray-500'
                : 'border-safe/50 text-safe hover:bg-safe/10'
            }`}
          >
            {goal.is_completed ? 'Undo' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FinancialGoalCard;