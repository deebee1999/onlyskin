'use client';

/* =============================================================================
   AuthContext — Persist Auth + 401-Aware Fetch Wrapper
   - Restores token + user from localStorage on mount
   - Background refresh to validate token (only logs out on 401)
   - Saves user + token on login; clears both on logout
   - Patches window.fetch once to:
       * add Authorization header for backend calls
       * auto-logout on 401 responses
   ========================================================================== */

import { createContext, useContext, useEffect, useRef, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // ----------------------------------------------------------------------------
  // State
  // ----------------------------------------------------------------------------
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep latest token/logout in refs so the fetch wrapper reads fresh values
  const tokenRef = useRef(null);
  const logoutRef = useRef(() => {});

  // ----------------------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------------------
  const persistAuth = (jwt, userObj) => {
    localStorage.setItem('token', jwt);
    if (userObj) {
      localStorage.setItem('user', JSON.stringify(userObj));
    }
  };

  const clearPersistedAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ----------------------------------------------------------------------------
  // Initial Restore on Mount
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // 1) Restore from localStorage immediately for no flicker
    const storedToken = localStorage.getItem('token');
    const storedUserJSON = localStorage.getItem('user');

    if (storedUserJSON) {
      try {
        const parsed = JSON.parse(storedUserJSON);
        setUser(parsed);
      } catch {
        localStorage.removeItem('user');
      }
    }

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    tokenRef.current = storedToken;

    // 2) Background validation / refresh of user profile
    const controller = new AbortController();

    // Keep your working endpoint
    fetch('http://localhost:5000/api/user/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${storedToken}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 401) {
          // Token invalid/expired — real logout
          setUser(null);
          setToken(null);
          clearPersistedAuth();
          return;
        }
        if (!res.ok) {
          // Do not clear auth on non-401 errors
          return;
        }
        const data = await res.json();
        const refreshedUser = {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
        };
        setUser(refreshedUser);
        persistAuth(storedToken, refreshedUser);
      })
      .catch(() => {
        // Network hiccup: keep whatever we restored locally
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // ----------------------------------------------------------------------------
  // Auth API
  // ----------------------------------------------------------------------------
  const login = (jwt, userData) => {
    const normalizedUser = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
    };
    setToken(jwt);
    tokenRef.current = jwt;
    setUser(normalizedUser);
    persistAuth(jwt, normalizedUser);
  };

  const logout = () => {
    setToken(null);
    tokenRef.current = null;
    setUser(null);
    clearPersistedAuth();
  };
  // keep latest logout in ref for wrapper
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // ----------------------------------------------------------------------------
  // 401-Aware Fetch Wrapper (global, safe, idempotent)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only patch once
    if (window.__ONLYSKINS_FETCH_PATCHED__) return;

    const originalFetch = window.fetch.bind(window);

    // Backend base URL(s) to match (adjust if needed)
    const API_BASES = ['http://localhost:5000/'];

    const isBackendRequest = (url) => {
      try {
        const u = typeof url === 'string' ? new URL(url, window.location.origin) : new URL(url.url, window.location.origin);
        return API_BASES.some((base) => u.href.startsWith(base));
      } catch {
        return false;
      }
    };

    window.fetch = async (input, init = {}) => {
      // Build a Request so we can normalize headers safely
      const req = input instanceof Request ? input : new Request(input, init);

      let headers = new Headers(req.headers || {});
      const hasAuth = headers.has('Authorization');
      const currentToken = tokenRef.current;

      // Inject Authorization only for backend requests and when not already set
      if (!hasAuth && currentToken && isBackendRequest(req.url)) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }

      const patchedReq = new Request(req, { headers });

      const res = await originalFetch(patchedReq);
      if (res.status === 401 && isBackendRequest(patchedReq.url)) {
        // Auto-logout on 401 for backend calls
        try {
          logoutRef.current && logoutRef.current();
        } catch {}
      }
      return res;
    };

    Object.defineProperty(window, '__ONLYSKINS_FETCH_PATCHED__', {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false,
    });

    return () => {
      // We intentionally do not unpatch to avoid flipping behavior during app lifetime
    };
  }, []); // patch once

  // ----------------------------------------------------------------------------
  // Provider
  // ----------------------------------------------------------------------------
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
