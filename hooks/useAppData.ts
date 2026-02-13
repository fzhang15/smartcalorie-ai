/**
 * Custom hook that manages all application data:
 * - User list & current user selection
 * - Profile loading, migration, and persistence
 * - Meal logs, exercise logs, water logs, impact history
 * - LocalStorage persistence (auto-save on change)
 * - Legacy data migrations (single-user → multi-user, base64 → IndexedDB)
 * - Impact history backfill
 * - Weight calibration
 * - CRUD actions for all data types
 *
 * Extracted from App.tsx for separation of concerns.
 */

import { useState, useEffect } from 'react';
import { UserProfile, MealLog, UserSummary, ExerciseLog, DailyImpactRecord, WaterLog } from '../types';
import { CALORIES_PER_KG_FAT } from '../constants';
import { deleteImage, deleteImages, isIdbRef, getIdbKey, migrateLogsToIdb } from '../services/imageStore';
import { formatDateKey } from '../utils/dateUtils';
import { getRandomColor, migrateProfile } from '../utils/profileUtils';
import { calibrateWeight } from '../utils/calibration';

export type AppView = 'loading' | 'user-select' | 'onboarding' | 'dashboard';

export interface AppActions {
  handleProfileCreate: (data: Omit<UserProfile, 'id' | 'avatarColor'>) => void;
  handleLogMeal: (log: MealLog) => void;
  handleEditMealLog: (logId: string, updates: Partial<MealLog>) => void;
  handleLogExercise: (log: ExerciseLog) => void;
  handleLogWater: (log: WaterLog) => void;
  handleDeleteLog: (logId: string) => void;
  handleDeleteExerciseLog: (logId: string) => void;
  handleDeleteWaterLog: (logId: string) => void;
  handleUpdateWeight: (newWeight: number) => void;
  handleEditProfile: (updates: Partial<UserProfile>) => void;
  handleResetProfile: () => void;
  setCurrentUserId: (id: string) => void;
  setView: (view: AppView) => void;
}

export interface AppData {
  users: UserSummary[];
  currentUserId: string | null;
  profile: UserProfile | null;
  logs: MealLog[];
  exerciseLogs: ExerciseLog[];
  waterLogs: WaterLog[];
  impactHistory: DailyImpactRecord[];
  view: AppView;
  actions: AppActions;
}

