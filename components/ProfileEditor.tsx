import React, { useState } from 'react';
import { X, Check, User } from 'lucide-react';
import { UserProfile, Gender, WeightUnit } from '../types';
import { ACTIVITY_MULTIPLIERS, kgToLbs, lbsToKg } from '../constants';

interface ProfileEditorProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => void;
  onClose: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onClose }) => {
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState<number>(profile.age);
  const [height, setHeight] = useState<number>(profile.height);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile.weightUnit || 'kg');
  const [weightInput, setWeightInput] = useState<number>(
    profile.weightUnit === 'lbs' ? Math.round(kgToLbs(profile.weight) * 10) / 10 : profile.weight
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

    const updates: Partial<UserProfile> = {
      gender,
      age,
      height,
      weight: weightInKg,
      weightUnit,
      bmr: Math.round(newBmr),
      tdee: Math.round(newTdee),
      ageLastUpdatedYear: new Date().getFullYear(),
    };

    // Update lastWeightUpdate if weight changed
    if (Math.abs(weightInKg - profile.weight) > 0.01) {
      updates.lastWeightUpdate = Date.now();
    }

    onSave(updates);
    onClose();
  };

  const displayWeight = weightUnit === 'lbs' 
    ? Math.round(kgToLbs(profile.weight) * 10) / 10 
    : profile.weight;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="text-brand-500" size={20} />
            Edit Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
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
              min="1"
              max="120"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-gray-400 mt-1">Age automatically increases on January 1st each year</p>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              min="50"
              max="250"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Weight with Unit Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={weightInput}
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
            disabled={!age || !height || !weightInput}
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Check size={20} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;