import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);

      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);

          // Vérifier que le token est toujours valide
          const profileResult = await authService.getProfile();
          if (profileResult.success) {
            const normalized = {
              ...profileResult.data,
              role:
                (profileResult.data?.role || "").toLowerCase() === "auteur"
                  ? "author"
                  : profileResult.data?.role,
            };
            setUser(normalized);
          } else {
            // Token invalide, déconnexion
            authService.logout();
            setUser(null);
          }
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        const normalized = {
          ...result.data.user,
          role:
            (result.data.user?.role || "").toLowerCase() === "auteur"
              ? "author"
              : result.data.user?.role,
        };
        setUser(normalized);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError("Erreur de connexion");
      return { success: false, error: "Erreur de connexion" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.register(userData);

      if (result.success) {
        const normalized = {
          ...result.data.user,
          role:
            (result.data.user?.role || "").toLowerCase() === "auteur"
              ? "author"
              : result.data.user?.role,
        };
        setUser(normalized);
        return { success: true };
      } else {
        // result.error may be an object { message, fields }
        const err = result.error || {
          message: "Erreur d'inscription",
          fields: {},
        };
        setError(err.message || err);
        return { success: false, error: err };
      }
    } catch (error) {
      setError("Erreur d'inscription");
      return {
        success: false,
        error: { message: "Erreur d'inscription", fields: {} },
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasAuthorPermissions = () => {
    if (!user) return false;
    // Admins always have author-like permissions
    if (user.role === "admin") return true;
    // Authors must have a confirmed/active status to be able to write/modify
    const isAuthorRole = user.role === "author";
    const isConfirmed = user.status === "confirmed" || user.status === "active";
    return isAuthorRole && isConfirmed;
  };

  const updateUser = (userData) => {
    const normalized = {
      ...userData,
      role:
        (userData?.role || "").toLowerCase() === "auteur"
          ? "author"
          : userData?.role,
    };
    setUser(normalized);
    // Also update localStorage to persist the changes
    localStorage.setItem("user", JSON.stringify(normalized));
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    hasAuthorPermissions,
    updateUser,
    loading,
    error,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};