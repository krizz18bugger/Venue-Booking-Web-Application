import React, { createContext, useContext, useState, useEffect } from 'react';
import { ownerAPI, customerAPI } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const storedUser = localStorage.getItem('user');
  const [user,           setUser]           = useState(storedUser ? JSON.parse(storedUser) : null);
  const [profile,        setProfile]        = useState(null);
  const [halls,          setHalls]          = useState([]);
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
      if (user.role === 'owner') {
        const res = await ownerAPI.getProfile();
        setProfile(res.data.data);
      } else if (user.role === 'customer') {
        const res = await customerAPI.getProfile();
        setProfile(res.data.data);
      }
      // admin has no separate profile endpoint yet
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user?.id]);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      profile, setProfile, fetchProfile, loadingProfile,
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
