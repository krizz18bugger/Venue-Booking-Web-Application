import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Building, User, CalendarDays, Search, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CustomerNavbar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <nav className="bg-surface-800 border-b border-white/5 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/venues')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm">
            <Building size={16} className="text-white"/>
          </div>
          <span className="text-white font-bold text-sm hidden sm:block">VenueBook</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <NavLink to="/venues" className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'text-brand-300 bg-brand-600/10' : 'text-slate-400 hover:text-white hover:bg-surface-700'}`
          }>
            <Search size={14}/> Venues
          </NavLink>
          {user && (
            <>
              <NavLink to="/my-bookings" className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'text-brand-300 bg-brand-600/10' : 'text-slate-400 hover:text-white hover:bg-surface-700'}`
              }>
                <CalendarDays size={14}/> My Bookings
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'text-brand-300 bg-brand-600/10' : 'text-slate-400 hover:text-white hover:bg-surface-700'}`
              }>
                <User size={14}/> Profile
              </NavLink>
            </>
          )}
        </div>

        {/* User actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-slate-300 text-sm font-medium">{user.name?.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 text-sm transition-all">
                <LogOut size={14}/> <span className="hidden sm:block">Logout</span>
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/auth')} className="btn-primary text-xs py-1.5 px-3">Sign In</button>
          )}
        </div>
      </div>
    </nav>
  );
}
