import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, WeightUnit } from '../types';
import { ACTIVITY_MULTIPLIERS, kgToLbs, lbsToKg } from '../constants';
import { User, Ruler, ArrowRight, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, 'id' | 'avatarColor'>) => void;
  onCancel?: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: 'male',
    activityLevel: ActivityLevel.Sedentary, // Default to sedentary, exercise tracked separately
    weightUnit: 'kg',
  });
  const [weightInput, setWeightInput] = useState<number>(0);

  const calculateStats = (data: Partial<UserProfile>): { bmr: number; tdee: number } => {
    const { weight, height, age, gender, activityLevel } = data;
    if (!weight || !height || !age || !gender || !activityLevel) return { bmr: 0, tdee: 0 };

    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
    return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Convert weight to kg if needed
      const weightInKg = formData.weightUnit === 'lbs' ? lbsToKg(weightInput) : weightInput;
      const finalData = { ...formData, weight: weightInKg };
      const stats = calculateStats(finalData);
      const now = Date.now();
      onComplete({
        ...finalData as UserProfile,
        ...stats,
        createdAt: now, // Profile creation timestamp (never changes)
        lastWeightUpdate: now, // Initial weight update timestamp
        ageLastUpdatedYear: new Date().getFullYear(),
        dailyExerciseGoal: 300, // Default exercise goal
        calibrationFactor: 1.0, // Start with no calibration (BMR used as-is)
        calibrationBaseWeight: weightInKg, // Initial calibration baseline = registration weight
        waterTrackingEnabled: false, // Water tracking off by default
        dailyWaterGoalMl: 2500, // Default 2500ml
        waterUnit: 'ml', // Default ml
      });
    }
  };

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 pb-safe relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/5 rounded-full -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent-500/5 rounded-full translate-y-1/3 -translate-x-1/3" />
      
      <div className="max-w-md w-full bg-white rounded-[1.25rem] shadow-elevated p-8 relative z-10">
        {onCancel && step === 1 && (
            <button onClick={onCancel} className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 transition-colors">
                <ChevronLeft size={24} />
            </button>
        )}
        
        <div className="mb-8">
            {/* App Icon */}
            <div className="flex items-center gap-3 mb-4 pt-2">
              <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-sm">
                <span className="text-white text-xl font-extrabold">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">SmartCalorie</h1>
                <p className="text-xs text-gray-400 font-medium">AI-Powered Nutrition Tracking</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Let's calculate your metabolic baseline.</p>
            <div className="flex gap-2 mt-5">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-brand-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-brand-500' : 'bg-gray-200'}`}></div>
            </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-semibold flex items-center gap-2"><User size={20}/> Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow"
                placeholder="Your Name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <div className="flex gap-4">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleChange('gender', g)}
                    className={`flex-1 py-3 px-4 rounded-lg capitalize border ${
                      formData.gender === g
                        ? 'bg-brand-50 text-brand-700 border-brand-500 ring-1 ring-brand-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                inputMode="numeric"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
                placeholder="Years"
                value={formData.age || ''}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
             <h2 className="text-xl font-semibold flex items-center gap-2"><Ruler size={20}/> Body Stats</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
                placeholder="175"
                value={formData.height || ''}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight</label>
              <div className="space-y-3">
                {/* Unit selector - full width for visibility */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleChange('weightUnit', 'kg')}
                    className={`flex-1 py-3 font-medium transition-colors ${
                      formData.weightUnit === 'kg'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    kg (kilograms)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('weightUnit', 'lbs')}
                    className={`flex-1 py-3 font-medium transition-colors ${
                      formData.weightUnit === 'lbs'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    lbs (pounds)
                  </button>
                </div>
                {/* Weight input */}
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
                  placeholder={formData.weightUnit === 'lbs' ? 'e.g. 154' : 'e.g. 70'}
                  value={weightInput || ''}
                  onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={
            (step === 1 && (!formData.name || !formData.age)) ||
            (step === 2 && (!formData.height || !weightInput))
          }
          className="w-full mt-8 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {step === 2 ? 'Finish Setup' : 'Next'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;