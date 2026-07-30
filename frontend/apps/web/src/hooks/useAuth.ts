import { useEffect, useState } from 'react';
import type { UsuarioResponse } from '@repo/shared-types';
import { api } from '@/services/api';

export function useAuth() {
  const [user, setUser] = useState<UsuarioResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getProfile()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, userData: UsuarioResponse) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser: UsuarioResponse) => {
    setUser(updatedUser);
  };

  return { user, loading, login, logout, updateUser, isAuthenticated: !!user };
}
