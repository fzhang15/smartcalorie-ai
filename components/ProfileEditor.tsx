import React, { useState } from 'react';
import { X, Check, User } from 'lucide-react';
import { UserProfile, Gender, WeightUnit, WaterUnit } from '../types';
import { ACTIVITY_MULTIPLIERS, kgToLbs, lbsToKg, mlToOz, ozToMl, DEFAULT_WATER_GOAL_ML, formatWaterAmount } from '../constants';
import { useSwipeToClose } from '../hooks/useSwipeToClose';

const VALIDATION = {
  age: { min: 1, max: 120 },
  height: { min: 50, max: 300 },
  weight: { kg: { min: 10, max: 500 }, lbs: { min: 22, max: 1102 } },
};

const isAgeValid = (v: number) => v >= VALIDATION.age.min && v <= VALIDATION.age.max;
const isHeightValid = (v: number) => v >= VALIDATION.height.min && v <= VALIDATION.height.max;
const isWeightValid = (v: number, unit: WeightUnit) => {
  const bounds = VALIDATION.weight[unit];
  return v >= bounds.min && v <= bounds.max;
};

interface ProfileEditorProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => void;
  onClose: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onClose }) => {
  const swipe = useSwipeToClose(onClose);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState<number>(profile.age);
  const [height, setHeight] = useState<number>(profile.height);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile.weightUnit || 'kg');
  const [weightInput, setWeightInput] = useState<number>(
    profile.weightUnit === 'lbs' ? Math.round(kgToLbs(profile.weight) * 10) / 10 : profile.weight
  );
  const [dailyExerciseGoal, setDailyExerciseGoal] = useState<number>(profile.dailyExerciseGoal || 300);
  const [waterTrackingEnabled, setWaterTrackingEnabled] = useState<boolean>(profile.waterTrackingEnabled || false);
  const [waterUnit, setWaterUnit] = useState<WaterUnit>(profile.waterUnit || 'ml');
  const [waterGoalInput, setWaterGoalInput] = useState<number>(
    (profile.waterUnit || 'ml') === 'oz' 
      ? Math.round(mlToOz(profile.dailyWaterGoalMl || DEFAULT_WATER_GOAL_ML)) 
      : (profile.dailyWaterGoalMl || DEFAULT_WATER_GOAL_ML)
  );

  const handleSave = () => {
    // Convert weight to kg if needed
    const weightInKg = weightUnit === 'lbs' ? lbsToKg(weightInput) : weightInput;
    
    // Recalculate BMR with new values
    let newBmr = (10 * weightInKg) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
      newBmr += 5;
    } else {
      newBmr -= 161;
    }
    const newTdee = newBmr * ACTIVITY_MULTIPLIERS[profile.activityLevel];

    // Convert water goal to ml if needed
    const waterGoalMl = waterUnit === 'oz' ? Math.round(ozToMl(waterGoalInput)) : waterGoalInput;

    const updates: Partial<UserProfile> = {
      gender,
      age,
      height,
      weight: weightInKg,
      weightUnit,
      bmr: Math.round(newBmr),
      tdee: Math.round(newTdee),
      ageLastUpdatedYear: new Date().getFullYear(),
      dailyExerciseGoal,
      waterTrackingEnabled,
      waterUnit,
      dailyWaterGoalMl: waterGoalMl,
    };

    // Update lastWeightUpdate and calibrationBaseWeight if weight changed
    if (Math.abs(weightInKg - profile.weight) > 0.01) {
      updates.lastWeightUpdate = Date.now();
      updates.calibrationBaseWeight = weightInKg;
    }

    onSave(updates);
    onClose();
  };

  const displayWeight = weightUnit === 'lbs' 
    ? Math.round(kgToLbs(profile.weight) * 10) / 10 
    : profile.weight;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 sm:pb-4 modal-backdrop">
      <div className="bg-white w-full max-w-lg rounded-t-[1.25rem] sm:rounded-[1.25rem] shadow-elevated overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95 sm:slide-in-from-bottom-0"
        onTouchStart={swipe.onTouchStart} onTouchMove={swipe.onTouchMove} onTouchEnd={swipe.onTouchEnd} style={swipe.style}>
        <div className="drag-handle sm:hidden" />
        {/* Header */}
        <div className="px-5 pb-4 pt-2 sm:pt-4 sm:px-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="text-brand-500" size={20} />
            Edit Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div ref={swipe.scrollContainerRef} className="overflow-y-auto p-4 space-y-6">
          {/* Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
              {profile.name}
            </div>
            <p className="text-xs text-gray-400 mt-1">Name cannot be changed</p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <div className="flex gap-4">
              {(['male', 'female'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 px-4 rounded-lg capitalize border ${
                    gender === g
                      ? 'bg-brand-50 text-brand-700 border-brand-500 ring-1 ring-brand-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              inputMode="numeric"
              min={VALIDATION.age.min}
              max={VALIDATION.age.max}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none ${age > 0 && !isAgeValid(age) ? 'border-red-400' : 'border-gray-300'}`}
              value={age}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
            />
            {age > 0 && !isAgeValid(age) ? (
              <p className="text-xs text-red-500 mt-1">Age must be between {VALIDATION.age.min} and {VALIDATION.age.max}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Age automatically increases on January 1st each year</p>
            )}
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              min={VALIDATION.height.min}
              max={VALIDATION.height.max}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none ${height > 0 && !isHeightValid(height) ? 'border-red-400' : 'border-gray-300'}`}
              value={height}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
            />
            {height > 0 && !isHeightValid(height) && (
              <p className="text-xs text-red-500 mt-1">Height must be between {VALIDATION.height.min} and {VALIDATION.height.max} cm</p>
            )}
          </div>

          {/* Weight with Unit Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={VALIDATION.weight[weightUnit].min}
                max={VALIDATION.weight[weightUnit].max}
                className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none ${weightInput > 0 && !isWeightValid(weightInput, weightUnit) ? 'border-red-400' : 'border-gray-300'}`}
                value={weightInput}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
              />
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => {
                    if (weightUnit !== 'kg') {
                      setWeightInput(Math.round(lbsToKg(weightInput) * 10) / 10);
                      setWeightUnit('kg');
                    }
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    weightUnit === 'kg'
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  kg
                </button>
                <button
                  onClick={() => {
                    if (weightUnit !== 'lbs') {
                      setWeightInput(Math.round(kgToLbs(weightInput) * 10) / 10);
                      setWeightUnit('lbs');
                    }
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    weightUnit === 'lbs'
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  lbs
                </button>
              </div>
            </div>
            {weightInput > 0 && !isWeightValid(weightInput, weightUnit) && (
              <p className="text-xs text-red-500 mt-1">Weight must be between {VALIDATION.weight[weightUnit].min} and {VALIDATION.weight[weightUnit].max} {weightUnit}</p>
            )}
          </div>

          {/* Daily Exercise Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Exercise Goal (kcal)</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="2000"
              step="50"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              value={dailyExerciseGoal}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDailyExerciseGoal(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-gray-400 mt-1">Target calories to burn through exercise each day</p>
          </div>

          {/* Water Tracking */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Water Tracking</label>
              <button
                onClick={() => setWaterTrackingEnabled(!waterTrackingEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  waterTrackingEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    waterTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {waterTrackingEnabled && (
              <div className="space-y-4 pl-0 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Water Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Water Goal</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={waterGoalInput}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setWaterGoalInput(parseInt(e.target.value) || 0)}
                    />
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      <button
                        onClick={() => {
                          if (waterUnit !== 'ml') {
                            setWaterGoalInput(Math.round(ozToMl(waterGoalInput)));
                            setWaterUnit('ml');
                          }
                        }}
                        className={`px-4 py-2 font-medium transition-colors ${
                          waterUnit === 'ml'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        ml
                      </button>
                      <button
                        onClick={() => {
                          if (waterUnit !== 'oz') {
                            setWaterGoalInput(Math.round(mlToOz(waterGoalInput)));
                            setWaterUnit('oz');
                          }
                        }}
                        className={`px-4 py-2 font-medium transition-colors ${
                          waterUnit === 'oz'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        oz
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 2,000–3,000 ml (68–101 oz) per day</p>
                </div>
              </div>
            )}
          </div>

          {/* BMR Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Calculated BMR</p>
            <p className="text-xl font-bold text-gray-800">
              {(() => {
                const weightInKg = weightUnit === 'lbs' ? lbsToKg(weightInput) : weightInput;
                let bmr = (10 * weightInKg) + (6.25 * height) - (5 * age);
                if (gender === 'male') bmr += 5;
                else bmr -= 161;
                return Math.round(bmr);
              })()} kcal/day
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!age || !isAgeValid(age) || !height || !isHeightValid(height) || !weightInput || !isWeightValid(weightInput, weightUnit)}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Check size={20} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;