import { supabase } from '../lib/supabase';
import type {
  FinancialGoal,
  FinancialGoalGroup,
  FinancialGoalGroupWithGoals,
  FinancialGoalSettings,
} from '../types/financialGoals';

// ------------------------------------------------------------
// Default ₦2.3M roadmap, seeded for every new user (see ensureDefaultFinancialGoals)
// ------------------------------------------------------------

const DEFAULT_SETTINGS = {
  current_balance: 536235.79,
  target_balance: 2300000,
};

type DefaultGoalSeed = { title: string; target_amount: number; target_percentage: number };
type DefaultGroupSeed = { title: string; description: string; color: string; goals: DefaultGoalSeed[] };

const DEFAULT_GROUPS: DefaultGroupSeed[] = [
  {
    title: 'Phase 1 — Quarter Complete',
    description: 'Building momentum toward the first major checkpoint.',
    color: 'safe',
    goals: [
      { title: '₦575,000', target_amount: 575000, target_percentage: 25.0 },
      { title: '₦600,000', target_amount: 600000, target_percentage: 26.1 },
      { title: '₦650,000', target_amount: 650000, target_percentage: 28.3 },
      { title: '₦700,000', target_amount: 700000, target_percentage: 30.4 },
      { title: '₦750,000', target_amount: 750000, target_percentage: 32.6 },
      { title: '₦800,000', target_amount: 800000, target_percentage: 34.8 },
      { title: '₦850,000', target_amount: 850000, target_percentage: 37.0 },
      { title: '₦900,000', target_amount: 900000, target_percentage: 39.1 },
      { title: '₦950,000', target_amount: 950000, target_percentage: 41.3 },
      { title: '₦1,000,000', target_amount: 1000000, target_percentage: 43.5 },
    ],
  },
  {
    title: 'Phase 2 — The Millionaire Build',
    description: 'Serious traction — six figures becomes seven.',
    color: 'caution',
    goals: [
      { title: '₦1,100,000', target_amount: 1100000, target_percentage: 47.8 },
      { title: '₦1,200,000', target_amount: 1200000, target_percentage: 52.2 },
      { title: '₦1,300,000', target_amount: 1300000, target_percentage: 56.5 },
      { title: '₦1,400,000', target_amount: 1400000, target_percentage: 60.9 },
      { title: '₦1,500,000', target_amount: 1500000, target_percentage: 65.2 },
    ],
  },
  {
    title: 'Phase 3 — Serious Investor Zone',
    description: 'Past the halfway mark and compounding.',
    color: 'blue',
    goals: [
      { title: '₦1,600,000', target_amount: 1600000, target_percentage: 69.6 },
      { title: '₦1,700,000', target_amount: 1700000, target_percentage: 73.9 },
      { title: '₦1,800,000', target_amount: 1800000, target_percentage: 78.3 },
      { title: '₦1,900,000', target_amount: 1900000, target_percentage: 82.6 },
      { title: '₦2,000,000', target_amount: 2000000, target_percentage: 87.0 },
    ],
  },
  {
    title: 'Phase 4 — Countdown to ₦2.3 Million',
    description: 'The final stretch toward the freedom target.',
    color: 'panic',
    goals: [
      { title: '₦2,050,000', target_amount: 2050000, target_percentage: 89.1 },
      { title: '₦2,100,000', target_amount: 2100000, target_percentage: 91.3 },
      { title: '₦2,150,000', target_amount: 2150000, target_percentage: 93.5 },
      { title: '₦2,200,000', target_amount: 2200000, target_percentage: 95.7 },
      { title: '₦2,250,000', target_amount: 2250000, target_percentage: 97.8 },
      { title: '₦2,300,000', target_amount: 2300000, target_percentage: 100 },
    ],
  },
];

// Supabase's postgrest returns `numeric` columns as strings — normalize on the way in.
function normalizeGoal(row: FinancialGoal): FinancialGoal {
  return { ...row, target_amount: Number(row.target_amount), target_percentage: Number(row.target_percentage) };
}
function normalizeSettings(row: FinancialGoalSettings): FinancialGoalSettings {
  return { ...row, current_balance: Number(row.current_balance), target_balance: Number(row.target_balance) };
}

