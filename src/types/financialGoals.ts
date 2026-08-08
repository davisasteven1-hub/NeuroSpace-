export interface FinancialGoalGroup {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  group_id: string;
  title: string;
  target_amount: number;
  target_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoalSettings {
  user_id: string;
  current_balance: number;
  target_balance: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoalGroupWithGoals extends FinancialGoalGroup {
  goals: FinancialGoal[];
}

export interface FinancialGoalFormValues {
  group_id: string;
  title: string;
  target_amount: string;
  target_percentage: string;
  notes: string;
}

/** Balances that trigger the cyber-style achievement modal when crossed. */
export const MAJOR_MILESTONES = [1_000_000, 1_500_000, 2_000_000, 2_300_000];

export const PHASE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  safe: { border: 'border-safe/40', bg: 'bg-safe/10', text: 'text-safe' },
  caution: { border: 'border-caution/40', bg: 'bg-caution/10', text: 'text-caution' },
  blue: { border: 'border-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-300' },
  panic: { border: 'border-panic/40', bg: 'bg-panic/10', text: 'text-panic' },
};