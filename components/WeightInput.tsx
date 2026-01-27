import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WeightUnit } from '../types';
import { kgToLbs, lbsToKg } from '../constants';

interface WeightInputProps {
  currentWeight: number; // Always in kg (internal storage)
  weightUnit: WeightUnit;
  onSave: (weight: number) => void; // Expects kg
  onClose: () => void;
}

const WeightInput: React.FC<WeightInputProps> = ({ currentWeight, weightUnit, onSave, onClose }) => {
  // Convert to display unit for initial value
  const displayWeight = weightUnit === 'lbs' ? kgToLbs(currentWeight) : currentWeight;
  const [weight, setWeight] = useState(displayWeight.toFixed(1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weight);
    if (val > 0) {
      // Convert back to kg if user is using lbs
      const weightInKg = weightUnit === 'lbs' ? lbsToKg(val) : val;
      onSave(weightInKg);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Update Weight</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">Current Weight ({weightUnit})</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              autoFocus
              className="w-full text-center text-4xl font-bold p-4 border-b-2 border-brand-200 focus:border-brand-500 outline-none text-brand-900 bg-transparent placeholder-gray-300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default WeightInput;