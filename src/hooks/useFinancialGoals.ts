import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { FinancialGoal, FinancialGoalGroupWithGoals, FinancialGoalSettings } from '../types/financialGoals';
import { MAJOR_MILESTONES } from '../types/financialGoals';
import {
  createFinancialGoal,
  deleteFinancialGoal,
  ensureDefaultFinancialGoals,
  fetchFinancialGoalGroups,
  fetchFinancialGoalSettings,
  markAllBeforeComplete as markAllBeforeCompleteService,
  resetAllProgress as resetAllProgressService,
  toggleFinancialGoalCompletion,
  updateFinancialGoal,
  updateFinancialGoalSettings,
} from '../services/financialGoalService';
import { calcFinancialProgress, calcGoalProgress, calcStreak, getNextMission } from '../utils/financialGoalCalculations';

export function useFinancialGoals() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<FinancialGoalGroupWithGoals[]>([]);
  const [settings, setSettings] = useState<FinancialGoalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<FinancialGoal | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ensureDefaultFinancialGoals(user.id);
      const [groupsData, settingsData] = await Promise.all([
        fetchFinancialGoalGroups(user.id),
        fetchFinancialGoalSettings(user.id),
      ]);
      setGroups(groupsData);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load financial goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const allGoals = useMemo(() => groups.flatMap((group) => group.goals), [groups]);
  const nextMission = useMemo(() => getNextMission(groups), [groups]);
  const financialProgress = useMemo(() => calcFinancialProgress(settings), [settings]);
  const goalProgress = useMemo(() => calcGoalProgress(allGoals), [allGoals]);
  const streak = useMemo(() => calcStreak(allGoals), [allGoals]);

  const toggleGoal = useCallback(async (goal: FinancialGoal) => {
    const wasCompleted = goal.is_completed;
    const updated = await toggleFinancialGoalCompletion(goal);
    setGroups((prev) => prev.map((group) => ({
      ...group,
      goals: group.goals.map((item) => (item.id === updated.id ? updated : item)),
    })));
    if (!wasCompleted && updated.is_completed && MAJOR_MILESTONES.includes(updated.target_amount)) {
      setCelebration(updated);
    }
  }, []);

  const addGoal = useCallback(async (input: { group_id: string; title: string; target_amount: number; target_percentage: number; notes?: string }) => {
    if (!user) return;
    const created = await createFinancialGoal(user.id, input);
    setGroups((prev) => prev.map((group) => (group.id === input.group_id ? { ...group, goals: [...group.goals, created] } : group)));
  }, [user]);

  const editGoal = useCallback(async (goalId: string, updates: Parameters<typeof updateFinancialGoal>[1]) => {
    const updated = await updateFinancialGoal(goalId, updates);
    setGroups((prev) => prev.map((group) => ({
      ...group,
      goals: group.goals.some((item) => item.id === updated.id)
        ? group.goals.map((item) => (item.id === updated.id ? updated : item))
        : group.id === updated.group_id
          ? [...group.goals.filter((item) => item.id !== updated.id), updated]
          : group.goals.filter((item) => item.id !== updated.id),
    })));
  }, []);

  const removeGoal = useCallback(async (goalId: string) => {
    await deleteFinancialGoal(goalId);
    setGroups((prev) => prev.map((group) => ({ ...group, goals: group.goals.filter((item) => item.id !== goalId) })));
  }, []);

  const moveGoal = useCallback((groupId: string, goalId: string, direction: 'up' | 'down') => {
    setGroups((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      const goals = [...group.goals];
      const index = goals.findIndex((item) => item.id === goalId);
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= goals.length) return group;
      [goals[index], goals[swapWith]] = [goals[swapWith], goals[index]];
      const reindexed = goals.map((item, i) => ({ ...item, sort_order: i }));
      void Promise.all(reindexed.map((item) => updateFinancialGoal(item.id, { sort_order: item.sort_order })));
      return { ...group, goals: reindexed };
    }));
  }, []);

  const updateSettings = useCallback(async (updates: { current_balance?: number; target_balance?: number }) => {
    if (!user) return;
    const updated = await updateFinancialGoalSettings(user.id, updates);
    setSettings(updated);
  }, [user]);

  const markAllBeforeComplete = useCallback(async (thresholdGoalId: string) => {
    await markAllBeforeCompleteService(allGoals, thresholdGoalId);
    await load();
  }, [allGoals, load]);

  const resetProgress = useCallback(async () => {
    await resetAllProgressService(allGoals);
    await load();
  }, [allGoals, load]);

  const exportProgress = useCallback(() => {
    const payload = { exportedAt: new Date().toISOString(), settings, groups };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neurospace-financial-goals-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [settings, groups]);

  return {
    groups,
    settings,
    loading,
    error,
    allGoals,
    nextMission,
    financialProgress,
    goalProgress,
    streak,
    celebration,
    dismissCelebration: () => setCelebration(null),
    toggleGoal,
    addGoal,
    editGoal,
    removeGoal,
    moveGoal,
    updateSettings,
    markAllBeforeComplete,
    resetProgress,
    exportProgress,
    reload: load,
  };
}