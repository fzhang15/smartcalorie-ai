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
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-6 text-white">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-10">Who's eating?</h1>
        
        <div className="grid grid-cols-2 gap-6 justify-items-center">
          {users.map((user) => (
            <div 
              key={user.id} 
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => onSelectUser(user.id)}
            >
              <div className={`w-24 h-24 rounded-2xl mb-3 flex items-center justify-center text-3xl font-bold shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 border-2 border-transparent group-hover:border-white ${user.avatarColor || 'bg-brand-500'}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-300 font-medium group-hover:text-white">{user.name}</span>
            </div>
          ))}

          {/* Add User Button */}
          <div 
            className="flex flex-col items-center group cursor-pointer"
            onClick={onAddUser}
          >
            <div className="w-24 h-24 rounded-2xl mb-3 flex items-center justify-center bg-gray-800 text-gray-400 shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 border-2 border-transparent group-hover:border-white">
              <Plus size={40} />
            </div>
            <span className="text-gray-400 font-medium group-hover:text-white">Add Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
