export type Gender = 'male' | 'female';

export enum ActivityLevel {
  Sedentary = 'sedentary', // 1.2
  Light = 'light', // 1.375
  Moderate = 'moderate', // 1.55
  Active = 'active', // 1.725
  VeryActive = 'very_active', // 1.9
}

export type WeightUnit = 'kg' | 'lbs';

export interface UserProfile {
  id: string; // Added ID to profile
  name: string;
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg (always stored in kg, converted for display)
  weightUnit: WeightUnit; // User's preferred weight unit
  activityLevel: ActivityLevel;
  bmr: number;
  tdee: number;
  avatarColor?: string; // For UI
  createdAt: number; // timestamp when profile was first created (never changes)
  lastWeightUpdate: number; // timestamp of last manual weight update
  ageLastUpdatedYear: number; // Year when age was last updated (for auto-increment)
  dailyExerciseGoal: number; // Daily exercise calorie burn goal (default 300)
  calibrationFactor: number; // Adjustment factor for BMR accuracy (default 1.0, learned from weight updates)
  calibrationBaseWeight: number; // Weight at last calibration point (only updated when dayGap >= 1)
  waterTrackingEnabled: boolean; // Whether water tracking is enabled (default false)
  dailyWaterGoalMl: number; // Daily water intake goal in ml (default 2500)
  waterUnit: WaterUnit; // User's preferred water unit (default 'ml')
  waterNotificationEnabled: boolean; // Whether water reminder notifications are enabled (default false)
  waterNotificationStartHour: number; // Start hour of notification window in local time (default 8 = 8AM)
  waterNotificationEndHour: number; // End hour of notification window in local time (default 21 = 9PM)
  waterNotificationDeviationHours: number; // Trigger notification when behind by this many hours' worth (default 2)
}

export interface UserSummary {
  id: string;
  name: string;
  avatarColor: string;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
}

export interface MealLog {
  id: string;
  timestamp: number;
  imageUrl?: string;
  description?: string; // Text description when meal is logged via text input
  items: FoodItem[];
  totalCalories: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  portionRatio?: number; // 0-1 range, represents personal portion ratio (e.g. 0.5 for a 2-person meal)
  healthScore?: number; // 1-10 health rating from AI analysis
  healthNote?: string; // Short one-sentence health judgement from AI
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalCaloriesIn: number;
  netWeightChange: number; // estimated kg change
}

export type ExerciseType = 'walking' | 'running' | 'elliptical' | 'cycling' | 'swimming' | 'strength' | 'aerobics' | 'plank';

export interface ExerciseLog {
  id: string;
  timestamp: number;
  type: ExerciseType;
  durationMinutes: number;
  caloriesBurned: number;
}

export interface WaterLog {
  id: string;
  timestamp: number;
  amountMl: number; // Always stored in ml internally
}

export type WaterUnit = 'ml' | 'oz';

export interface DailyImpactRecord {
  date: string; // YYYY-MM-DD format
  impactKg: number; // finalized weight impact in kg
}
