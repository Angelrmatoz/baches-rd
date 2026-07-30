import { useEffect, useState } from 'react';
import type { UsuarioResponse } from '@repo/shared-types';
import { api } from '@/services/api';

export function useAuth() {
  const [user, setUser] = useState<UsuarioResponse | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    api
      .getProfile()
      .then((data) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      })
      .catch((err: Error) => {
        // Only clear session if server explicitly rejects authentication (401 / 403)
        if (err.message?.includes('401') || err.message?.includes('403')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, userData: UsuarioResponse) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser: UsuarioResponse) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return { user, loading, login, logout, updateUser, isAuthenticated: !!user };
}
