import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, CalendarDays, CreditCard,
  MessageSquareWarning, BarChart3, UserCheck, LogOut, Building,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/admin',               label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/admin/owners',        label: 'Owner Approvals', icon: UserCheck,       badge: 'pendingOwners' },
  { to: '/admin/users',         label: 'User Management', icon: Users },
  { to: '/admin/venues',        label: 'Hall Listings',   icon: Building2 },
  { to: '/admin/bookings',      label: 'Booking Monitor', icon: CalendarDays },
  { to: '/admin/transactions',  label: 'Transactions',    icon: CreditCard },
  { to: '/admin/disputes',      label: 'Disputes',        icon: MessageSquareWarning, badge: 'openDisputes' },
  { to: '/admin/reports',       label: 'Reports',         icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [badges, setBadges] = useState({ pendingOwners: 0, openDisputes: 0 });

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setBadges({
        pendingOwners: r.data.data.pendingOwners,
        openDisputes:  r.data.data.openDisputes,
      }))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-surface-800 border-r border-white/5 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
              <Building size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">VenueBook</p>
              <p className="text-slate-500 text-xs mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, badge, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                 ${isActive
                   ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                   : 'text-slate-400 hover:bg-surface-700 hover:text-slate-200'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    {label}
                  </span>
                  {badge && badges[badge] > 0 && (
                    <span className="bg-accent-rose text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {badges[badge]}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-300 text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full btn-danger justify-center py-2 text-xs">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
