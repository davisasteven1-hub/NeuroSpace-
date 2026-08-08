import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Flame, Plus, RotateCcw, Target, Trophy, X } from 'lucide-react';
import { useFinancialGoals } from '../hooks/useFinancialGoals';
import FinancialGoalGroup from '../components/financial/FinancialGoalGroup';
import FinancialGoalSummary from '../components/financial/FinancialGoalSummary';
import FinancialGoalModal from '../components/financial/FinancialGoalModal';
import type { FinancialGoal, FinancialGoalFormValues } from '../types/financialGoals';
import { formatNaira } from '../utils/financialGoalCalculations';

const FinancialGoals = () => {
  const {
    groups,
    settings,
    loading,
    error,
    nextMission,
    financialProgress,
    allGoals,
    streak,
    celebration,
    dismissCelebration,
    toggleGoal,
    addGoal,
    editGoal,
    removeGoal,
    moveGoal,
    updateSettings,
    markAllBeforeComplete,
    resetProgress,
    exportProgress,
  } = useFinancialGoals();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [defaultGroupId, setDefaultGroupId] = useState<string | null>(null);

  const openAddModal = (groupId?: string) => {
    setEditingGoal(null);
    setDefaultGroupId(groupId ?? groups[0]?.id ?? null);
    setModalOpen(true);
  };

  const openEditModal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setDefaultGroupId(goal.group_id);
    setModalOpen(true);
  };

  const handleSubmit = async (values: FinancialGoalFormValues) => {
    const payload = {
      group_id: values.group_id,
      title: values.title.trim(),
      target_amount: Number(values.target_amount),
      target_percentage: Number(values.target_percentage),
      notes: values.notes.trim() || undefined,
    };

    if (editingGoal) {
      await editGoal(editingGoal.id, payload);
    } else {
      await addGoal(payload);
    }
  };

  const handleMarkAllBeforeMission = async () => {
    if (!nextMission) return;
    if (!window.confirm(`Mark every checkpoint up to ${formatNaira(nextMission.target_amount)} as complete?`)) return;
    await markAllBeforeComplete(nextMission.id);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all progress? This will un-mark every completed checkpoint.')) return;
    await resetProgress();
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500 text-[10px] uppercase tracking-[0.3em] font-mono">
        Loading financial goals...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 font-mono pb-8 max-w-full overflow-x-hidden min-w-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Stanbic Money Market Fund</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <Target className="text-safe shrink-0" size={28} /> Financial Goals
          </h1>
          <p className="text-gray-500 text-xs mt-2">Your ₦2.3M roadmap, tracked checkpoint by checkpoint.</p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-300 text-[10px] uppercase tracking-wider hover:border-safe hover:text-safe active:bg-safe/10 transition-colors self-start shrink-0"
        >
          <Plus size={12} /> Add Goal
        </button>
      </motion.div>

      {error && (
        <div className="border border-panic/40 bg-panic/10 px-4 py-2 text-panic text-[10px] uppercase tracking-widest">
          {error}
        </div>
      )}

      <FinancialGoalSummary
        settings={settings}
        allGoals={allGoals}
        financialProgress={financialProgress}
        onUpdateSettings={updateSettings}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        {nextMission && (
          <div className="flex-1 border border-caution/40 bg-caution/10 p-4 min-w-0">
            <p className="text-[9px] uppercase tracking-widest text-caution font-bold mb-1">Current Mission</p>
            <p className="text-white text-sm break-words">
              Focus only on <span className="font-bold text-caution">{formatNaira(nextMission.target_amount)}</span> first.
              That's the next meaningful checkpoint on your journey toward {formatNaira(settings?.target_balance ?? 2300000)}.
            </p>
          </div>
        )}
        {streak > 0 && (
          <div className="flex items-center gap-2 border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-orange-300 text-xs font-bold shrink-0">
            <Flame size={14} /> {streak}-week savings streak
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-800 text-gray-400 text-[10px] uppercase tracking-wider hover:border-safe hover:text-safe transition-colors"
        >
          <Plus size={12} /> Add Goal
        </button>
        <button
          type="button"
          onClick={handleMarkAllBeforeMission}
          disabled={!nextMission}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-800 text-gray-400 text-[10px] uppercase tracking-wider hover:border-safe hover:text-safe transition-colors disabled:opacity-40"
        >
          <Trophy size={12} /> Mark All Before This Complete
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-800 text-gray-400 text-[10px] uppercase tracking-wider hover:border-panic hover:text-panic transition-colors"
        >
          <RotateCcw size={12} /> Reset Progress
        </button>
        <button
          type="button"
          onClick={exportProgress}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-800 text-gray-400 text-[10px] uppercase tracking-wider hover:border-gray-500 hover:text-white transition-colors"
        >
          <Download size={12} /> Export Progress
        </button>
      </div>

      <div className="flex flex-col gap-3 min-w-0">
        {groups.map((group, index) => (
          <FinancialGoalGroup
            key={group.id}
            group={group}
            missionGoalId={nextMission?.id ?? null}
            defaultOpen={index === 0}
            onToggleGoal={toggleGoal}
            onEditGoal={openEditModal}
            onDeleteGoal={removeGoal}
            onMoveGoal={moveGoal}
            onAddGoal={openAddModal}
          />
        ))}
      </div>

      <FinancialGoalModal
        isOpen={modalOpen}
        groups={groups}
        editingGoal={editingGoal}
        defaultGroupId={defaultGroupId}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={dismissCelebration}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-void border-2 border-safe p-8 text-center shadow-[0_0_40px_rgba(0,255,157,0.25)]"
            >
              <button type="button" onClick={dismissCelebration} className="absolute top-3 right-3 text-gray-500 hover:text-white">
                <X size={16} />
              </button>
              <Trophy size={40} className="text-safe mx-auto mb-4 animate-pulse-fast" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-safe font-bold mb-2">Major Milestone</p>
              <h2 className="text-2xl font-bold text-white mb-2">{formatNaira(celebration.target_amount)}</h2>
              <p className="text-gray-400 text-xs">Checkpoint cleared. The fund keeps compounding.</p>
              <button
                type="button"
                onClick={dismissCelebration}
                className="mt-6 w-full py-2.5 border border-safe/50 text-safe text-[10px] uppercase font-bold hover:bg-safe/10 transition-colors"
              >
                Keep Going
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialGoals;