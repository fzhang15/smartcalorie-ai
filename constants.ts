import { ActivityLevel, ExerciseType, WaterUnit } from './types';

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

// Water tracking constants
export const ML_PER_OZ = 29.5735;
export const mlToOz = (ml: number) => ml / ML_PER_OZ;
export const ozToMl = (oz: number) => oz * ML_PER_OZ;
export const DEFAULT_WATER_GOAL_ML = 2500;

export const WATER_QUICK_ADD = [
  { label: 'Cup', ml: 250, emoji: '☕' },
  { label: 'Bottle', ml: 500, emoji: '🥤' },
  { label: 'Large', ml: 750, emoji: '🫗' },
];

export const formatWaterAmount = (ml: number, unit: WaterUnit): string => {
  if (unit === 'oz') {
    return `${Math.round(mlToOz(ml))} oz`;
  }
  return `${Math.round(ml)} ml`;
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
