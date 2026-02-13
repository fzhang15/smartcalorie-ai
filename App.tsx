import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog, UserSummary, ExerciseLog, ActivityLevel, DailyImpactRecord, WaterLog } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import WeightInput from './components/WeightInput';
import UserSelector from './components/UserSelector';
import ExerciseLogger from './components/ExerciseLogger';
import WaterTracker from './components/WaterTracker';
import ProfileEditor from './components/ProfileEditor';
import { ACTIVITY_MULTIPLIERS, CALORIES_PER_KG_FAT } from './constants';
import { deleteImage, deleteImages, isIdbRef, getIdbKey, migrateLogsToIdb } from './services/imageStore';

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
  'bg-pink-500', 'bg-rose-500'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// Helper function to format date as YYYY-MM-DD (using local time)
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get yesterday's date
const getYesterday = (): Date => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

const App: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [impactHistory, setImpactHistory] = useState<DailyImpactRecord[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  
  // UI State
  const [view, setView] = useState<'loading' | 'user-select' | 'onboarding' | 'dashboard'>('loading');
  const [showLogger, setShowLogger] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [suggestedWeight, setSuggestedWeight] = useState<number | null>(null);
  const [showExerciseLogger, setShowExerciseLogger] = useState(false);
  const [showWaterTracker, setShowWaterTracker] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Initial Data Load & Migration Logic
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('smartcalorie_users');
      
      if (storedUsers) {
        // Multi-user system exists
        const parsedUsers = JSON.parse(storedUsers);
        setUsers(parsedUsers);
        if (parsedUsers.length === 1) {
          // Single user: auto-login, skip user selection screen
          setCurrentUserId(parsedUsers[0].id);
        } else if (parsedUsers.length > 1) {
          setView('user-select');
        } else {
          setView('onboarding');
        }
      } else {
        // Check for legacy single-user data
        const oldProfile = localStorage.getItem('smartcalorie_profile');
        if (oldProfile) {
          const parsedProfile = JSON.parse(oldProfile);
          const oldLogs = localStorage.getItem('smartcalorie_logs');
          
          // Migrate
          const newId = `user_${Date.now()}`;
          const newProfile: UserProfile = { ...parsedProfile, id: newId, avatarColor: getRandomColor() };
          const newUsers: UserSummary[] = [{ id: newId, name: newProfile.name, avatarColor: newProfile.avatarColor! }];
          
          localStorage.setItem('smartcalorie_users', JSON.stringify(newUsers));
          localStorage.setItem(`smartcalorie_profile_${newId}`, JSON.stringify(newProfile));
          if (oldLogs) {
             localStorage.setItem(`smartcalorie_logs_${newId}`, oldLogs);
          }
          
          // Cleanup old keys
          localStorage.removeItem('smartcalorie_profile');
          localStorage.removeItem('smartcalorie_logs');

          setUsers(newUsers);
          setCurrentUserId(newId); // Auto-login migrated user
        } else {
          // Fresh install
          setView('onboarding');
        }
      }
    } catch (e) {
      console.error("Initialization error", e);
      localStorage.clear();
      setView('onboarding');
    }
  }, []);

  // Load User Data when currentUserId changes
  useEffect(() => {
    if (!currentUserId) return;

    try {
      const storedProfile = localStorage.getItem(`smartcalorie_profile_${currentUserId}`);
      const storedLogs = localStorage.getItem(`smartcalorie_logs_${currentUserId}`);
      const storedExerciseLogs = localStorage.getItem(`smartcalorie_exercise_${currentUserId}`);
      const storedWaterLogs = localStorage.getItem(`smartcalorie_water_${currentUserId}`);

      if (storedProfile) {
        let parsedProfile: UserProfile = JSON.parse(storedProfile);
        let needsSave = false;
        
        // Migration: Add lastWeightUpdate if missing
        if (!parsedProfile.lastWeightUpdate) {
          parsedProfile.lastWeightUpdate = Date.now();
          needsSave = true;
        }
        
        // Migration: Add ageLastUpdatedYear if missing
        if (!parsedProfile.ageLastUpdatedYear) {
          parsedProfile.ageLastUpdatedYear = new Date().getFullYear();
          needsSave = true;
        }
        
        // Migration: Add weightUnit if missing
        if (!parsedProfile.weightUnit) {
          parsedProfile.weightUnit = 'kg';
          needsSave = true;
        }
        
        // Migration: Add dailyExerciseGoal if missing
        if (!parsedProfile.dailyExerciseGoal) {
          parsedProfile.dailyExerciseGoal = 300;
          needsSave = true;
        }
        
        // Migration: Add calibrationFactor if missing
        if (parsedProfile.calibrationFactor === undefined) {
          parsedProfile.calibrationFactor = 1.0;
          needsSave = true;
        }
        
        // Migration: Add calibrationBaseWeight if missing
        if (parsedProfile.calibrationBaseWeight === undefined) {
          parsedProfile.calibrationBaseWeight = parsedProfile.weight;
          needsSave = true;
        }
        
        // Migration: Add water tracking fields if missing
        if (parsedProfile.waterTrackingEnabled === undefined) {
          parsedProfile.waterTrackingEnabled = false;
          needsSave = true;
        }
        if (!parsedProfile.dailyWaterGoalMl) {
          parsedProfile.dailyWaterGoalMl = 2500;
          needsSave = true;
        }
        if (!parsedProfile.waterUnit) {
          parsedProfile.waterUnit = 'ml';
          needsSave = true;
        }
        
        // Migration: Add createdAt if missing (use lastWeightUpdate as fallback)
        if (!parsedProfile.createdAt) {
          parsedProfile.createdAt = parsedProfile.lastWeightUpdate || Date.now();
          needsSave = true;
        }
        
        // Auto-increment age on January 1st each year
        const currentYear = new Date().getFullYear();
        if (parsedProfile.ageLastUpdatedYear < currentYear) {
          const yearsToAdd = currentYear - parsedProfile.ageLastUpdatedYear;
          parsedProfile.age += yearsToAdd;
          parsedProfile.ageLastUpdatedYear = currentYear;
          // Recalculate BMR with new age
          let newBmr = (10 * parsedProfile.weight) + (6.25 * parsedProfile.height) - (5 * parsedProfile.age);
          if (parsedProfile.gender === 'male') {
            newBmr += 5;
          } else {
            newBmr -= 161;
          }
          parsedProfile.bmr = Math.round(newBmr);
          parsedProfile.tdee = Math.round(newBmr * ACTIVITY_MULTIPLIERS[parsedProfile.activityLevel]);
          needsSave = true;
        }
        
        // Migration: Reset activityLevel to Sedentary if different (exercise now tracked separately)
        if (parsedProfile.activityLevel !== ActivityLevel.Sedentary) {
          parsedProfile.activityLevel = ActivityLevel.Sedentary;
          // Recalculate BMR/TDEE with Sedentary multiplier
          let newBmr = (10 * parsedProfile.weight) + (6.25 * parsedProfile.height) - (5 * parsedProfile.age);
          if (parsedProfile.gender === 'male') {
            newBmr += 5;
          } else {
            newBmr -= 161;
          }
          parsedProfile.bmr = Math.round(newBmr);
          parsedProfile.tdee = Math.round(newBmr * ACTIVITY_MULTIPLIERS[ActivityLevel.Sedentary]);
          needsSave = true;
        }
        
        // Save migrated profile if needed
        if (needsSave) {
          localStorage.setItem(`smartcalorie_profile_${currentUserId}`, JSON.stringify(parsedProfile));
        }
        
        setProfile(parsedProfile);
        setView('dashboard');
      }
      if (storedLogs) {
        const parsedLogs: MealLog[] = JSON.parse(storedLogs);
        setLogs(parsedLogs);
        
        // Migration: Move inline base64 images from localStorage to IndexedDB
        // Check if any logs still have data: URLs (legacy format)
        const hasInlineImages = parsedLogs.some(log => log.imageUrl && log.imageUrl.startsWith('data:'));
        if (hasInlineImages) {
          console.log('[ImageMigration] Found inline base64 images, migrating to IndexedDB...');
          migrateLogsToIdb(parsedLogs).then(({ updatedLogs, migrated }) => {
            if (migrated > 0) {
              console.log(`[ImageMigration] Migrated ${migrated} images to IndexedDB`);
              setLogs(updatedLogs as MealLog[]);
              // The logs save effect will persist the updated refs to localStorage
            }
          }).catch(err => {
            console.error('[ImageMigration] Failed to migrate images:', err);
          });
        }
      } else {
        setLogs([]);
      }
      if (storedExerciseLogs) {
        setExerciseLogs(JSON.parse(storedExerciseLogs));
      } else {
        setExerciseLogs([]);
      }
      if (storedWaterLogs) {
        setWaterLogs(JSON.parse(storedWaterLogs));
      } else {
        setWaterLogs([]);
      }
      
      // Load impact history
      const storedImpactHistory = localStorage.getItem(`smartcalorie_impact_${currentUserId}`);
      if (storedImpactHistory) {
        setImpactHistory(JSON.parse(storedImpactHistory));
      } else {
        setImpactHistory([]);
      }
    } catch (e) {
      console.error("Failed to load user data", e);
    }
  }, [currentUserId]);

  // Catch-up logic: Backfill missing days in impact history
  useEffect(() => {
    if (!currentUserId || !profile || logs.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = formatDateKey(today);

    // Find the earliest log date, but never before user's createdAt
    const allTimestamps = [...logs.map(l => l.timestamp), ...exerciseLogs.map(l => l.timestamp)];
    if (allTimestamps.length === 0) return;
    
    const earliestLogTime = Math.min(...allTimestamps);
    const createdAtDay = new Date(profile.createdAt || Date.now());
    createdAtDay.setHours(0, 0, 0, 0);
    
    // Start from the later of: earliest log date or user registration date
    const startTime = Math.max(earliestLogTime, createdAtDay.getTime());
    const earliestLog = new Date(startTime);
    earliestLog.setHours(0, 0, 0, 0);

    // Calculate daily impact for a specific date
    const calculateDailyImpact = (date: Date): number | null => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMealLogs = logs.filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());
      const dayExerciseLogsFiltered = exerciseLogs.filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());

      // Skip days with no logs (Option A)
      if (dayMealLogs.length === 0 && dayExerciseLogsFiltered.length === 0) {
        return null;
      }

      const dayMealCalories = dayMealLogs.reduce((acc, log) => acc + log.totalCalories, 0);
      const dayExerciseCalories = dayExerciseLogsFiltered.reduce((acc, log) => acc + log.caloriesBurned, 0);

      const netCalories = dayMealCalories - profile.bmr - dayExerciseCalories;
      return netCalories / CALORIES_PER_KG_FAT;
    };

    // Build set of existing dates in history
    const existingDates = new Set(impactHistory.map(r => r.date));

    // Check for missing dates between earliest log and yesterday
    const newRecords: DailyImpactRecord[] = [];
    const current = new Date(earliestLog);
    
    while (current < today) {
      const dateKey = formatDateKey(current);
      
      // Only add if not already in history and not today
      if (!existingDates.has(dateKey)) {
        const impact = calculateDailyImpact(current);
        if (impact !== null) {
          newRecords.push({
            date: dateKey,
            impactKg: impact,
          });
        }
      }
      
      current.setDate(current.getDate() + 1);
    }

    // If we have new records, add them to history
    if (newRecords.length > 0) {
      setImpactHistory(prev => {
        const combined = [...prev, ...newRecords];
        // Sort by date and keep only last 365 days (max)
        combined.sort((a, b) => a.date.localeCompare(b.date));
        return combined.slice(-365);
      });
    }
  }, [currentUserId, profile, logs, exerciseLogs]);

  // Save User Data
  useEffect(() => {
    if (currentUserId && profile) {
      localStorage.setItem(`smartcalorie_profile_${currentUserId}`, JSON.stringify(profile));
    }
  }, [profile, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`smartcalorie_logs_${currentUserId}`, JSON.stringify(logs));
    }
  }, [logs, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`smartcalorie_exercise_${currentUserId}`, JSON.stringify(exerciseLogs));
    }
  }, [exerciseLogs, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`smartcalorie_water_${currentUserId}`, JSON.stringify(waterLogs));
    }
  }, [waterLogs, currentUserId]);

  useEffect(() => {
    if (currentUserId && impactHistory.length > 0) {
      localStorage.setItem(`smartcalorie_impact_${currentUserId}`, JSON.stringify(impactHistory));
    }
  }, [impactHistory, currentUserId]);

  // Actions
  const handleProfileCreate = (data: Omit<UserProfile, 'id' | 'avatarColor'>) => {
    const newId = `user_${Date.now()}`;
    const color = getRandomColor();
    const newProfile: UserProfile = { ...data, id: newId, avatarColor: color };
    
    // Save Profile
    localStorage.setItem(`smartcalorie_profile_${newId}`, JSON.stringify(newProfile));
    
    // Update Users List
    const newUserSummary: UserSummary = { id: newId, name: data.name, avatarColor: color };
    const updatedUsers = [...users, newUserSummary];
    setUsers(updatedUsers);
    localStorage.setItem('smartcalorie_users', JSON.stringify(updatedUsers));

    // Login
    setCurrentUserId(newId);
    setProfile(newProfile);
    setLogs([]);
    setExerciseLogs([]);
    setWaterLogs([]);
    setImpactHistory([]);
    setView('dashboard');
  };

  const handleLogWater = (log: WaterLog) => {
    setWaterLogs(prev => [...prev, log]);
  };

  const handleDeleteWaterLog = (logId: string) => {
    if (window.confirm("Are you sure you want to delete this water log?")) {
      setWaterLogs(prev => prev.filter(log => log.id !== logId));
    }
  };

  const handleLogMeal = (log: MealLog) => {
    setLogs(prev => [...prev, log]);
  };

  const handleLogExercise = (log: ExerciseLog) => {
    setExerciseLogs(prev => [...prev, log]);
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm("Are you sure you want to delete this meal log?")) {
      // Delete associated image from IndexedDB if it exists
      const logToDelete = logs.find(log => log.id === logId);
      if (logToDelete?.imageUrl && isIdbRef(logToDelete.imageUrl)) {
        deleteImage(getIdbKey(logToDelete.imageUrl));
      }
      setLogs(prev => prev.filter(log => log.id !== logId));
    }
  };

  const handleDeleteExerciseLog = (logId: string) => {
    if (window.confirm("Are you sure you want to delete this exercise log?")) {
      setExerciseLogs(prev => prev.filter(log => log.id !== logId));
    }
  };

  const handleUpdateWeight = (newWeight: number) => {
    if (!profile) return;
    
    // Use calibrationBaseWeight as the baseline for actual change calculation
    const baseWeight = profile.calibrationBaseWeight ?? profile.weight;
    const actualChange = newWeight - baseWeight;
    
    // Calculate duration-based day gap for calibration confidence
    const lastUpdate = profile.lastWeightUpdate || Date.now();
    const gapHours = (Date.now() - lastUpdate) / (1000 * 60 * 60);
    const dayGap = Math.floor(gapHours / 24);
    
    // Recalculate BMR/TDEE with new weight (always done regardless of dayGap)
    let newBmr = (10 * newWeight) + (6.25 * profile.height) - (5 * profile.age);
    if (profile.gender === 'male') {
      newBmr += 5;
    } else {
      newBmr -= 161;
    }
    const newTdee = newBmr * ACTIVITY_MULTIPLIERS[profile.activityLevel];
    
    // dayGap === 0: Too short for reliable calibration (< 24 hours)
    // Save weight for display + BMR recalc, but don't calibrate or move baseline
    if (dayGap === 0) {
      console.log('Weight Update (no calibration, dayGap=0):', {
        baseWeight,
        newWeight,
        gapHours: gapHours.toFixed(1),
        dayGap,
        calibrationFactor: profile.calibrationFactor,
      });
      
      setProfile({
        ...profile,
        weight: newWeight,
        bmr: Math.round(newBmr),
        tdee: Math.round(newTdee),
        // Do NOT update lastWeightUpdate or calibrationBaseWeight — gap keeps accumulating
      });
      return;
    }
    
    // dayGap >= 1: Proceed with calibration
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate cumulative predicted impact since last weight update
    let predictedChange = 0;
    const startOfUpdateDay = new Date(lastUpdate);
    startOfUpdateDay.setHours(0, 0, 0, 0);
    
    const current = new Date(startOfUpdateDay);
    const effectiveBmr = profile.bmr * (profile.calibrationFactor || 1.0);
    
    // Track total BMR burned across the period for calibration
    let totalBmrBurned = 0;
    
    // Get impact records for the period
    const recordsInPeriod: { date: string; impact: number }[] = [];
    
    while (current <= today) {
      const dateKey = formatDateKey(current);
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayMealCalories = logs
        .filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime())
        .reduce((acc, log) => acc + log.totalCalories, 0);
      
      const dayExerciseCalories = exerciseLogs
        .filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime())
        .reduce((acc, log) => acc + log.caloriesBurned, 0);
      
      // Check if this day has any logs
      const hasLogs = logs.some(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime()) ||
                      exerciseLogs.some(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());
      
      // Calculate BMR for this day (needed for both impact tracking and calibration)
      let bmrBurned: number;
      const lastUpdateDate = new Date(lastUpdate);
      const isFirstDay = current.getDate() === lastUpdateDate.getDate() &&
                         current.getMonth() === lastUpdateDate.getMonth() &&
                         current.getFullYear() === lastUpdateDate.getFullYear();
      const isToday = current.getDate() === new Date().getDate() &&
                     current.getMonth() === new Date().getMonth() &&
                     current.getFullYear() === new Date().getFullYear();
      
      if (isFirstDay && isToday) {
        const hoursElapsed = (Date.now() - lastUpdate) / (1000 * 60 * 60);
        bmrBurned = Math.round((effectiveBmr / 24) * Math.max(0, hoursElapsed));
      } else if (isFirstDay) {
        const endOfFirstDay = new Date(lastUpdate);
        endOfFirstDay.setHours(23, 59, 59, 999);
        const hoursElapsed = (endOfFirstDay.getTime() - lastUpdate) / (1000 * 60 * 60);
        bmrBurned = Math.round((effectiveBmr / 24) * hoursElapsed);
      } else if (isToday) {
        const now = new Date();
        const dayProgress = (now.getHours() + now.getMinutes() / 60) / 24;
        bmrBurned = Math.round(effectiveBmr * dayProgress);
      } else {
        bmrBurned = effectiveBmr;
      }

      if (hasLogs) {
        const dayImpact = (dayMealCalories - bmrBurned - dayExerciseCalories) / CALORIES_PER_KG_FAT;
        predictedChange += dayImpact;
        totalBmrBurned += bmrBurned;
        recordsInPeriod.push({ date: dateKey, impact: dayImpact });
      }
      // No-log days: assume net calories = 0 (user forgot to log), no contribution to prediction or calibration
      
      current.setDate(current.getDate() + 1);
    }
    
    // Calculate calibration error (using calibrationBaseWeight, not display weight)
    const predictionError = predictedChange - actualChange; // Positive = overpredicted weight gain
    
    // Duration-aware smoothing ratio:
    // dayGap=1 → newRatio=0.1 (very conservative, 1 day is still noisy)
    // dayGap=2 → newRatio=0.2
    // dayGap=3 → newRatio=0.3
    // dayGap=4 → newRatio=0.4
    // dayGap≥5 → newRatio=0.5 (capped, max trust in new signal)
    const newRatio = Math.min(dayGap * 0.1, 0.5);
    const oldRatio = 1 - newRatio;
    
    // Update calibration factor using BMR-based correction
    let newCalibrationFactor = profile.calibrationFactor || 1.0;
    if (totalBmrBurned > 0) {
      const bmrCorrectionRatio = 1 + (predictedChange - actualChange) * CALORIES_PER_KG_FAT / totalBmrBurned;
      const thisMeasurementFactor = newCalibrationFactor * bmrCorrectionRatio;
      
      // Only calibrate when the implied BMR change is significant (>5%)
      if (Math.abs(bmrCorrectionRatio - 1) > 0.05) {
        // Clamp to reasonable range (0.5 to 1.5)
        const clampedFactor = Math.max(0.5, Math.min(1.5, thisMeasurementFactor));
        // Duration-aware exponential smoothing
        newCalibrationFactor = oldRatio * newCalibrationFactor + newRatio * clampedFactor;
      }
    }
    
    // Correct historical impact records
    if (recordsInPeriod.length > 0 && Math.abs(predictionError) > 0.001) {
      const correctionPerDay = predictionError / recordsInPeriod.length;
      
      setImpactHistory(prev => {
        const updated = prev.map(record => {
          const recordInPeriod = recordsInPeriod.find(r => r.date === record.date);
          if (recordInPeriod) {
            return {
              ...record,
              impactKg: record.impactKg - correctionPerDay,
            };
          }
          return record;
        });
        return updated;
      });
    }

    setProfile({
      ...profile,
      weight: newWeight,
      bmr: Math.round(newBmr),
      tdee: Math.round(newTdee),
      lastWeightUpdate: Date.now(),
      calibrationFactor: newCalibrationFactor,
      calibrationBaseWeight: newWeight, // Reset baseline on successful calibration
    });
    
    // Log calibration info for debugging
    console.log('Weight Calibration:', {
      baseWeight,
      newWeight,
      actualChange,
      predictedChange,
      predictionError,
      totalBmrBurned,
      dayGap,
      smoothingRatio: `${oldRatio.toFixed(1)}/${newRatio.toFixed(1)}`,
      oldCalibrationFactor: profile.calibrationFactor,
      newCalibrationFactor,
      daysAffected: recordsInPeriod.length,
    });
  };

  const handleEditProfile = (updates: Partial<UserProfile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const handleResetProfile = () => {
    if (!currentUserId) return;
    if(window.confirm("Delete this profile? This cannot be undone.")) {
        // Delete all images from IndexedDB for this user's meals
        const imageIds = logs
          .filter(log => log.imageUrl && isIdbRef(log.imageUrl))
          .map(log => getIdbKey(log.imageUrl!));
        if (imageIds.length > 0) {
          deleteImages(imageIds);
        }
        
        // Remove data
        localStorage.removeItem(`smartcalorie_profile_${currentUserId}`);
        localStorage.removeItem(`smartcalorie_logs_${currentUserId}`);
        localStorage.removeItem(`smartcalorie_exercise_${currentUserId}`);
        localStorage.removeItem(`smartcalorie_water_${currentUserId}`);
        localStorage.removeItem(`smartcalorie_impact_${currentUserId}`);
        
        // Remove from users list
        const updatedUsers = users.filter(u => u.id !== currentUserId);
        setUsers(updatedUsers);
        localStorage.setItem('smartcalorie_users', JSON.stringify(updatedUsers));
        
        setCurrentUserId(null);
        setProfile(null);
        setLogs([]);
        setExerciseLogs([]);
        setWaterLogs([]);
        setImpactHistory([]);
        
        // After deletion, redirect to onboarding
        setView('onboarding');
    }
  };

  // Views
  if (view === 'loading') {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (view === 'user-select') {
    return (
      <UserSelector 
        users={users} 
        onSelectUser={(id) => setCurrentUserId(id)}
        onAddUser={() => setView('onboarding')}
      />
    );
  }

  if (view === 'onboarding') {
    return (
      <Onboarding 
        onComplete={handleProfileCreate} 
        onCancel={users.length > 0 ? () => setView('user-select') : undefined}
      />
    );
  }

  if (view === 'dashboard' && profile) {
    return (
      <div className="min-h-screen bg-white md:bg-gray-50 md:flex md:justify-center">
        <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative">
          <Dashboard
            profile={profile}
            logs={logs}
            exerciseLogs={exerciseLogs}
            waterLogs={waterLogs}
            impactHistory={impactHistory}
            onOpenLogger={() => setShowLogger(true)}
            onOpenExerciseLogger={() => setShowExerciseLogger(true)}
            onOpenWaterTracker={() => setShowWaterTracker(true)}
            onUpdateWeight={(suggested) => {
              setSuggestedWeight(suggested);
              setShowWeightInput(true);
            }}
            onEditProfile={() => setShowProfileEditor(true)}
            onReset={handleResetProfile}
            onDeleteLog={handleDeleteLog}
            onDeleteExerciseLog={handleDeleteExerciseLog}
            onDeleteWaterLog={handleDeleteWaterLog}
          />

          {showLogger && (
            <MealLogger
              onLogMeal={handleLogMeal}
              onClose={() => setShowLogger(false)}
            />
          )}

          {showExerciseLogger && (
            <ExerciseLogger
              onLogExercise={handleLogExercise}
              onClose={() => setShowExerciseLogger(false)}
            />
          )}

          {showWaterTracker && (
            <WaterTracker
              waterUnit={profile.waterUnit || 'ml'}
              dailyGoalMl={profile.dailyWaterGoalMl || 2500}
              todayLogs={waterLogs.filter(log => {
                const today = new Date();
                const logDate = new Date(log.timestamp);
                return logDate.getDate() === today.getDate() &&
                       logDate.getMonth() === today.getMonth() &&
                       logDate.getFullYear() === today.getFullYear();
              })}
              onLogWater={handleLogWater}
              onClose={() => setShowWaterTracker(false)}
            />
          )}

          {showWeightInput && (
            <WeightInput
              currentWeight={suggestedWeight ?? profile.weight}
              weightUnit={profile.weightUnit}
              onSave={handleUpdateWeight}
              onClose={() => {
                setShowWeightInput(false);
                setSuggestedWeight(null);
              }}
            />
          )}

          {showProfileEditor && (
            <ProfileEditor
              profile={profile}
              onSave={handleEditProfile}
              onClose={() => setShowProfileEditor(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default App;