import type { FinancialGoal, FinancialGoalGroupWithGoals, FinancialGoalSettings } from '../types/financialGoals';

export function formatNaira(amount: number): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** current_balance / target_balance * 100, clamped to [0, 100]. */
export function calcFinancialProgress(settings: FinancialGoalSettings | null): number {
  if (!settings || settings.target_balance <= 0) return 0;
  return Math.min(100, Math.max(0, (settings.current_balance / settings.target_balance) * 100));
}

/** completedGoals / totalGoals * 100. */
export function calcGoalProgress(goals: FinancialGoal[]): number {
  if (goals.length === 0) return 0;
  const completed = goals.filter((goal) => goal.is_completed).length;
  return (completed / goals.length) * 100;
}

export function calcGroupCompletion(goals: FinancialGoal[]): { percent: number; completedCount: number; total: number } {
  const total = goals.length;
  const completedCount = goals.filter((goal) => goal.is_completed).length;
  return { percent: total === 0 ? 0 : (completedCount / total) * 100, completedCount, total };
}

/** Lowest-amount, not-yet-completed goal across every phase — the "Current Mission". */
export function getNextMission(groups: FinancialGoalGroupWithGoals[]): FinancialGoal | null {
  const sorted = groups
    .flatMap((group) => group.goals)
    .sort((a, b) => a.target_amount - b.target_amount);
  return sorted.find((goal) => !goal.is_completed) ?? null;
}

/** Consecutive weeks (Mon–Sun, ending this week) with at least one completed milestone. */
export function calcStreak(goals: FinancialGoal[]): number {
  const completedDates = goals
    .filter((goal) => goal.is_completed && goal.completed_at)
    .map((goal) => new Date(goal.completed_at as string));

  if (completedDates.length === 0) return 0;

  const startOfWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayIndex = (d.getUTCDay() + 6) % 7; // Monday = 0
    d.setUTCDate(d.getUTCDate() - dayIndex);
    return d.getTime();
  };

  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const weeks = Array.from(new Set(completedDates.map(startOfWeek))).sort((a, b) => b - a);
  const currentWeek = startOfWeek(new Date());

  // If the most recent completed week isn't this week or last week, the streak is broken.
  if (currentWeek - weeks[0] > oneWeekMs) return 0;

  let streak = 0;
  let expected = weeks[0];
  for (const week of weeks) {
    if (week === expected) {
      streak += 1;
      expected -= oneWeekMs;
    } else {
      break;
    }
  }
  return streak;
}