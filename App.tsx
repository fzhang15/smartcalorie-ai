import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog, UserSummary, ExerciseLog, ActivityLevel } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import WeightInput from './components/WeightInput';
import UserSelector from './components/UserSelector';
import ExerciseLogger from './components/ExerciseLogger';
import ProfileEditor from './components/ProfileEditor';
import { ACTIVITY_MULTIPLIERS } from './constants';

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
  'bg-pink-500', 'bg-rose-500'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const App: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  
  // UI State
  const [view, setView] = useState<'loading' | 'user-select' | 'onboarding' | 'dashboard'>('loading');
  const [showLogger, setShowLogger] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showExerciseLogger, setShowExerciseLogger] = useState(false);
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
        setLogs(JSON.parse(storedLogs));
      } else {
        setLogs([]);
      }
      if (storedExerciseLogs) {
        setExerciseLogs(JSON.parse(storedExerciseLogs));
      } else {
        setExerciseLogs([]);
      }
    } catch (e) {
      console.error("Failed to load user data", e);
    }
  }, [currentUserId]);

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
    setView('dashboard');
  };

  const handleLogMeal = (log: MealLog) => {
    setLogs(prev => [...prev, log]);
  };

  const handleLogExercise = (log: ExerciseLog) => {
    setExerciseLogs(prev => [...prev, log]);
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm("Are you sure you want to delete this meal log?")) {
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
    
    // Recalculate BMR/TDEE
    let newBmr = (10 * newWeight) + (6.25 * profile.height) - (5 * profile.age);
    if (profile.gender === 'male') {
      newBmr += 5;
    } else {
      newBmr -= 161;
    }
    const newTdee = newBmr * ACTIVITY_MULTIPLIERS[profile.activityLevel];

    setProfile({
      ...profile,
      weight: newWeight,
      bmr: Math.round(newBmr),
      tdee: Math.round(newTdee),
      lastWeightUpdate: Date.now(), // Reset weight prediction baseline
    });
  };

  const handleEditProfile = (updates: Partial<UserProfile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const handleResetProfile = () => {
    if (!currentUserId) return;
    if(window.confirm("Delete this profile? This cannot be undone.")) {
        // Remove data
        localStorage.removeItem(`smartcalorie_profile_${currentUserId}`);
        localStorage.removeItem(`smartcalorie_logs_${currentUserId}`);
        localStorage.removeItem(`smartcalorie_exercise_${currentUserId}`);
        
        // Remove from users list
        const updatedUsers = users.filter(u => u.id !== currentUserId);
        setUsers(updatedUsers);
        localStorage.setItem('smartcalorie_users', JSON.stringify(updatedUsers));
        
        setCurrentUserId(null);
        setProfile(null);
        setLogs([]);
        setExerciseLogs([]);
        
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
            onOpenLogger={() => setShowLogger(true)}
            onOpenExerciseLogger={() => setShowExerciseLogger(true)}
            onUpdateWeight={() => setShowWeightInput(true)}
            onEditProfile={() => setShowProfileEditor(true)}
            onReset={handleResetProfile}
            onDeleteLog={handleDeleteLog}
            onDeleteExerciseLog={handleDeleteExerciseLog}
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

          {showWeightInput && (
            <WeightInput
              currentWeight={profile.weight}
              onSave={handleUpdateWeight}
              onClose={() => setShowWeightInput(false)}
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