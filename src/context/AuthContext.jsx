import { createContext, useContext, useState, useCallback } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth.api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Try to seed from sessionStorage so a page refresh doesn't force re-login
  const [token, setToken] = useState(() => sessionStorage.getItem("kb_token") || null);
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("kb_user")); } catch { return null; }
  });

  const saveSession = (tok, usr) => {
    setToken(tok);
    setUser(usr);
    sessionStorage.setItem("kb_token", tok);
    sessionStorage.setItem("kb_user", JSON.stringify(usr));
  };

  const login = useCallback(async ({ email, password }) => {
    const res = await apiLogin({ email, password });
    saveSession(res.data.access_token, { email });
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    await apiRegister(data);
    // Auto-login after registration
    const res = await apiLogin({ email: data.email, password: data.password });
    saveSession(res.data.access_token, { email: data.email, full_name: data.full_name });
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("kb_token");
    sessionStorage.removeItem("kb_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
