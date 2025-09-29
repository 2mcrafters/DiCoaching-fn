import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    const savedUser = localStorage.getItem('coaching_dict_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const users = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        status: foundUser.status,
      };
      
      setUser(userSession);
      if (rememberMe) {
        localStorage.setItem('coaching_dict_user', JSON.stringify(userSession));
      }
      return { success: true };
    }
    
    return { success: false, error: 'Email ou mot de passe incorrect' };
  };

  const register = async (userData) => {
    const users = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      role: userData.role || 'chercheur',
      status: userData.role === 'auteur' ? 'pending' : 'active',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('coaching_dict_users', JSON.stringify(users));

    if (newUser.status === 'active') {
      const userSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      };
      setUser(userSession);
      localStorage.setItem('coaching_dict_user', JSON.stringify(userSession));
    }
    
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('coaching_dict_user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};