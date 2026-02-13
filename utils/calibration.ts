/**
 * Weight calibration logic.
 * 
 * Compares predicted vs actual weight changes to learn the user's true BMR.
 * Extracted from App.tsx handleUpdateWeight for testability and maintainability.
 * See README.md "BMR Calibration & Compensation Math" for the full algorithm.
 */

import { UserProfile, MealLog, ExerciseLog, DailyImpactRecord } from '../types';
import { ACTIVITY_MULTIPLIERS, CALORIES_PER_KG_FAT } from '../constants';
import { formatDateKey } from './dateUtils';
import { calculateBmr } from './profileUtils';

export interface CalibrationResult {
  /** Updated profile with new weight, BMR, TDEE, and calibration fields */
  updatedProfile: UserProfile;
  /** Impact history corrections to apply (null if no corrections needed) */
  impactCorrections: { date: string; correctionPerDay: number }[] | null;
}

/**
 * Process a weight update: recalculate BMR/TDEE, and if enough time has passed (dayGap >= 1),
 * run the calibration algorithm to adjust the calibration factor and correct impact history.
 * 
 * This is a pure function — it returns the new state without side effects.
 */
export const calibrateWeight = (
  profile: UserProfile,
  logs: MealLog[],
  exerciseLogs: ExerciseLog[],
  newWeight: number,
): CalibrationResult => {
  // Use calibrationBaseWeight as the baseline for actual change calculation
  const baseWeight = profile.calibrationBaseWeight ?? profile.weight;
  const actualChange = newWeight - baseWeight;

  // Calculate duration-based day gap for calibration confidence
  const lastUpdate = profile.lastWeightUpdate || Date.now();
  const gapHours = (Date.now() - lastUpdate) / (1000 * 60 * 60);
  const dayGap = Math.floor(gapHours / 24);

  // Recalculate BMR/TDEE with new weight (always done regardless of dayGap)
  const newBmr = calculateBmr(newWeight, profile.height, profile.age, profile.gender);
  const newTdee = newBmr * ACTIVITY_MULTIPLIERS[profile.activityLevel];

  // dayGap === 0: Too short for reliable calibration (< 24 hours)
  // Save weight for display + BMR recalc, but don't calibrate or move baseline
  if (dayGap === 0) {
    console.log('Weight Update (no calibration, dayGap=0):', {
      baseWeight,
      newWeight,
      gapHours: gapHours.toFixed(1),
      dayGap,
      calibrationFactor: profile.calibrationFactor,
    });

    return {
      updatedProfile: {
        ...profile,
        weight: newWeight,
        bmr: Math.round(newBmr),
        tdee: Math.round(newTdee),
        // Do NOT update lastWeightUpdate or calibrationBaseWeight — gap keeps accumulating
      },
      impactCorrections: null,
    };
  }

  // dayGap >= 1: Proceed with calibration
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate cumulative predicted impact since last weight update
  let predictedChange = 0;
  const startOfUpdateDay = new Date(lastUpdate);
  startOfUpdateDay.setHours(0, 0, 0, 0);

  const current = new Date(startOfUpdateDay);
  const effectiveBmr = profile.bmr * (profile.calibrationFactor || 1.0);

  // Track total BMR burned across the period for calibration
  let totalBmrBurned = 0;

  // Get impact records for the period
  const recordsInPeriod: { date: string; impact: number }[] = [];

  while (current <= today) {
    const dateKey = formatDateKey(current);
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMealCalories = logs
      .filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime())
      .reduce((acc, log) => acc + log.totalCalories, 0);

    const dayExerciseCalories = exerciseLogs
      .filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime())
      .reduce((acc, log) => acc + log.caloriesBurned, 0);

    // Check if this day has any logs
    const hasLogs = logs.some(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime()) ||
                    exerciseLogs.some(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());

    // Calculate BMR for this day (needed for both impact tracking and calibration)
    let bmrBurned: number;
    const lastUpdateDate = new Date(lastUpdate);
    const isFirstDay = current.getDate() === lastUpdateDate.getDate() &&
                       current.getMonth() === lastUpdateDate.getMonth() &&
                       current.getFullYear() === lastUpdateDate.getFullYear();
    const isToday = current.getDate() === new Date().getDate() &&
                   current.getMonth() === new Date().getMonth() &&
                   current.getFullYear() === new Date().getFullYear();

    if (isFirstDay && isToday) {
      const hoursElapsed = (Date.now() - lastUpdate) / (1000 * 60 * 60);
      bmrBurned = Math.round((effectiveBmr / 24) * Math.max(0, hoursElapsed));
    } else if (isFirstDay) {
      const endOfFirstDay = new Date(lastUpdate);
      endOfFirstDay.setHours(23, 59, 59, 999);
      const hoursElapsed = (endOfFirstDay.getTime() - lastUpdate) / (1000 * 60 * 60);
      bmrBurned = Math.round((effectiveBmr / 24) * hoursElapsed);
    } else if (isToday) {
      const now = new Date();
      const dayProgress = (now.getHours() + now.getMinutes() / 60) / 24;
      bmrBurned = Math.round(effectiveBmr * dayProgress);
    } else {
      bmrBurned = effectiveBmr;
    }

    if (hasLogs) {
      const dayImpact = (dayMealCalories - bmrBurned - dayExerciseCalories) / CALORIES_PER_KG_FAT;
      predictedChange += dayImpact;
      totalBmrBurned += bmrBurned;
      recordsInPeriod.push({ date: dateKey, impact: dayImpact });
    }
    // No-log days: assume net calories = 0 (user forgot to log), no contribution to prediction or calibration

    current.setDate(current.getDate() + 1);
  }

  // Calculate calibration error (using calibrationBaseWeight, not display weight)
  const predictionError = predictedChange - actualChange; // Positive = overpredicted weight gain

  // Duration-aware smoothing ratio:
  // dayGap=1 → newRatio=0.1 (very conservative, 1 day is still noisy)
  // dayGap=2 → newRatio=0.2
  // dayGap=3 → newRatio=0.3
  // dayGap=4 → newRatio=0.4
  // dayGap≥5 → newRatio=0.5 (capped, max trust in new signal)
  const newRatio = Math.min(dayGap * 0.1, 0.5);
  const oldRatio = 1 - newRatio;

  // Update calibration factor using BMR-based correction
  let newCalibrationFactor = profile.calibrationFactor || 1.0;
  if (totalBmrBurned > 0) {
    const bmrCorrectionRatio = 1 + (predictedChange - actualChange) * CALORIES_PER_KG_FAT / totalBmrBurned;
    const thisMeasurementFactor = newCalibrationFactor * bmrCorrectionRatio;

    // Only calibrate when the implied BMR change is significant (>5%)
    if (Math.abs(bmrCorrectionRatio - 1) > 0.05) {
      // Clamp to reasonable range (0.5 to 1.5)
      const clampedFactor = Math.max(0.5, Math.min(1.5, thisMeasurementFactor));
      // Duration-aware exponential smoothing
      newCalibrationFactor = oldRatio * newCalibrationFactor + newRatio * clampedFactor;
    }
  }

  // Build impact corrections
  let impactCorrections: CalibrationResult['impactCorrections'] = null;
  if (recordsInPeriod.length > 0 && Math.abs(predictionError) > 0.001) {
    const correctionPerDay = predictionError / recordsInPeriod.length;
    impactCorrections = recordsInPeriod.map(r => ({
      date: r.date,
      correctionPerDay,
    }));
  }

  // Log calibration info for debugging
  console.log('Weight Calibration:', {
    baseWeight,
    newWeight,
    actualChange,
    predictedChange,
    predictionError,
    totalBmrBurned,
    dayGap,
    smoothingRatio: `${oldRatio.toFixed(1)}/${newRatio.toFixed(1)}`,
    oldCalibrationFactor: profile.calibrationFactor,
    newCalibrationFactor,
    daysAffected: recordsInPeriod.length,
  });

  return {
    updatedProfile: {
      ...profile,
      weight: newWeight,
      bmr: Math.round(newBmr),
      tdee: Math.round(newTdee),
      lastWeightUpdate: Date.now(),
      calibrationFactor: newCalibrationFactor,
      calibrationBaseWeight: newWeight, // Reset baseline on successful calibration
    },
    impactCorrections,
  };
};
