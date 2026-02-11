import React, { useState } from 'react';
import { X, Check, Activity } from 'lucide-react';
import { ExerciseType, ExerciseLog } from '../types';
import { EXERCISE_CALORIES_PER_MIN, EXERCISE_LABELS } from '../constants';

interface ExerciseLoggerProps {
  onLogExercise: (log: ExerciseLog) => void;
  onClose: () => void;
}

const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({ onLogExercise, onClose }) => {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('walking');
  const [duration, setDuration] = useState<number>(30);

  const caloriesBurned = Math.round(EXERCISE_CALORIES_PER_MIN[exerciseType] * duration);

  const handleSave = () => {
    const log: ExerciseLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: exerciseType,
      durationMinutes: duration,
      caloriesBurned,
    };
    onLogExercise(log);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 sm:pb-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-orange-500" size={20} />
            Log Exercise
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
          {/* Exercise Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Exercise Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EXERCISE_LABELS) as ExerciseType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setExerciseType(type)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    exerciseType === type
                      ? 'bg-orange-50 text-orange-700 border-orange-500 ring-1 ring-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{EXERCISE_LABELS[type]}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    ~{EXERCISE_CALORIES_PER_MIN[type] * 60} cal/hr
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="w-20 text-center">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>5 min</span>
              <span>60 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Calories Preview */}
          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
            <span className="font-semibold text-orange-900">Calories Burned</span>
            <span className="text-xl font-bold text-orange-700">
              {caloriesBurned} kcal
            </span>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
          >
            <Check size={20} /> Save Exercise Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseLogger;