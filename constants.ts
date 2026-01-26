import { ActivityLevel } from './types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,
  [ActivityLevel.Light]: 1.375,
  [ActivityLevel.Moderate]: 1.55,
  [ActivityLevel.Active]: 1.725,
  [ActivityLevel.VeryActive]: 1.9,
};

export const CALORIES_PER_KG_FAT = 7700;

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  [ActivityLevel.Sedentary]: 'Sedentary (Little to no exercise)',
  [ActivityLevel.Light]: 'Lightly Active (1-3 days/week)',
  [ActivityLevel.Moderate]: 'Moderately Active (3-5 days/week)',
  [ActivityLevel.Active]: 'Active (6-7 days/week)',
  [ActivityLevel.VeryActive]: 'Very Active (Physical job or 2x/day)',
};
