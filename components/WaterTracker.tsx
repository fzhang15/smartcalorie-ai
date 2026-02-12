import React, { useState } from 'react';
import { X, Droplets, Plus } from 'lucide-react';
import { WaterLog, WaterUnit } from '../types';
import { WATER_QUICK_ADD, formatWaterAmount, ozToMl } from '../constants';

interface WaterTrackerProps {
  waterUnit: WaterUnit;
  dailyGoalMl: number;
  todayLogs: WaterLog[];
  onLogWater: (log: WaterLog) => void;
  onClose: () => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ waterUnit, dailyGoalMl, todayLogs, onLogWater, onClose }) => {
  const [customAmount, setCustomAmount] = useState<string>('');

  const todayTotal = todayLogs.reduce((acc, log) => acc + log.amountMl, 0);
  const progressPercent = Math.min((todayTotal / dailyGoalMl) * 100, 100);

  const handleQuickAdd = (ml: number) => {
    const log: WaterLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      amountMl: ml,
    };
    onLogWater(log);
  };

  const handleCustomAdd = () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0) return;

    const amountMl = waterUnit === 'oz' ? ozToMl(amount) : amount;
    const log: WaterLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      amountMl: Math.round(amountMl),
    };
    onLogWater(log);
    setCustomAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 sm:pb-4 modal-backdrop">
      <div className="bg-white w-full max-w-lg rounded-t-[1.25rem] sm:rounded-[1.25rem] shadow-elevated overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95 sm:slide-in-from-bottom-0">
        <div className="drag-handle sm:hidden" />
        {/* Header */}
        <div className="px-5 pb-4 pt-2 sm:pt-4 sm:px-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Droplets className="text-blue-500" size={20} />
            Log Water
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
          {/* Progress */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-700">Today's Progress</span>
              <span className="text-sm font-bold text-blue-800">
                {formatWaterAmount(todayTotal, waterUnit)} / {formatWaterAmount(dailyGoalMl, waterUnit)}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  todayTotal >= dailyGoalMl ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {todayTotal >= dailyGoalMl && (
              <p className="text-xs text-green-600 font-medium mt-2 text-center">🎉 Daily goal reached!</p>
            )}
          </div>

          {/* Quick Add Buttons */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Quick Add</label>
            <div className="grid grid-cols-3 gap-3">
              {WATER_QUICK_ADD.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickAdd(option.ml)}
                  className="flex flex-col items-center p-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 active:scale-95 transition-all"
                >
                  <span className="text-2xl mb-1">{option.emoji}</span>
                  <span className="font-semibold text-blue-700">{formatWaterAmount(option.ml, waterUnit)}</span>
                  <span className="text-xs text-gray-400">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Custom Amount</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                  placeholder={waterUnit === 'oz' ? 'Enter oz...' : 'Enter ml...'}
                  className="w-full p-3 pr-12 border border-gray-300 rounded-xl text-center font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                  {waterUnit}
                </span>
              </div>
              <button
                onClick={handleCustomAdd}
                disabled={!customAmount || parseFloat(customAmount) <= 0}
                className="px-4 bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-1 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} /> Add
              </button>
            </div>
          </div>

          {/* Recent Logs Today */}
          {todayLogs.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Today's Entries</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {todayLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="font-medium text-blue-700">
                      +{formatWaterAmount(log.amountMl, waterUnit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaterTracker;