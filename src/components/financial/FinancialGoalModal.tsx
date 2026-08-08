import { useEffect, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { FinancialGoal, FinancialGoalFormValues, FinancialGoalGroupWithGoals } from '../../types/financialGoals';

interface FinancialGoalModalProps {
  isOpen: boolean;
  groups: FinancialGoalGroupWithGoals[];
  editingGoal: FinancialGoal | null;
  defaultGroupId: string | null;
  onClose: () => void;
  onSubmit: (values: FinancialGoalFormValues) => Promise<void>;
}

const inputClass = 'w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 transition-colors min-w-0';
const labelClass = 'block text-[10px] uppercase tracking-widest text-gray-500 font-mono font-bold mb-1.5';

const emptyForm: FinancialGoalFormValues = { group_id: '', title: '', target_amount: '', target_percentage: '', notes: '' };

const FinancialGoalModal = ({ isOpen, groups, editingGoal, defaultGroupId, onClose, onSubmit }: FinancialGoalModalProps) => {
  const [form, setForm] = useState<FinancialGoalFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingGoal) {
      setForm({
        group_id: editingGoal.group_id,
        title: editingGoal.title,
        target_amount: String(editingGoal.target_amount),
        target_percentage: String(editingGoal.target_percentage),
        notes: editingGoal.notes ?? '',
      });
    } else {
      setForm({ ...emptyForm, group_id: defaultGroupId ?? groups[0]?.id ?? '' });
    }
    setFormError(null);
  }, [isOpen, editingGoal, defaultGroupId, groups]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.target_amount);
    const percentage = Number(form.target_percentage);

    if (!form.group_id) return setFormError('Choose a phase for this checkpoint.');
    if (!form.title.trim()) return setFormError('Title is required.');
    if (Number.isNaN(amount) || amount < 0) return setFormError('Target amount must be a valid number.');
    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) return setFormError('Percentage must be between 0 and 100.');

    setSaving(true);
    setFormError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error(err);
      setFormError('Failed to save checkpoint. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-void border-2 border-gray-800 p-6 min-w-0"
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-900">
              <h2 className="text-lg font-bold text-white uppercase">{editingGoal ? 'Edit Checkpoint' : 'Add Checkpoint'}</h2>
              <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center border border-gray-800 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Phase</label>
                <select
                  value={form.group_id}
                  onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value }))}
                  className={inputClass}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-void">{group.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. ₦575,000"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Target Amount (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.target_amount}
                    onChange={(e) => setForm((p) => ({ ...p, target_amount: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.target_percentage}
                    onChange={(e) => setForm((p) => ({ ...p, target_percentage: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  rows={3}
                />
              </div>

              {formError && <p className="text-panic text-[10px] uppercase">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2 border border-gray-700 text-gray-300 text-[10px] uppercase hover:border-safe hover:text-safe disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-800 text-gray-500 text-[10px] uppercase">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FinancialGoalModal;