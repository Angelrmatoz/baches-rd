import { useEffect, useState } from 'react';
import type { UsuarioResponse } from '@repo/shared-types';
import { api } from '@repo/api';

import {
  clearAuth,
  getStoredUser,
  getTokenSync,
  setStoredUser,
  setToken,
} from '../lib/storage';

export function useAuth() {
  const [user, setUser] = useState<UsuarioResponse | null>(() => getStoredUser<UsuarioResponse>());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getTokenSync()) {
      setUser(null);
      setLoading(false);
      return;
    }

    api
      .getProfile()
      .then((data) => {
        setUser(data);
        setStoredUser(data);
      })
      .catch((err: Error) => {
        if (err.message?.includes('401') || err.message?.includes('403')) {
          clearAuth();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, userData: UsuarioResponse) => {
    setToken(token);
    setStoredUser(userData);
    setUser(userData);
  };

  const logout = async () => {
    await clearAuth();
    setUser(null);
  };

  const updateUser = (updatedUser: UsuarioResponse) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  };

  return { user, loading, login, logout, updateUser, isAuthenticated: !!user };
}
