/**
 * AuthContext — JWT-based authentication state management for HEA.
 * Stores tokens in localStorage, provides login/register/logout/refresh helpers.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from './api';

// ── Types ──────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: 'patient' | 'admin' | 'staff';
  phone?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Storage Keys ────────────────────────────────────────────────
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'hea_access_token',
  REFRESH_TOKEN: 'hea_refresh_token',
  USER: 'hea_user',
};

// ── Provider Component ──────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedAccess = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (storedUser && storedAccess) {
      try {
        setUser(JSON.parse(storedUser));
        setTokens({
          access_token: storedAccess,
          refresh_token: storedRefresh || '',
          token_type: 'Bearer',
          expires_in: 0,
        });
      } catch {
        clearStorage();
      }
    }
    setIsLoading(false);
  }, []);

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // Also clear legacy key
    sessionStorage.removeItem('hea_auth');
  };

  const saveSession = (userData: AuthUser, tokenData: AuthTokens) => {
    setUser(userData);
    setTokens(tokenData);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    // Also set legacy key for backward compatibility
    sessionStorage.setItem('hea_auth', userData.role);
  };

  const login = async (email: string, password: string, role?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      saveSession(data.user, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error. Is the server running?' };
    }
  };

  const register = async (regData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      saveSession(data.user, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error. Is the server running?' };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    clearStorage();
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        logout();
        return false;
      }

      const data = await res.json();
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        saveSession(JSON.parse(storedUser), {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
        });
      }
      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user,
      tokens,
      isAuthenticated: !!user && !!tokens,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Authenticated fetch helper ──────────────────────────────────
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
