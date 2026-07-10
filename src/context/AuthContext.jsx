// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { login as apiLogin, register as apiRegister, googleAuth, verifyLoginOtp, resendLoginOtp } from "../api/auth.api";

const AuthContext = createContext();

const EJS_SERVICE      = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EJS_SERVICE_OTP      = import.meta.env.VITE_EMAILJS_SERVICE_ID_OTP;

const EJS_TEMPLATE     = import.meta.env.VITE_EMAILJS_VERIFY_TEMPLATE_ID;
const EJS_OTP_TEMPLATE = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID || EJS_TEMPLATE;
const EJS_KEY           = import.meta.env.VITE_EJS_KEY;
const APP_URL           = import.meta.env.VITE_APP_URL || "https://foodsorder.vercel.app";

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

  /**
   * Step 1 of email login: verify email + password against the backend.
   * The backend no longer hands back a session token here — it issues a
   * 6-digit OTP instead. This emails that code via EmailJS (same "backend
   * generates it, frontend sends it" pattern the app already uses for
   * password-reset/verify-email links) and returns the OTP metadata so the
   * caller (Login.jsx) can show the code-entry screen.
   */
  const login = useCallback(async ({ email, password }) => {
    const res = await apiLogin({ email, password });

    if (res.data.email_verified === false) {
      throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
    }

    const { otp_code, full_name, expires_in } = res.data;
    if (otp_code && EJS_SERVICE_OTP && EJS_OTP_TEMPLATE && EJS_KEY) {
      try {
        await emailjs.send(
          EJS_SERVICE, EJS_OTP_TEMPLATE,
          { to_email: email, to_name: full_name, otp_code, expires_in },
          EJS_KEY,
        );
      } catch (err) {
        // Don't block the OTP screen from showing just because the email
        // send failed client-side — the code is still valid server-side,
        // the user just won't have gotten it in their inbox. Resend covers this.
        console.error("EmailJS OTP send failed:", err);
      }
    }

    return res.data; // { otp_required, email, full_name, expires_in }
  }, []);

  /**
   * Step 2 of email login: exchange the OTP the user typed in for an
   * actual session token, then persist the session as normal.
   */
  const completeOtpLogin = useCallback(async (email, otp) => {
    const res = await verifyLoginOtp(email, otp);
    saveSession(res.data.access_token, {
      email,
      id:             res.data.id,
      email_verified: res.data.email_verified,
      full_name:      res.data.full_name,
      picture:        res.data.picture,
    });
    return res.data;
  }, []);

  /** Request a fresh OTP (previous one is invalidated server-side) and re-send via EmailJS. */
  const resendOtpLogin = useCallback(async (email) => {
    const res = await resendLoginOtp(email);
    const { otp_code, full_name, expires_in } = res.data;
    if (otp_code && EJS_SERVICE && EJS_OTP_TEMPLATE && EJS_KEY) {
      await emailjs.send(
        EJS_SERVICE, EJS_OTP_TEMPLATE,
        { to_email: email, to_name: full_name, otp_code, expires_in },
        EJS_KEY,
      );
    }
    return res.data;
  }, []);

  const googleLogin = useCallback(async (access_token) => {
    const res = await googleAuth(access_token);
    const { access_token: jwt, user: googleUser } = res.data;
    saveSession(jwt, {
      email:          googleUser.email,
      id:             googleUser.id,
      full_name:      googleUser.full_name,
      picture:        googleUser.picture || "",
      email_verified: true,
    });
    return res.data;
  }, []);

  /**
   * loginWithOAuth — used by GitHubCallback and future OAuth callback pages.
   * Receives the JWT and user object already resolved by the backend,
   * stores them in session, and updates React state.
   */
  const loginWithOAuth = useCallback(async (accessToken, userData) => {
    saveSession(accessToken, {
      email:          userData.email,
      id:             userData.id,
      full_name:      userData.full_name,
      picture:        userData.picture || "",
      email_verified: userData.email_verified ?? true,
    });
  }, []);

  const register = useCallback(async (data) => {
    const regRes = await apiRegister(data);

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
        console.warn("[AuthContext] EmailJS send failed:", emailErr);
      }
    }

    return regRes.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("kb_token");
    sessionStorage.removeItem("kb_user");
  }, []);

  /**
   * updateUser — merges a partial user object (e.g. from PATCH /users/me or
   * POST /users/me/avatar) into the current session, so the sidebar/topbar
   * avatar and name update immediately without a full reload.
   */
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...partial };
      sessionStorage.setItem("kb_user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, login, completeOtpLogin, resendOtpLogin, googleLogin, loginWithOAuth, register, logout, updateUser, isAuth: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
