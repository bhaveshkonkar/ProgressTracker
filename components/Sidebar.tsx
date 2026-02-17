import React from 'react';
import { LayoutDashboard, FolderPlus, User, LogOut } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../services/api';

interface SidebarProps {
  currentUser: UserType;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, activePage, onNavigate }) => {
  return (
    <div className="w-20 md:w-64 bg-surface border-r border-border h-screen flex flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300">
      <div>
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center">
            <span className="font-bold text-white text-lg">S</span>
          </div>
          <span className="hidden md:block ml-3 font-bold text-xl tracking-tight">Streak</span>
        </div>

        <nav className="mt-8 px-2 md:px-4 space-y-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center justify-center md:justify-start px-2 py-3 rounded-xl transition-colors ${
              activePage === 'dashboard' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard size={22} />
            <span className="hidden md:block ml-3 font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('create-project')}
            className={`w-full flex items-center justify-center md:justify-start px-2 py-3 rounded-xl transition-colors ${
              activePage === 'create-project' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FolderPlus size={22} />
            <span className="hidden md:block ml-3 font-medium">New Project</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center justify-center md:justify-start px-2 py-3 rounded-xl transition-colors ${
              activePage === 'profile' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User size={22} />
            <span className="hidden md:block ml-3 font-medium">Profile</span>
          </button>
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-center md:justify-start p-2 rounded-xl bg-white/5 mb-2">
          <img src={currentUser.avatarUrl} alt="User" className="w-8 h-8 rounded-full object-cover" />
          <div className="hidden md:block ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
            <p className="text-xs text-gray-500 flex items-center">
              <span className="text-orange-500 mr-1">🔥</span> {currentUser.streak} days
            </p>
          </div>
        </div>
        
        <button 
            onClick={() => api.signOut()}
            className="w-full flex items-center justify-center md:justify-start px-2 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
            <LogOut size={18} />
            <span className="hidden md:block ml-3 font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};