export function useAppData(): AppData {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [impactHistory, setImpactHistory] = useState<DailyImpactRecord[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [view, setView] = useState<AppView>('loading');

  // ─── Initialization & Legacy Migration ────────────────────────────

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('smartcalorie_users');

      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        setUsers(parsedUsers);
        if (parsedUsers.length === 1) {
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

          const newId = `user_${Date.now()}`;
          const newProfile: UserProfile = { ...parsedProfile, id: newId, avatarColor: getRandomColor() };
          const newUsers: UserSummary[] = [{ id: newId, name: newProfile.name, avatarColor: newProfile.avatarColor! }];

          localStorage.setItem('smartcalorie_users', JSON.stringify(newUsers));
          localStorage.setItem(`smartcalorie_profile_${newId}`, JSON.stringify(newProfile));
          if (oldLogs) {
            localStorage.setItem(`smartcalorie_logs_${newId}`, oldLogs);
          }

          localStorage.removeItem('smartcalorie_profile');
          localStorage.removeItem('smartcalorie_logs');

          setUsers(newUsers);
          setCurrentUserId(newId);
        } else {
          setView('onboarding');
        }
      }
    } catch (e) {
      console.error("Initialization error", e);
      localStorage.clear();
      setView('onboarding');
    }
  }, []);

  // ─── Load User Data ───────────────────────────────────────────────

  useEffect(() => {
    if (!currentUserId) return;

    try {
      const storedProfile = localStorage.getItem(`smartcalorie_profile_${currentUserId}`);
      const storedLogs = localStorage.getItem(`smartcalorie_logs_${currentUserId}`);
      const storedExerciseLogs = localStorage.getItem(`smartcalorie_exercise_${currentUserId}`);
      const storedWaterLogs = localStorage.getItem(`smartcalorie_water_${currentUserId}`);

      if (storedProfile) {
        const parsed: UserProfile = JSON.parse(storedProfile);
        const { profile: migratedProfile, needsSave } = migrateProfile(parsed);

        if (needsSave) {
          localStorage.setItem(`smartcalorie_profile_${currentUserId}`, JSON.stringify(migratedProfile));
        }

        setProfile(migratedProfile);
        setView('dashboard');
      }

      if (storedLogs) {
        const parsedLogs: MealLog[] = JSON.parse(storedLogs);
        setLogs(parsedLogs);

        // Migration: Move inline base64 images to IndexedDB
        const hasInlineImages = parsedLogs.some(log => log.imageUrl && log.imageUrl.startsWith('data:'));
        if (hasInlineImages) {
          console.log('[ImageMigration] Found inline base64 images, migrating to IndexedDB...');
          migrateLogsToIdb(parsedLogs).then(({ updatedLogs, migrated }) => {
            if (migrated > 0) {
              console.log(`[ImageMigration] Migrated ${migrated} images to IndexedDB`);
              setLogs(updatedLogs as MealLog[]);
            }
          }).catch(err => {
            console.error('[ImageMigration] Failed to migrate images:', err);
          });
        }
      } else {
        setLogs([]);
      }

      setExerciseLogs(storedExerciseLogs ? JSON.parse(storedExerciseLogs) : []);
      setWaterLogs(storedWaterLogs ? JSON.parse(storedWaterLogs) : []);

      const storedImpactHistory = localStorage.getItem(`smartcalorie_impact_${currentUserId}`);
      setImpactHistory(storedImpactHistory ? JSON.parse(storedImpactHistory) : []);
    } catch (e) {
      console.error("Failed to load user data", e);
    }
  }, [currentUserId]);

  // ─── Impact History Backfill ──────────────────────────────────────

  useEffect(() => {
    if (!currentUserId || !profile || logs.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTimestamps = [...logs.map(l => l.timestamp), ...exerciseLogs.map(l => l.timestamp)];
    if (allTimestamps.length === 0) return;

    const earliestLogTime = Math.min(...allTimestamps);
    const createdAtDay = new Date(profile.createdAt || Date.now());
    createdAtDay.setHours(0, 0, 0, 0);

    const startTime = Math.max(earliestLogTime, createdAtDay.getTime());
    const earliestLog = new Date(startTime);
    earliestLog.setHours(0, 0, 0, 0);

    const calculateDailyImpact = (date: Date): number | null => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMealLogs = logs.filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());
      const dayExerciseLogsFiltered = exerciseLogs.filter(log => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime());

      if (dayMealLogs.length === 0 && dayExerciseLogsFiltered.length === 0) return null;

      const dayMealCalories = dayMealLogs.reduce((acc, log) => acc + log.totalCalories, 0);
      const dayExerciseCalories = dayExerciseLogsFiltered.reduce((acc, log) => acc + log.caloriesBurned, 0);

      const netCalories = dayMealCalories - profile.bmr - dayExerciseCalories;
      return netCalories / CALORIES_PER_KG_FAT;
    };

    const existingDates = new Set(impactHistory.map(r => r.date));
    const newRecords: DailyImpactRecord[] = [];
    const current = new Date(earliestLog);

    while (current < today) {
      const dateKey = formatDateKey(current);
      if (!existingDates.has(dateKey)) {
        const impact = calculateDailyImpact(current);
        if (impact !== null) {
          newRecords.push({ date: dateKey, impactKg: impact });
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (newRecords.length > 0) {
      setImpactHistory(prev => {
        const combined = [...prev, ...newRecords];
        combined.sort((a, b) => a.date.localeCompare(b.date));
        return combined.slice(-365);
      });
    }
  }, [currentUserId, profile, logs, exerciseLogs]);

  // ─── Auto-Save to LocalStorage ────────────────────────────────────

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

  // ─── Actions ──────────────────────────────────────────────────────

  const handleProfileCreate = (data: Omit<UserProfile, 'id' | 'avatarColor'>) => {
    const newId = `user_${Date.now()}`;
    const color = getRandomColor();
    const newProfile: UserProfile = { ...data, id: newId, avatarColor: color };

    localStorage.setItem(`smartcalorie_profile_${newId}`, JSON.stringify(newProfile));

    const newUserSummary: UserSummary = { id: newId, name: data.name, avatarColor: color };
    const updatedUsers = [...users, newUserSummary];
    setUsers(updatedUsers);
    localStorage.setItem('smartcalorie_users', JSON.stringify(updatedUsers));

    setCurrentUserId(newId);
    setProfile(newProfile);
    setLogs([]);
    setExerciseLogs([]);
    setWaterLogs([]);
    setImpactHistory([]);
    setView('dashboard');
  };

  const handleLogMeal = (log: MealLog) => {
    setLogs(prev => [...prev, log]);
  };

  const handleEditMealLog = (logId: string, updates: Partial<MealLog>) => {
    setLogs(prev => {
      const updatedLogs = prev.map(log => {
        if (log.id !== logId) return log;
        const updated = { ...log, ...updates };
        // Recalculate totalCalories from items if items were updated
        if (updates.items) {
          updated.totalCalories = updates.items.reduce((acc, item) => acc + item.calories, 0);
        }
        return updated;
      });

      // Recalculate impact history for the affected day if it's a past day
      const editedLog = updatedLogs.find(l => l.id === logId);
      if (editedLog && profile) {
        const logDate = new Date(editedLog.timestamp);
        const today = new Date();
        const isToday = logDate.getDate() === today.getDate() &&
                        logDate.getMonth() === today.getMonth() &&
                        logDate.getFullYear() === today.getFullYear();

        if (!isToday) {
          // Past day: recalculate impact for that date
          const dateKey = formatDateKey(logDate);
          const dayStart = new Date(logDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(logDate);
          dayEnd.setHours(23, 59, 59, 999);

          const dayMealCalories = updatedLogs
            .filter(l => l.timestamp >= dayStart.getTime() && l.timestamp <= dayEnd.getTime())
            .reduce((acc, l) => acc + l.totalCalories, 0);
          const dayExerciseCalories = exerciseLogs
            .filter(l => l.timestamp >= dayStart.getTime() && l.timestamp <= dayEnd.getTime())
            .reduce((acc, l) => acc + l.caloriesBurned, 0);

          const netCalories = dayMealCalories - profile.bmr - dayExerciseCalories;
          const newImpact = netCalories / CALORIES_PER_KG_FAT;

          setImpactHistory(prev => prev.map(record =>
            record.date === dateKey ? { ...record, impactKg: newImpact } : record
          ));
        }
      }

      return updatedLogs;
    });
  };

  const handleLogExercise = (log: ExerciseLog) => {
    setExerciseLogs(prev => [...prev, log]);
  };

  const handleLogWater = (log: WaterLog) => {
    setWaterLogs(prev => [...prev, log]);
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm("Are you sure you want to delete this meal log?")) {
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

  const handleDeleteWaterLog = (logId: string) => {
    if (window.confirm("Are you sure you want to delete this water log?")) {
      setWaterLogs(prev => prev.filter(log => log.id !== logId));
    }
  };

  const handleUpdateWeight = (newWeight: number) => {
    if (!profile) return;

    const { updatedProfile, impactCorrections } = calibrateWeight(profile, logs, exerciseLogs, newWeight);

    // Apply impact history corrections if any
    if (impactCorrections) {
      setImpactHistory(prev => {
        return prev.map(record => {
          const correction = impactCorrections.find(c => c.date === record.date);
          if (correction) {
            return { ...record, impactKg: record.impactKg - correction.correctionPerDay };
          }
          return record;
        });
      });
    }

    setProfile(updatedProfile);
  };

  const handleEditProfile = (updates: Partial<UserProfile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const handleResetProfile = () => {
    if (!currentUserId) return;
    if (window.confirm("Delete this profile? This cannot be undone.")) {
      // Delete all images from IndexedDB for this user's meals
      const imageIds = logs
        .filter(log => log.imageUrl && isIdbRef(log.imageUrl))
        .map(log => getIdbKey(log.imageUrl!));
      if (imageIds.length > 0) {
        deleteImages(imageIds);
      }

      localStorage.removeItem(`smartcalorie_profile_${currentUserId}`);
      localStorage.removeItem(`smartcalorie_logs_${currentUserId}`);
      localStorage.removeItem(`smartcalorie_exercise_${currentUserId}`);
      localStorage.removeItem(`smartcalorie_water_${currentUserId}`);
      localStorage.removeItem(`smartcalorie_impact_${currentUserId}`);

      const updatedUsers = users.filter(u => u.id !== currentUserId);
      setUsers(updatedUsers);
      localStorage.setItem('smartcalorie_users', JSON.stringify(updatedUsers));

      setCurrentUserId(null);
      setProfile(null);
      setLogs([]);
      setExerciseLogs([]);
      setWaterLogs([]);
      setImpactHistory([]);
      setView('onboarding');
    }
  };

  return {
    users,
    currentUserId,
    profile,
    logs,
    exerciseLogs,
    waterLogs,
    impactHistory,
    view,
    actions: {
      handleProfileCreate,
      handleLogMeal,
      handleEditMealLog,
      handleLogExercise,
      handleLogWater,
      handleDeleteLog,
      handleDeleteExerciseLog,
      handleDeleteWaterLog,
      handleUpdateWeight,
      handleEditProfile,
      handleResetProfile,
      setCurrentUserId,
      setView,
    },
  };
}
