import React, { useState } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import WeightInput from './components/WeightInput';
import UserSelector from './components/UserSelector';
import ExerciseLogger from './components/ExerciseLogger';
import WaterTracker from './components/WaterTracker';
import ProfileEditor from './components/ProfileEditor';
import { useAppData } from './hooks/useAppData';

const App: React.FC = () => {
  const {
    users, profile, logs, exerciseLogs, waterLogs, impactHistory, view,
    actions,
  } = useAppData();

  // UI State (modal visibility — stays in App since it's purely presentational)
  const [showLogger, setShowLogger] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [suggestedWeight, setSuggestedWeight] = useState<number | null>(null);
  const [showExerciseLogger, setShowExerciseLogger] = useState(false);
  const [showWaterTracker, setShowWaterTracker] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Views
  if (view === 'loading') {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (view === 'user-select') {
    return (
      <UserSelector 
        users={users} 
        onSelectUser={(id) => actions.setCurrentUserId(id)}
        onAddUser={() => actions.setView('onboarding')}
      />
    );
  }

  if (view === 'onboarding') {
    return (
      <Onboarding 
        onComplete={actions.handleProfileCreate} 
        onCancel={users.length > 0 ? () => actions.setView('user-select') : undefined}
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
            onReset={actions.handleResetProfile}
            onDeleteLog={actions.handleDeleteLog}
            onDeleteExerciseLog={actions.handleDeleteExerciseLog}
            onDeleteWaterLog={actions.handleDeleteWaterLog}
          />

          {showLogger && (
            <MealLogger
              onLogMeal={actions.handleLogMeal}
              onClose={() => setShowLogger(false)}
            />
          )}

          {showExerciseLogger && (
            <ExerciseLogger
              onLogExercise={actions.handleLogExercise}
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
              onLogWater={actions.handleLogWater}
              onClose={() => setShowWaterTracker(false)}
            />
          )}

          {showWeightInput && (
            <WeightInput
              currentWeight={suggestedWeight ?? profile.weight}
              weightUnit={profile.weightUnit}
              onSave={actions.handleUpdateWeight}
              onClose={() => {
                setShowWeightInput(false);
                setSuggestedWeight(null);
              }}
            />
          )}

          {showProfileEditor && (
            <ProfileEditor
              profile={profile}
              onSave={actions.handleEditProfile}
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
