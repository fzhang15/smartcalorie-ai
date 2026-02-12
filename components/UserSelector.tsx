import React from 'react';
import { UserSummary } from '../types';
import { Plus, User } from 'lucide-react';

interface UserSelectorProps {
  users: UserSummary[];
  onSelectUser: (userId: string) => void;
  onAddUser: () => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ users, onSelectUser, onAddUser }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full translate-y-1/2 translate-x-1/4" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-extrabold">S</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Who's eating?</h1>
          <p className="text-gray-500 text-sm">Select your profile to continue</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 justify-items-center">
          {users.map((user) => (
            <div 
              key={user.id} 
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => onSelectUser(user.id)}
            >
              <div className={`w-24 h-24 rounded-[1.25rem] mb-3 flex items-center justify-center text-3xl font-bold shadow-lg transition-all duration-200 group-hover:scale-105 group-active:scale-95 border-2 border-transparent group-hover:border-white/50 group-hover:shadow-xl ${user.avatarColor || 'bg-brand-500'}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{user.name}</span>
            </div>
          ))}

          {/* Add User Button */}
          <div 
            className="flex flex-col items-center group cursor-pointer"
            onClick={onAddUser}
          >
            <div className="w-24 h-24 rounded-[1.25rem] mb-3 flex items-center justify-center bg-gray-800/80 text-gray-400 shadow-lg transition-all duration-200 group-hover:scale-105 group-active:scale-95 border-2 border-dashed border-gray-700 group-hover:border-white/50 group-hover:text-white">
              <Plus size={36} />
            </div>
            <span className="text-gray-500 font-medium group-hover:text-white transition-colors">Add Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
