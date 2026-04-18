import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerNavbar from '../components/CustomerNavbar';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-surface-900">
      <CustomerNavbar />
      <Outlet />
    </div>
  );
}
