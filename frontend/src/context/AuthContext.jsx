import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('restaurant_token');
    const savedUser = localStorage.getItem('restaurant_user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    setLoading(false);
  }, []);

  // Đăng nhập bằng username + password
  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    localStorage.setItem('restaurant_token', res.token);
    localStorage.setItem('restaurant_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  // Đăng nhập admin bằng username + password
  const adminLogin = async (username, password) => {
    const res = await authAPI.adminLogin({ username, password });
    localStorage.setItem('restaurant_token', res.token);
    localStorage.setItem('restaurant_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_user');
    setUser(null);
  };

  const isAdmin      = user?.role === 'admin' || user?.role === 'staff';
  const isShipper    = user?.role === 'shipper';
  const isStaff      = ['admin', 'staff', 'kitchen', 'shipper'].includes(user?.role);
  const isSuperAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, logout, isAdmin, isShipper, isStaff, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
