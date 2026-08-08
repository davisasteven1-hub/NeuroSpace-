import { useState } from 'react';
import { Pencil, Wallet } from 'lucide-react';
import type { FinancialGoal, FinancialGoalSettings } from '../../types/financialGoals';
import { calcGroupCompletion, formatNaira, formatPercent } from '../../utils/financialGoalCalculations';

interface FinancialGoalSummaryProps {
  settings: FinancialGoalSettings | null;
  allGoals: FinancialGoal[];
  financialProgress: number;
  onUpdateSettings: (updates: { current_balance?: number; target_balance?: number }) => Promise<void>;
}

const StatCard = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="border border-gray-800 bg-surface p-4 min-w-0 max-w-full">
    <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">{label}</p>
    <p className={`text-lg sm:text-xl font-bold break-words ${accent ?? 'text-white'}`}>{value}</p>
  </div>
);

const FinancialGoalSummary = ({ settings, allGoals, financialProgress, onUpdateSettings }: FinancialGoalSummaryProps) => {
  const [editing, setEditing] = useState(false);
  const [currentBalanceInput, setCurrentBalanceInput] = useState(String(settings?.current_balance ?? 0));
  const [targetBalanceInput, setTargetBalanceInput] = useState(String(settings?.target_balance ?? 0));
  const [saving, setSaving] = useState(false);

  const { completedCount, total } = calcGroupCompletion(allGoals);
  const remaining = Math.max(0, (settings?.target_balance ?? 0) - (settings?.current_balance ?? 0));

  const openEditor = () => {
    setCurrentBalanceInput(String(settings?.current_balance ?? 0));
    setTargetBalanceInput(String(settings?.target_balance ?? 0));
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onUpdateSettings({
        current_balance: Number(currentBalanceInput) || 0,
        target_balance: Number(targetBalanceInput) || 0,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold flex items-center gap-1.5">
          <Wallet size={12} /> Fund Overview
        </span>
        <button
          type="button"
          onClick={openEditor}
          className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors"
        >
          <Pencil size={11} /> Update Balance
        </button>
      </div>

      {editing && (
        <div className="mb-4 border border-gray-800 bg-void p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end min-w-0">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Current Balance (₦)</label>
            <input
              type="number"
              step="0.01"
              value={currentBalanceInput}
              onChange={(e) => setCurrentBalanceInput(e.target.value)}
              className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600 min-w-0"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Target Balance (₦)</label>
            <input
              type="number"
              step="0.01"
              value={targetBalanceInput}
              onChange={(e) => setTargetBalanceInput(e.target.value)}
              className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600 min-w-0"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={save} disabled={saving} className="px-4 py-2 border border-safe/50 text-safe text-[10px] uppercase font-bold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-800 text-gray-500 text-[10px] uppercase">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <StatCard label="Current Balance" value={formatNaira(settings?.current_balance ?? 0)} accent="text-safe" />
        <StatCard label="Target Balance" value={formatNaira(settings?.target_balance ?? 0)} />
        <StatCard label="Remaining" value={formatNaira(remaining)} accent="text-caution" />
        <StatCard label="Overall Progress" value={formatPercent(financialProgress)} accent="text-safe" />
        <StatCard label="Completed Goals" value={`${completedCount} / ${total}`} />
        <StatCard label="Remaining Goals" value={String(Math.max(0, total - completedCount))} />
      </div>

      <div className="w-full h-2.5 bg-gray-900 max-w-full">
        <div
          className="h-full bg-safe shadow-[0_0_10px_rgba(0,255,157,0.5)] transition-all duration-700"
          style={{ width: `${financialProgress}%` }}
        />
      </div>
    </div>
  );
};

export default FinancialGoalSummary;