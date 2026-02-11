import { ActivityLevel, ExerciseType } from './types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,
  [ActivityLevel.Light]: 1.375,
  [ActivityLevel.Moderate]: 1.55,
  [ActivityLevel.Active]: 1.725,
  [ActivityLevel.VeryActive]: 1.9,
};

export const CALORIES_PER_KG_FAT = 7700;

// Weight conversion constants
export const LBS_PER_KG = 2.20462;
export const kgToLbs = (kg: number) => kg * LBS_PER_KG;
export const lbsToKg = (lbs: number) => lbs / LBS_PER_KG;

// Calories burned per minute for each exercise type (approximate for 70kg person)
export const EXERCISE_CALORIES_PER_MIN: Record<ExerciseType, number> = {
  walking: 4,      // ~240 cal/hr
  running: 11,     // ~660 cal/hr
  elliptical: 8,   // ~480 cal/hr
  cycling: 7,      // ~420 cal/hr
  swimming: 9,     // ~540 cal/hr
  strength: 5,     // ~300 cal/hr
  aerobics: 8,     // ~480 cal/hr
  plank: 4,        // ~240 cal/hr
};

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  walking: 'Walking',
  running: 'Running',
  elliptical: 'Elliptical',
  cycling: 'Cycling',
  swimming: 'Swimming',
  strength: 'Strength Training',
  aerobics: 'Aerobics',
  plank: 'Plank',
};
