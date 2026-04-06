import React from 'react';
import { Bell, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const TopNavbar = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useApp();

  const displayName = profile?.name || user?.name || 'Owner';
  const displayEmail = profile?.email || user?.email || '';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-16 bg-surface-800/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20">
      {/* Left: page breadcrumb area */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="text-slate-600">/</span>
        <span>Owner Dashboard</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-lg hover:bg-surface-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-rose rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-glow-sm">
            {initials || <User size={16} />}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white leading-tight">{displayName}</p>
            <p className="text-xs text-slate-400 leading-tight">{displayEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="ml-2 w-8 h-8 rounded-lg hover:bg-accent-rose/10 flex items-center justify-center text-slate-400 hover:text-accent-rose transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;