/** Idempotent: only seeds the ₦2.3M roadmap the first time a user has zero goal groups. */
export async function ensureDefaultFinancialGoals(userId: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from('financial_goal_groups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw countError;
  if (count && count > 0) return;

  for (let groupIndex = 0; groupIndex < DEFAULT_GROUPS.length; groupIndex += 1) {
    const group = DEFAULT_GROUPS[groupIndex];

    const { data: insertedGroup, error: groupError } = await supabase
      .from('financial_goal_groups')
      .insert({
        user_id: userId,
        title: group.title,
        description: group.description,
        color: group.color,
        sort_order: groupIndex,
      })
      .select()
      .single();

    if (groupError || !insertedGroup) throw groupError ?? new Error('Failed to create default goal group');

    const goalRows = group.goals.map((goal, goalIndex) => ({
      user_id: userId,
      group_id: (insertedGroup as FinancialGoalGroup).id,
      title: goal.title,
      target_amount: goal.target_amount,
      target_percentage: goal.target_percentage,
      sort_order: goalIndex,
    }));

    const { error: goalsError } = await supabase.from('financial_goals').insert(goalRows);
    if (goalsError) throw goalsError;
  }

  const { error: settingsError } = await supabase
    .from('financial_goal_settings')
    .upsert({ user_id: userId, ...DEFAULT_SETTINGS }, { onConflict: 'user_id' });

  if (settingsError) throw settingsError;
}

export async function fetchFinancialGoalGroups(userId: string): Promise<FinancialGoalGroupWithGoals[]> {
  const { data: groups, error: groupsError } = await supabase
    .from('financial_goal_groups')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (groupsError) throw groupsError;

  const { data: goals, error: goalsError } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (goalsError) throw goalsError;

  const normalizedGoals = (goals ?? []).map((row) => normalizeGoal(row as FinancialGoal));

  return (groups ?? []).map((group) => ({
    ...(group as FinancialGoalGroup),
    goals: normalizedGoals.filter((goal) => goal.group_id === group.id),
  }));
}

export async function fetchFinancialGoalSettings(userId: string): Promise<FinancialGoalSettings | null> {
  const { data, error } = await supabase
    .from('financial_goal_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeSettings(data as FinancialGoalSettings) : null;
}

export async function updateFinancialGoalSettings(
  userId: string,
  updates: Partial<Pick<FinancialGoalSettings, 'current_balance' | 'target_balance'>>,
): Promise<FinancialGoalSettings> {
  const { data, error } = await supabase
    .from('financial_goal_settings')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Failed to update settings');
  return normalizeSettings(data as FinancialGoalSettings);
}

export async function createFinancialGoal(
  userId: string,
  input: { group_id: string; title: string; target_amount: number; target_percentage: number; notes?: string | null; sort_order?: number },
): Promise<FinancialGoal> {
  const { data, error } = await supabase
    .from('financial_goals')
    .insert({ user_id: userId, ...input })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Failed to create goal');
  return normalizeGoal(data as FinancialGoal);
}

export async function updateFinancialGoal(
  goalId: string,
  updates: Partial<Pick<FinancialGoal, 'title' | 'target_amount' | 'target_percentage' | 'notes' | 'group_id' | 'sort_order' | 'is_completed' | 'completed_at'>>,
): Promise<FinancialGoal> {
  const { data, error } = await supabase
    .from('financial_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Failed to update goal');
  return normalizeGoal(data as FinancialGoal);
}

export async function deleteFinancialGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('financial_goals').delete().eq('id', goalId);
  if (error) throw error;
}

export async function toggleFinancialGoalCompletion(goal: FinancialGoal): Promise<FinancialGoal> {
  return updateFinancialGoal(goal.id, {
    is_completed: !goal.is_completed,
    completed_at: !goal.is_completed ? new Date().toISOString() : null,
  });
}

export async function markAllBeforeComplete(goals: FinancialGoal[], thresholdGoalId: string): Promise<void> {
  const threshold = goals.find((goal) => goal.id === thresholdGoalId);
  if (!threshold) return;
  const toComplete = goals.filter((goal) => goal.target_amount <= threshold.target_amount && !goal.is_completed);
  await Promise.all(
    toComplete.map((goal) => updateFinancialGoal(goal.id, { is_completed: true, completed_at: new Date().toISOString() })),
  );
}

export async function resetAllProgress(goals: FinancialGoal[]): Promise<void> {
  await Promise.all(
    goals
      .filter((goal) => goal.is_completed)
      .map((goal) => updateFinancialGoal(goal.id, { is_completed: false, completed_at: null })),
  );
}