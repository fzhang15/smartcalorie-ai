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
  lastWeightUpdate: number; // timestamp of last manual weight update
  ageLastUpdatedYear: number; // Year when age was last updated (for auto-increment)
  dailyExerciseGoal: number; // Daily exercise calorie burn goal (default 300)
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
  items: FoodItem[];
  totalCalories: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalCaloriesIn: number;
  netWeightChange: number; // estimated kg change
}

export type ExerciseType = 'walking' | 'running' | 'elliptical' | 'cycling' | 'swimming' | 'strength';

export interface ExerciseLog {
  id: string;
  timestamp: number;
  type: ExerciseType;
  durationMinutes: number;
  caloriesBurned: number;
}

export interface DailyImpactRecord {
  date: string; // YYYY-MM-DD format
  impactKg: number; // finalized weight impact in kg
}
