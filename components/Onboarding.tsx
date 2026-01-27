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
      onComplete({
        ...finalData as UserProfile,
        ...stats,
        lastWeightUpdate: Date.now(), // Initial weight update timestamp
        ageLastUpdatedYear: new Date().getFullYear(),
        dailyExerciseGoal: 300, // Default exercise goal
        calibrationFactor: 1.0, // Start with no calibration (BMR used as-is)
      });
    }
  };

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 pb-safe">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 relative">
        {onCancel && step === 1 && (
            <button onClick={onCancel} className="absolute top-8 left-8 text-gray-400 hover:text-gray-600">
                <ChevronLeft size={24} />
            </button>
        )}
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 pt-2">Welcome</h1>
            <p className="text-gray-500">Let's calculate your metabolic baseline.</p>
            <div className="flex gap-2 mt-4">
                <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-brand-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-brand-500' : 'bg-gray-200'}`}></div>
            </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-semibold flex items-center gap-2"><User size={20}/> Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="175"
                value={formData.height || ''}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder={formData.weightUnit === 'lbs' ? '154' : '70'}
                  value={weightInput || ''}
                  onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                />
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.weightUnit !== 'kg') {
                        if (weightInput > 0) setWeightInput(Math.round(lbsToKg(weightInput) * 10) / 10);
                        handleChange('weightUnit', 'kg');
                      }
                    }}
                    className={`px-4 py-2 font-medium transition-colors ${
                      formData.weightUnit === 'kg'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.weightUnit !== 'lbs') {
                        if (weightInput > 0) setWeightInput(Math.round(kgToLbs(weightInput) * 10) / 10);
                        handleChange('weightUnit', 'lbs');
                      }
                    }}
                    className={`px-4 py-2 font-medium transition-colors ${
                      formData.weightUnit === 'lbs'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    lbs
                  </button>
                </div>
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
          className="w-full mt-8 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 2 ? 'Finish Setup' : 'Next'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;