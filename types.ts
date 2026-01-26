export type Gender = 'male' | 'female';

export enum ActivityLevel {
  Sedentary = 'sedentary', // 1.2
  Light = 'light', // 1.375
  Moderate = 'moderate', // 1.55
  Active = 'active', // 1.725
  VeryActive = 'very_active', // 1.9
}

export interface UserProfile {
  id: string; // Added ID to profile
  name: string;
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  bmr: number;
  tdee: number;
  avatarColor?: string; // For UI
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
