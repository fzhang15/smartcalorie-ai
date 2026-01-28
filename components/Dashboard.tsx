import React, { useMemo, useState, useEffect, useRef } from 'react';
import { UserProfile, MealLog, ExerciseLog, DailyImpactRecord } from '../types';
import { CALORIES_PER_KG_FAT, EXERCISE_LABELS, kgToLbs } from '../constants';
import { Plus, Flame, TrendingUp, TrendingDown, Scale, History, Utensils, ChevronLeft, ChevronRight, Calendar, Trash2, Clock, Activity, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import ImpactHistoryModal from './ImpactHistoryModal';

interface DashboardProps {
  profile: UserProfile;
  logs: MealLog[];
  exerciseLogs: ExerciseLog[];
  impactHistory: DailyImpactRecord[];
  onOpenLogger: () => void;
  onOpenExerciseLogger: () => void;
  onUpdateWeight: () => void;
  onEditProfile: () => void;
  onReset: () => void;
  onDeleteLog: (logId: string) => void;
  onDeleteExerciseLog: (logId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  profile, 
  logs, 
  exerciseLogs,
  impactHistory,
  onOpenLogger, 
  onOpenExerciseLogger,
  onUpdateWeight,
  onEditProfile,
  onReset, 
  onDeleteLog,
  onDeleteExerciseLog 
}) => {
  // State for the currently viewed date (defaults to today)
  const [viewDate, setViewDate] = useState(new Date());
  
  // State for real-time clock update
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for impact history modal
  const [showImpactHistory, setShowImpactHistory] = useState(false);
  
  // State for calendar picker
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  // Update current time every minute for real-time calorie burn calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);


  // Helper function to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Get effective BMR (adjusted by calibration factor)
  const effectiveBmr = Math.round(profile.bmr * (profile.calibrationFactor || 1.0));

  // Calculate time-based BMR burn (proportional to time of day)
  const getTimeBasedBMR = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const dayProgress = (hours + minutes / 60) / 24;
    return Math.round(effectiveBmr * dayProgress);
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() + days);
    setViewDate(newDate);
  };

  const resetToToday = () => setViewDate(new Date());

  const selectDate = (date: Date) => {
    setViewDate(date);
    setShowCalendar(false);
  };

  const openCalendar = () => {
    setCalendarMonth(new Date(viewDate));
    setShowCalendar(true);
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const hasLogsOnDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const hasMealLogs = logs.some(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());
    const hasExerciseLogs = exerciseLogs.some(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());
    
    return hasMealLogs || hasExerciseLogs;
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(calendarMonth.getMonth() + direction);
    setCalendarMonth(newMonth);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const today = new Date();
    const days = [];
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-11 h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const isSelected = isSameDay(date, viewDate);
      const isTodayDate = isSameDay(date, today);
      const isFuture = isFutureDate(date);
      const hasLogs = hasLogsOnDate(date);

      days.push(
        <button
          key={day}
          onClick={() => !isFuture && selectDate(date)}
          disabled={isFuture}
          className="w-11 h-12 flex flex-col items-center justify-center"
        >
          <span className={`w-11 h-11 rounded-full text-sm font-medium transition-all flex items-center justify-center
            ${isSelected 
              ? 'bg-brand-500 text-white' 
              : isTodayDate 
                ? 'bg-brand-100 text-brand-600 font-bold' 
                : isFuture 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {day}
          </span>
          {hasLogs && !isFuture && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 -mt-1"></span>
          )}
        </button>
      );
    }

    return (
      <div 
        ref={calendarRef}
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[340px]"
      >
        {/* Month/Year Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-gray-800 text-base">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map(label => (
            <div key={label} className="w-11 h-8 flex items-center justify-center text-xs font-medium text-gray-400">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        {/* Quick actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
          <button
            onClick={() => selectDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
          >
            Go to Today
          </button>
        </div>
      </div>
    );
  };

  // Filter meal logs based on the viewed date
  const displayedMealLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.getDate() === viewDate.getDate() &&
             logDate.getMonth() === viewDate.getMonth() &&
             logDate.getFullYear() === viewDate.getFullYear();
  });

  // Filter exercise logs based on the viewed date
  const displayedExerciseLogs = exerciseLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.getDate() === viewDate.getDate() &&
             logDate.getMonth() === viewDate.getMonth() &&
             logDate.getFullYear() === viewDate.getFullYear();
  });

  // Calculate exercise calories for the day
  const exerciseCaloriesBurned = displayedExerciseLogs.reduce((acc, log) => acc + log.caloriesBurned, 0);

  // Calculate total calories burned: BMR (time-based for today) + Exercise
  // On registration day, start counting from lastWeightUpdate, not midnight
  const getBmrBurnedSoFar = () => {
    if (!isToday(viewDate)) return effectiveBmr;
    
    const lastUpdate = profile.lastWeightUpdate || Date.now();
    const lastUpdateDate = new Date(lastUpdate);
    const isRegistrationDay = lastUpdateDate.getDate() === viewDate.getDate() &&
                               lastUpdateDate.getMonth() === viewDate.getMonth() &&
                               lastUpdateDate.getFullYear() === viewDate.getFullYear();
    
    if (isRegistrationDay) {
      // On registration day, BMR burned starts from registration time
      const hoursElapsed = Math.max(0, (Date.now() - lastUpdate) / (1000 * 60 * 60));
      return Math.round((effectiveBmr / 24) * hoursElapsed);
    }
    
    // Normal day: BMR burned from midnight
    return getTimeBasedBMR();
  };
  
  const bmrBurnedSoFar = getBmrBurnedSoFar();
  const totalCaloriesBurned = bmrBurnedSoFar + exerciseCaloriesBurned;

  // Daily target is effective BMR + exercise (not TDEE since we track exercise separately)
  const dailyTarget = effectiveBmr;

  const totalCaloriesIn = displayedMealLogs.reduce((acc, log) => acc + log.totalCalories, 0);
  const netCalories = totalCaloriesIn - (isToday(viewDate) ? totalCaloriesBurned : profile.bmr + exerciseCaloriesBurned);
  // For today, use time-based BMR to match Predicted Weight calculation; for past days, use full BMR
  const predictedWeightChange = (totalCaloriesIn - bmrBurnedSoFar - exerciseCaloriesBurned) / CALORIES_PER_KG_FAT; // kg

  const progressPercentage = Math.min((totalCaloriesIn / dailyTarget) * 100, 100);
  const burnProgress = isToday(viewDate) 
    ? Math.min((bmrBurnedSoFar / effectiveBmr) * 100, 100)
    : 100;
  
  const macroData = useMemo(() => {
    let p = 0, c = 0, f = 0;
    displayedMealLogs.forEach(log => {
        log.items.forEach(item => {
            p += item.protein;
            c += item.carbs;
            f += item.fat;
        });
    });
    return [
        { name: 'Protein', value: p, color: '#22c55e' }, // green-500
        { name: 'Carbs', value: c, color: '#eab308' },   // yellow-500
        { name: 'Fat', value: f, color: '#ef4444' },     // red-500
    ].filter(i => i.value > 0);
  }, [displayedMealLogs]);

  // Calculate predicted weight based on cumulative net calories since last weight update
  const predictedWeight = useMemo(() => {
    const lastUpdate = profile.lastWeightUpdate || Date.now();
    
    // Only count meals logged AFTER the weight update
    const caloriesIn = logs
      .filter(log => log.timestamp > lastUpdate)
      .reduce((acc, log) => acc + log.totalCalories, 0);
    
    // Only count exercise logged AFTER the weight update
    const caloriesExercise = exerciseLogs
      .filter(log => log.timestamp > lastUpdate)
      .reduce((acc, log) => acc + log.caloriesBurned, 0);
    
    // Calculate BMR burned from lastUpdate to now
    const hoursElapsed = Math.max(0, (Date.now() - lastUpdate) / (1000 * 60 * 60));
    const bmrBurned = Math.round((effectiveBmr / 24) * hoursElapsed);
    
    // Net calories and weight change
    const netCalories = caloriesIn - bmrBurned - caloriesExercise;
    const weightChange = netCalories / CALORIES_PER_KG_FAT;
    
    return profile.weight + weightChange;
  }, [logs, exerciseLogs, profile.weight, profile.lastWeightUpdate, effectiveBmr, currentTime]);

  const formattedDate = viewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="pb-32"> {/* Increased bottom padding for iOS Home Indicator */}
      {/* Top Bar - Added pt-4 for status bar spacing */}
      <div className="bg-white p-6 pb-4 pt-8 rounded-b-3xl shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <button 
            onClick={onEditProfile}
            className="flex items-center gap-3 hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors"
          >
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${profile.avatarColor || 'bg-brand-500'}`}>
                {profile.name.charAt(0).toUpperCase()}
             </div>
             <div className="text-left">
                <h1 className="text-xl font-bold text-gray-800">{profile.name}</h1>
                <p className="text-xs text-gray-500">Tap to edit profile</p>
             </div>
          </button>
          <button onClick={onReset} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete Profile">
              <Trash2 size={20} />
          </button>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between mb-4 bg-gray-50 p-1 rounded-xl relative">
            <button onClick={() => navigateDate(-1)} className="p-2 text-gray-500 hover:bg-white hover:text-brand-600 rounded-lg transition-all">
                <ChevronLeft size={20} />
            </button>
            <button 
              onClick={openCalendar}
              className="flex items-center gap-2 font-semibold text-gray-700 hover:bg-white px-3 py-1.5 rounded-lg transition-all"
            >
                <Calendar size={16} className="text-brand-500"/>
                {isToday(viewDate) ? "Today" : formattedDate}
            </button>
            {showCalendar && renderCalendar()}
            <div className="flex gap-1">
                {!isToday(viewDate) && (
                    <button onClick={resetToToday} className="px-3 py-1 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100">
                        Today
                    </button>
                )}
                <button 
                    onClick={() => navigateDate(1)} 
                    disabled={isToday(viewDate)}
                    className={`p-2 rounded-lg transition-all ${isToday(viewDate) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-white hover:text-brand-600'}`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>

        {/* Main Stats Card */}
        <div className="bg-black text-white rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame size={120} />
            </div>
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">
                        {isToday(viewDate) ? "Net Calories" : "Calories Consumed"}
                    </p>
                    <div className="text-4xl font-bold tracking-tight">
                        {isToday(viewDate) 
                            ? (netCalories > 0 ? '+' : '') + netCalories
                            : totalCaloriesIn
                        }
                    </div>
                    {isToday(viewDate) && (
                        <p className="text-gray-500 text-xs mt-1">
                            {totalCaloriesIn} eaten - {totalCaloriesBurned} burned
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-xs mb-1">Effective BMR</p>
                    <p className="font-semibold">{effectiveBmr} kcal</p>
                    {profile.calibrationFactor && profile.calibrationFactor !== 1.0 && (
                      <p className="text-[10px] text-gray-500">
                        ({(profile.calibrationFactor * 100).toFixed(0)}% of {profile.bmr})
                      </p>
                    )}
                </div>
            </div>
            
            {/* Calories Eaten Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center gap-1"><Utensils size={10}/> Eaten</span>
                  <span>{Math.round(totalCaloriesIn)} / {dailyTarget}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                      totalCaloriesIn > dailyTarget ? 'bg-red-500' : 'bg-brand-500'
                  }`} 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Burn Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center gap-1"><Clock size={10}/> BMR Burn</span>
                  <span>{bmrBurnedSoFar} / {profile.bmr}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-1000 bg-orange-500" 
                  style={{ width: `${burnProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Exercise Calories */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center gap-1"><Activity size={10}/> Exercise</span>
                  <span>{exerciseCaloriesBurned} / {profile.dailyExerciseGoal || 300} kcal</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    exerciseCaloriesBurned >= (profile.dailyExerciseGoal || 300) ? 'bg-green-500' : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.min((exerciseCaloriesBurned / (profile.dailyExerciseGoal || 300)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction & Metrics */}
      <div className="px-6 -mt-4 grid grid-cols-2 gap-4">
        <button 
            onClick={() => setShowImpactHistory(true)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:scale-95 transition-transform relative group"
        >
            <div className={`p-2 rounded-full mb-2 ${predictedWeightChange > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                {predictedWeightChange > 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
            </div>
            <p className="text-xs text-gray-400 font-medium">Daily Impact</p>
            <p className={`text-lg font-bold ${predictedWeightChange > 0 ? 'text-gray-800' : 'text-gray-800'}`}>
                {predictedWeightChange > 0 ? '+' : ''}
                {profile.weightUnit === 'lbs' 
                  ? kgToLbs(predictedWeightChange).toFixed(3)
                  : predictedWeightChange.toFixed(3)
                } <span className="text-sm font-normal text-gray-500">{profile.weightUnit || 'kg'}</span>
            </p>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <BarChart3 size={14} className="text-gray-400" />
            </div>
            <p className="text-[10px] text-brand-500 mt-1">Tap for history</p>
        </button>

        <button 
            onClick={onUpdateWeight}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:scale-95 transition-transform"
        >
            <div className="p-2 rounded-full mb-2 bg-blue-50 text-blue-500">
                <Scale size={20}/>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {Math.abs(predictedWeight - profile.weight) > 0.001 ? 'Predicted Weight' : 'Current Weight'}
            </p>
             <p className="text-lg font-bold text-gray-800">
                {profile.weightUnit === 'lbs' 
                  ? (kgToLbs(predictedWeight)).toFixed(1) 
                  : predictedWeight.toFixed(1)
                } <span className="text-sm font-normal text-gray-500">{profile.weightUnit || 'kg'}</span>
            </p>
            {Math.abs(predictedWeight - profile.weight) > 0.001 && (
              <p className="text-[10px] text-blue-500 mt-1">Tap to update</p>
            )}
        </button>
      </div>

      {/* Exercise Logs Section */}
      {displayedExerciseLogs.length > 0 && (
        <div className="px-6 pt-6">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4">
              <Activity size={18} className="text-orange-500"/> 
              Exercise
          </h3>
          <div className="space-y-2">
            {displayedExerciseLogs.map((log) => (
              <div key={log.id} className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Activity size={16}/>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{EXERCISE_LABELS[log.type]}</p>
                    <p className="text-xs text-gray-500">{log.durationMinutes} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-600">-{log.caloriesBurned}</span>
                  <button 
                    onClick={() => onDeleteExerciseLog(log.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
                    title="Delete exercise"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meal Logs Section */}
      <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <History size={18} className="text-brand-500"/> 
                {isToday(viewDate) ? "Today's Meals" : "Meals"}
            </h3>
            {macroData.length > 0 && (
                 <div className="h-6 w-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={macroData} dataKey="value" innerRadius={0} outerRadius={10} stroke="none">
                                {macroData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
            )}
          </div>
        
        {displayedMealLogs.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 mb-4">No meals logged for {isToday(viewDate) ? "today" : "this date"}.</p>
            {isToday(viewDate) && (
                <button 
                    onClick={onOpenLogger}
                    className="text-brand-600 font-medium text-sm hover:underline"
                >
                    Log your first meal
                </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedMealLogs.slice().reverse().map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 relative group">
                {log.imageUrl ? (
                    <img src={log.imageUrl} className="w-16 h-16 rounded-lg object-cover bg-gray-100" alt="meal" />
                ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                        <Utensils size={24}/>
                    </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-gray-800 capitalize">{log.mealType}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                            {log.items.map(i => i.name).join(', ')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-600">{log.totalCalories}</span>
                      <button 
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
                        title="Delete meal"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                   <div className="mt-2 flex gap-2 text-[10px] text-gray-400 font-mono">
                       <span className="bg-gray-50 px-1.5 py-0.5 rounded text-green-600">P: {log.items.reduce((a,b) => a+b.protein, 0)}g</span>
                       <span className="bg-gray-50 px-1.5 py-0.5 rounded text-yellow-600">C: {log.items.reduce((a,b) => a+b.carbs, 0)}g</span>
                       <span className="bg-gray-50 px-1.5 py-0.5 rounded text-red-500">F: {log.items.reduce((a,b) => a+b.fat, 0)}g</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Impact History Modal */}
      {showImpactHistory && (
        <ImpactHistoryModal
          profile={profile}
          logs={logs}
          exerciseLogs={exerciseLogs}
          impactHistory={impactHistory}
          onClose={() => setShowImpactHistory(false)}
        />
      )}

      {/* FAB - Only show if viewing Today */}
      {isToday(viewDate) && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-3 z-40 pointer-events-none">
            <button
              onClick={onOpenLogger}
              className="bg-brand-600 text-white rounded-full p-4 shadow-2xl shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-2 px-5"
            >
              <Utensils size={20} />
              <span className="font-semibold">Meal</span>
            </button>
            <button
              onClick={onOpenExerciseLogger}
              className="bg-orange-500 text-white rounded-full p-4 shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-2 px-5"
            >
              <Activity size={20} />
              <span className="font-semibold">Exercise</span>
            </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;