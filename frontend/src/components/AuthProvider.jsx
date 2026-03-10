import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  clearSession,
  getMeRequest,
  loadStoredSession,
  loginRequest,
  refreshTokenRequest,
} from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const { accessToken, user: storedUser } = loadStoredSession();

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await getMeRequest();
        setUser(me);
      } catch {
        try {
          const newAccess = await refreshTokenRequest();
          if (newAccess) {
            const me = await getMeRequest();
            setUser(me || storedUser);
          } else {
            clearSession();
            setUser(null);
          }
        } catch {
          clearSession();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
