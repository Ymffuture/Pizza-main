import { createContext, useContext, useState, useCallback } from "react";
import { login as apiLogin, register as apiRegister, googleAuth } from "../api/auth.api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("kb_token") || null);
  const [user,  setUser]  = useState(() => {
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

  // Google OAuth — access_token comes from @react-oauth/google hook
  const googleLogin = useCallback(async (access_token) => {
    const res = await googleAuth(access_token);
    const { access_token: jwt, user: googleUser } = res.data;
    saveSession(jwt, {
      email:     googleUser.email,
      full_name: googleUser.full_name,
      picture:   googleUser.picture || "",
    });
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    await apiRegister(data);
    const res = await apiLogin({ email: data.email, password: data.password });
    saveSession(res.data.access_token, {
      email:     data.email,
      full_name: data.full_name,
    });
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("kb_token");
    sessionStorage.removeItem("kb_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, googleLogin, register, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
