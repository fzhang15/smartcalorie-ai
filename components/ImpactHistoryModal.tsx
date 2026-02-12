import React, { useMemo, useState } from 'react';
import { MealLog, ExerciseLog, UserProfile, DailyImpactRecord } from '../types';
import { CALORIES_PER_KG_FAT, kgToLbs } from '../constants';
import { X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { useSwipeToClose } from '../hooks/useSwipeToClose';

interface ImpactHistoryModalProps {
  profile: UserProfile;
  logs: MealLog[];
  exerciseLogs: ExerciseLog[];
  impactHistory: DailyImpactRecord[];
  onClose: () => void;
}

type TrendView = 'daily' | 'weekly' | 'monthly';

interface TrendDataPoint {
  label: string;
  value: number | null;
  displayValue: string;
  hasData: boolean;
}

// Helper function to format date as YYYY-MM-DD (using local time)
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ImpactHistoryModal: React.FC<ImpactHistoryModalProps> = ({
  profile,
  logs,
  exerciseLogs,
  impactHistory,
  onClose,
}) => {
  const [trendView, setTrendView] = useState<TrendView>('daily');
  const swipe = useSwipeToClose(onClose);

  // Helper to check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Get effective BMR (adjusted by calibration factor)
  const effectiveBmr = Math.round(profile.bmr * (profile.calibrationFactor || 1.0));

  // Calculate time-based BMR burn (proportional to time of day)
  const getTimeBasedBMR = (): number => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const dayProgress = (hours + minutes / 60) / 24;
    return Math.round(effectiveBmr * dayProgress);
  };

  // Calculate today's live impact value
  const calculateTodayImpact = (): number => {
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMealCalories = logs
      .filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime())
      .reduce((acc, log) => acc + log.totalCalories, 0);

    const dayExerciseCalories = exerciseLogs
      .filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime())
      .reduce((acc, log) => acc + log.caloriesBurned, 0);

    const bmrToUse = getTimeBasedBMR();
    const netCalories = dayMealCalories - bmrToUse - dayExerciseCalories;
    return netCalories / CALORIES_PER_KG_FAT;
  };

  // Create a map of date -> impact from history for quick lookup
  const historyMap = useMemo(() => {
    const map = new Map<string, number>();
    impactHistory.forEach(record => {
      map.set(record.date, record.impactKg);
    });
    return map;
  }, [impactHistory]);

  // Generate daily trend data (last 7 days) - fixed length
  const dailyTrendData = useMemo((): TrendDataPoint[] => {
    const data: TrendDataPoint[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDateKey(date);
      const isTodayDate = isToday(date);
      
      let impact: number | null = null;
      let hasData = false;
      
      if (isTodayDate) {
        // Today: always show live value
        impact = calculateTodayImpact();
        hasData = true;
      } else {
        // Past days: get from history
        if (historyMap.has(dateKey)) {
          impact = historyMap.get(dateKey)!;
          hasData = true;
        }
      }
      
      const convertedValue = impact !== null 
        ? (profile.weightUnit === 'lbs' ? kgToLbs(impact) : impact)
        : null;
      
      const labelSuffix = isTodayDate ? ' (now)' : '';
      
      data.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) + labelSuffix,
        value: convertedValue,
        displayValue: convertedValue !== null 
          ? `${convertedValue >= 0 ? '+' : ''}${convertedValue.toFixed(3)} ${profile.weightUnit || 'kg'}`
          : 'No data',
        hasData,
      });
    }
    
    return data;
  }, [logs, exerciseLogs, profile, historyMap]);

  // Generate weekly trend data (last 8 weeks) - fixed length
  const weeklyTrendData = useMemo((): TrendDataPoint[] => {
    const data: TrendDataPoint[] = [];
    const today = new Date();
    
    for (let week = 7; week >= 0; week--) {
      let weeklyImpact = 0;
      let hasAnyData = false;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (week * 7) - 6);
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + day);
        const dateKey = formatDateKey(date);
        
        if (isToday(date)) {
          // Include today's live value
          weeklyImpact += calculateTodayImpact();
          hasAnyData = true;
        } else if (historyMap.has(dateKey)) {
          weeklyImpact += historyMap.get(dateKey)!;
          hasAnyData = true;
        }
      }
      
      const convertedValue = hasAnyData 
        ? (profile.weightUnit === 'lbs' ? kgToLbs(weeklyImpact) : weeklyImpact)
        : null;
      
      const weekLabel = week === 0 ? 'This Week' : week === 1 ? 'Last Week' : `${week}w ago`;
      
      data.push({
        label: weekLabel,
        value: convertedValue,
        displayValue: convertedValue !== null 
          ? `${convertedValue >= 0 ? '+' : ''}${convertedValue.toFixed(2)} ${profile.weightUnit || 'kg'}`
          : 'No data',
        hasData: hasAnyData,
      });
    }
    
    return data;
  }, [logs, exerciseLogs, profile, historyMap]);

  // Generate monthly trend data (last 8 months) - fixed length
  const monthlyTrendData = useMemo((): TrendDataPoint[] => {
    const data: TrendDataPoint[] = [];
    const today = new Date();
    
    for (let month = 7; month >= 0; month--) {
      const targetMonth = new Date(today.getFullYear(), today.getMonth() - month, 1);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
      
      let monthlyImpact = 0;
      let hasAnyData = false;
      const current = new Date(targetMonth);
      
      while (current <= monthEnd && current <= today) {
        const dateKey = formatDateKey(current);
        
        if (isToday(current)) {
          // Include today's live value
          monthlyImpact += calculateTodayImpact();
          hasAnyData = true;
        } else if (historyMap.has(dateKey)) {
          monthlyImpact += historyMap.get(dateKey)!;
          hasAnyData = true;
        }
        
        current.setDate(current.getDate() + 1);
      }
      
      const convertedValue = hasAnyData 
        ? (profile.weightUnit === 'lbs' ? kgToLbs(monthlyImpact) : monthlyImpact)
        : null;
      
      const monthLabel = targetMonth.toLocaleDateString('en-US', { month: 'short' });
      
      data.push({
        label: monthLabel,
        value: convertedValue,
        displayValue: convertedValue !== null 
          ? `${convertedValue >= 0 ? '+' : ''}${convertedValue.toFixed(2)} ${profile.weightUnit || 'kg'}`
          : 'No data',
        hasData: hasAnyData,
      });
    }
    
    return data;
  }, [logs, exerciseLogs, profile, historyMap]);

  // Get current data based on view
  const currentData = trendView === 'daily' 
    ? dailyTrendData 
    : trendView === 'weekly' 
      ? weeklyTrendData 
      : monthlyTrendData;

  // Check if there's any meaningful data
  const hasData = currentData.some(d => d.hasData);

  // Calculate Y-axis domain with fixed defaults and auto-expand
  const yAxisDomain = useMemo((): [number, number] => {
    // Default boundaries per view (in user's weight unit)
    const defaultBoundaries = {
      daily: profile.weightUnit === 'lbs' ? 1.1 : 0.5,    // ±0.5 kg or ±1.1 lbs
      weekly: profile.weightUnit === 'lbs' ? 2.2 : 1.0,   // ±1.0 kg or ±2.2 lbs
      monthly: profile.weightUnit === 'lbs' ? 4.4 : 2.0,  // ±2.0 kg or ±4.4 lbs
    };
    
    const defaultBoundary = defaultBoundaries[trendView];
    
    // Find the max absolute value in the data
    const values = currentData
      .filter(d => d.value !== null)
      .map(d => Math.abs(d.value!));
    
    const maxAbsValue = values.length > 0 ? Math.max(...values) : 0;
    
    // If any value exceeds the default, expand with 10% padding
    const boundary = maxAbsValue > defaultBoundary 
      ? maxAbsValue * 1.1 
      : defaultBoundary;
    
    return [-boundary, boundary];
  }, [currentData, trendView, profile.weightUnit]);

  // Calculate summary statistics (only from data points with values)
  const dataWithValues = currentData.filter(d => d.value !== null);
  const totalImpact = dataWithValues.reduce((acc, d) => acc + (d.value || 0), 0);
  const avgImpact = dataWithValues.length > 0 ? totalImpact / dataWithValues.length : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TrendDataPoint;
      if (!data.hasData) return null;
      return (
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium">{data.label}</p>
          <p className={data.value !== null && data.value >= 0 ? 'text-red-400' : 'text-green-400'}>
            {data.displayValue}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot to only show dots for data points with values
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.hasData || payload.value === null) return null;
    return (
      <circle cx={cx} cy={cy} r={4} fill="#6366f1" strokeWidth={0} />
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4 modal-backdrop animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-[1.25rem] sm:rounded-[1.25rem] w-full max-w-md shadow-elevated animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95 sm:slide-in-from-bottom-0"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="drag-handle sm:hidden" />
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 pt-2 sm:pt-4 sm:px-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-brand-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Impact History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-4 pb-2">
          {(['daily', 'weekly', 'monthly'] as TrendView[]).map((view) => (
            <button
              key={view}
              onClick={() => setTrendView(view)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                trendView === view
                  ? 'bg-accent-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {view === 'daily' ? 'Daily' : view === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div className="p-4 pt-2">
          {!hasData ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={40} className="mb-2 opacity-30" />
              <p className="text-sm">No data available for this period</p>
              <p className="text-xs mt-1">Start logging meals to see trends</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                    domain={yAxisDomain}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={{ r: 6, fill: '#6366f1' }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary Stats */}
          {hasData && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Total Impact</p>
                <div className="flex items-center gap-1">
                  {totalImpact >= 0 ? (
                    <TrendingUp size={16} className="text-red-500" />
                  ) : (
                    <TrendingDown size={16} className="text-green-500" />
                  )}
                  <span className={`font-bold ${totalImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalImpact >= 0 ? '+' : ''}{totalImpact.toFixed(2)} {profile.weightUnit || 'kg'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Average</p>
                <div className="flex items-center gap-1">
                  {avgImpact >= 0 ? (
                    <TrendingUp size={16} className="text-red-500" />
                  ) : (
                    <TrendingDown size={16} className="text-green-500" />
                  )}
                  <span className={`font-bold ${avgImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {avgImpact >= 0 ? '+' : ''}{avgImpact.toFixed(3)} {profile.weightUnit || 'kg'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 text-center">
            {trendView === 'daily' && `Showing last 7 days (${dataWithValues.length} with data)`}
            {trendView === 'weekly' && `Showing last 8 weeks (${dataWithValues.length} with data)`}
            {trendView === 'monthly' && `Showing last 8 months (${dataWithValues.length} with data)`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactHistoryModal;