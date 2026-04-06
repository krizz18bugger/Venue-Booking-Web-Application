import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-surface-900 flex text-slate-200">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col relative">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-accent-violet/10 blur-[100px] pointer-events-none"></div>
        
        <TopNavbar />
        <main className="flex-1 p-8 overflow-x-hidden animate-fade-in z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
