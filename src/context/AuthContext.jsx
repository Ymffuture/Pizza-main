import { createContext, useContext, useState, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { login as apiLogin, register as apiRegister, googleAuth } from "../api/auth.api";

const AuthContext = createContext();

const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_VERIFY_TEMPLATE_ID;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || "https://foodsorder.vercel.app";

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
    // 1. Create the account — backend returns { token, email, full_name }
    const regRes = await apiRegister(data);

    // 2. Send verification email via EmailJS (non-blocking — don't fail registration if it errors)
    if (regRes.data?.token) {
      try {
        const verifyLink = `${APP_URL}/verify-email?token=${regRes.data.token}`;
        await emailjs.send(
          EJS_SERVICE,
          EJS_TEMPLATE,
          {
            to_email:    regRes.data.email,
            to_name:     regRes.data.full_name,
            verify_link: verifyLink,
          },
          EJS_KEY,
        );
      } catch (emailErr) {
        // Log but don't block — user can resend from /verify-email
        console.warn("[AuthContext] EmailJS send failed:", emailErr);
      }
    }

    // 3. Auto-login after registration
    const loginRes = await apiLogin({ email: data.email, password: data.password });
    saveSession(loginRes.data.access_token, {
      email:     data.email,
      full_name: data.full_name,
    });
    return loginRes.data;
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
