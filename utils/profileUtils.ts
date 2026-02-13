/**
 * Profile-related pure utility functions.
 * BMR calculation, profile migration, and avatar colors.
 */

import { UserProfile, Gender, ActivityLevel } from '../types';
import { ACTIVITY_MULTIPLIERS } from '../constants';

// Avatar color palette for user profiles
const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
  'bg-pink-500', 'bg-rose-500'
];

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

/**
 * Calculate BMR using Mifflin-St Jeor equation.
 * Returns raw (unrounded) BMR value.
 */
export const calculateBmr = (weight: number, height: number, age: number, gender: Gender): number => {
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  return bmr;
};

/**
 * Migrate a loaded profile to ensure all fields exist with proper defaults.
 * This handles backward compatibility when new fields are added to UserProfile.
 * Returns { profile, needsSave } — needsSave indicates whether localStorage should be updated.
 */
export const migrateProfile = (parsedProfile: UserProfile): { profile: UserProfile; needsSave: boolean } => {
  let needsSave = false;

  // Migration: Add lastWeightUpdate if missing
  if (!parsedProfile.lastWeightUpdate) {
    parsedProfile.lastWeightUpdate = Date.now();
    needsSave = true;
  }

  // Migration: Add ageLastUpdatedYear if missing
  if (!parsedProfile.ageLastUpdatedYear) {
    parsedProfile.ageLastUpdatedYear = new Date().getFullYear();
    needsSave = true;
  }

  // Migration: Add weightUnit if missing
  if (!parsedProfile.weightUnit) {
    parsedProfile.weightUnit = 'kg';
    needsSave = true;
  }

  // Migration: Add dailyExerciseGoal if missing
  if (!parsedProfile.dailyExerciseGoal) {
    parsedProfile.dailyExerciseGoal = 300;
    needsSave = true;
  }

  // Migration: Add calibrationFactor if missing
  if (parsedProfile.calibrationFactor === undefined) {
    parsedProfile.calibrationFactor = 1.0;
    needsSave = true;
  }

  // Migration: Add calibrationBaseWeight if missing
  if (parsedProfile.calibrationBaseWeight === undefined) {
    parsedProfile.calibrationBaseWeight = parsedProfile.weight;
    needsSave = true;
  }

  // Migration: Add water tracking fields if missing
  if (parsedProfile.waterTrackingEnabled === undefined) {
    parsedProfile.waterTrackingEnabled = false;
    needsSave = true;
  }
  if (!parsedProfile.dailyWaterGoalMl) {
    parsedProfile.dailyWaterGoalMl = 2500;
    needsSave = true;
  }
  if (!parsedProfile.waterUnit) {
    parsedProfile.waterUnit = 'ml';
    needsSave = true;
  }

  // Migration: Add createdAt if missing (use lastWeightUpdate as fallback)
  if (!parsedProfile.createdAt) {
    parsedProfile.createdAt = parsedProfile.lastWeightUpdate || Date.now();
    needsSave = true;
  }

  // Auto-increment age on January 1st each year
  const currentYear = new Date().getFullYear();
  if (parsedProfile.ageLastUpdatedYear < currentYear) {
    const yearsToAdd = currentYear - parsedProfile.ageLastUpdatedYear;
    parsedProfile.age += yearsToAdd;
    parsedProfile.ageLastUpdatedYear = currentYear;
    // Recalculate BMR with new age
    const newBmr = calculateBmr(parsedProfile.weight, parsedProfile.height, parsedProfile.age, parsedProfile.gender);
    parsedProfile.bmr = Math.round(newBmr);
    parsedProfile.tdee = Math.round(newBmr * ACTIVITY_MULTIPLIERS[parsedProfile.activityLevel]);
    needsSave = true;
  }

  // Migration: Reset activityLevel to Sedentary if different (exercise now tracked separately)
  if (parsedProfile.activityLevel !== ActivityLevel.Sedentary) {
    parsedProfile.activityLevel = ActivityLevel.Sedentary;
    // Recalculate BMR/TDEE with Sedentary multiplier
    const newBmr = calculateBmr(parsedProfile.weight, parsedProfile.height, parsedProfile.age, parsedProfile.gender);
    parsedProfile.bmr = Math.round(newBmr);
    parsedProfile.tdee = Math.round(newBmr * ACTIVITY_MULTIPLIERS[ActivityLevel.Sedentary]);
    needsSave = true;
  }

  return { profile: parsedProfile, needsSave };
};
