import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('resto_user');
    const storedMode = localStorage.getItem('resto_mode');
    const loginTime = localStorage.getItem('resto_login_time');

    if (storedUser && storedMode && loginTime) {
      const now = new Date().getTime();
      const SESSION_DURATION = 10 * 60 * 60 * 1000; // 10 hours
      if (now - parseInt(loginTime, 10) < SESSION_DURATION) {
        setUser(JSON.parse(storedUser));
        setRole(storedMode);
      } else {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    localStorage.setItem('resto_user', JSON.stringify(userData));
    localStorage.setItem('resto_mode', userRole);
    localStorage.setItem('resto_login_time', new Date().getTime().toString());
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('resto_user');
    localStorage.removeItem('resto_mode');
    localStorage.removeItem('resto_login_time');
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}