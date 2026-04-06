import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, History, Bell, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  
  const navItems = [
    { name: 'Halls', path: '/halls', icon: <Building2 size={20} /> },
    { name: 'Revenue Tracking', path: '/revenue', icon: <LayoutDashboard size={20} /> },
    { name: 'Booking History', path: '/bookings', icon: <History size={20} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-surface-800 border-r border-white/5 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm">
          <Building2 size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-brand">
          VenueAdmin
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400 font-medium border border-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
