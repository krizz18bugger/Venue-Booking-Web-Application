import React, { createContext, useContext, useState, useEffect } from 'react';
import { ownerAPI } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const storedUser = localStorage.getItem('user');
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [profile, setProfile] = useState(null);
  const [halls, setHalls] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
    setHalls([]);
  };

  const fetchProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const res = await ownerAPI.getProfile();
      setProfile(res.data.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      profile, fetchProfile, loadingProfile,
      halls, setHalls,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
