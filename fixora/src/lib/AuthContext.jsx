import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";
import { registerForPushNotifications } from "./push";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fixora_token");
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate token against backend and load the current user's profile
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        // Re-register for push on app relaunch too, not just first login —
        // covers cases like reinstalling the app or clearing app data.
        registerForPushNotifications();
      })
      .catch(() => localStorage.removeItem("fixora_token"))
      .finally(() => setLoading(false));
  }, []);

  // Step 1 of login: ask the backend to text a 6-digit code via Fast2SMS.
  // `phone` is the 10-digit number, no country code.
  async function sendOtp(phone) {
    await api.post("/auth/send-otp", { phone });
  }

  // Step 2: submit what the user typed. The backend creates the account on
  // first login (using `role`/`name`) and returns our own JWT.
  async function verifyOtp(phone, otp, role, name) {
    const res = await api.post("/auth/verify-otp", { phone, otp, role, name });
    localStorage.setItem("fixora_token", res.data.token);
    setUser(res.data.user);
    // Register this device for push notifications right after login —
    // this is what lets job alerts and status updates reach the phone even
    // when the app is closed.
    registerForPushNotifications();
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("fixora_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
