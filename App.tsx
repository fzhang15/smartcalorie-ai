import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog, UserSummary } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import WeightInput from './components/WeightInput';
import UserSelector from './components/UserSelector';
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
  
  // UI State
  const [view, setView] = useState<'loading' | 'user-select' | 'onboarding' | 'dashboard'>('loading');
  const [showLogger, setShowLogger] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);

  // Initial Data Load & Migration Logic
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('smartcalorie_users');
      
      if (storedUsers) {
        // Multi-user system exists
        const parsedUsers = JSON.parse(storedUsers);
        setUsers(parsedUsers);
        if (parsedUsers.length > 0) {
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

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
        setView('dashboard');
      }
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        setLogs([]);
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
    setView('dashboard');
  };

  const handleLogMeal = (log: MealLog) => {
    setLogs(prev => [...prev, log]);
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
      tdee: Math.round(newTdee)
    });
  };

  const handleResetProfile = () => {
    if (!currentUserId) return;
    if(window.confirm("Delete this profile? This cannot be undone.")) {
        // Remove data
        localStorage.removeItem(`smartcalorie_profile_${currentUserId}`);
        localStorage.removeItem(`smartcalorie_logs_${currentUserId}`);
        
        // Remove from users list
        const updatedUsers = users.filter(u => u.id !== currentUserId);
        setUsers(updatedUsers);
        localStorage.setItem('smartcalorie_users', JSON.stringify(updatedUsers));
        
        setCurrentUserId(null);
        setProfile(null);
        
        if (updatedUsers.length > 0) {
            setView('user-select');
        } else {
            setView('onboarding');
        }
    }
  };

  const handleLogout = () => {
      setCurrentUserId(null);
      setProfile(null);
      setLogs([]);
      setView('user-select');
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
            onOpenLogger={() => setShowLogger(true)}
            onUpdateWeight={() => setShowWeightInput(true)}
            onReset={handleResetProfile}
            onSwitchUser={handleLogout}
          />

          {showLogger && (
            <MealLogger
              onLogMeal={handleLogMeal}
              onClose={() => setShowLogger(false)}
            />
          )}

          {showWeightInput && (
            <WeightInput
              currentWeight={profile.weight}
              onSave={handleUpdateWeight}
              onClose={() => setShowWeightInput(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default App;
