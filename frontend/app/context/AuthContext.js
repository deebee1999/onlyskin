'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false); // ✅ No token = no user, still mark as loaded
      return;
    }

    setToken(storedToken);

    fetch('http://localhost:5000/api/user/profile', { //added user/
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser({
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role,
          });
        } else {
          localStorage.removeItem('token');
        }
        setLoading(false); // ✅ Done checking
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        setLoading(false); // ✅ Even if error, we're done
      });
  }, []);


  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role, // ✅ Include role at login
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

   return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );

}

export const useAuth = () => useContext(AuthContext);
