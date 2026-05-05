"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, getToken, removeToken } from '@/lib/auth';
import { getDashboardRoute } from '@/lib/routes';

const AuthContext = createContext(null);
// We export this to allow api.js to access the context without hooks
let contextRef = null;
export const getAuthContext = () => contextRef;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        setToken(data.data.accessToken);
        return data.data.accessToken;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [API_URL]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(accessToken && { Authorization: `Bearer ${accessToken}` }) },
        credentials: 'include'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      removeToken();
      router.push('/login');
    }
  }, [API_URL, accessToken, router]);

  const getMe = useCallback(async () => {
    let currentToken = getToken();
    if (!currentToken) {
      setIsLoading(false);
      return;
    }
    
    try {
      let res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
        credentials: 'include'
      });
      
      if (res.status === 401) {
        currentToken = await refreshToken();
        if (currentToken) {
          res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${currentToken}` },
            credentials: 'include'
          });
        }
      }
      
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setAccessToken(currentToken);
        setIsAuthenticated(true);
      } else {
        removeToken();
      }
    } catch (e) {
      console.error('Failed to get me', e);
      removeToken();
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, refreshToken]);

  useEffect(() => {
    getMe();
  }, [getMe]);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      setAccessToken(data.data.accessToken);
      setToken(data.data.accessToken);
      setUser(data.data.user);
      setIsAuthenticated(true);
      router.push(getDashboardRoute(data.data.user.role));
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const contextValue = { user, accessToken, isLoading, isAuthenticated, login, logout, refreshToken, getMe };
  contextRef = contextValue;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
