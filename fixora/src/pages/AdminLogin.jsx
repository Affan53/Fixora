import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import FixoraLogo from "../components/FixoraLogo";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setSubmitting(true);
    try {
      await sendOtp(digits);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send the OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const digits = phone.replace(/\D/g, "");
      const user = await verifyOtp(digits, otp, "ADMIN");
      if (user.role !== "ADMIN") {
        setError("This account isn't an admin account.");
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "That code didn't match.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <FixoraLogo size={32} background="#334155" />
          <span className="font-display text-xl font-bold text-white">Fixora Admin</span>
        </div>

        <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#334155]">
          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="text-xs text-[#94A3B8] mb-1 block">Admin mobile number</label>
              <div className="flex rounded-lg border border-[#334155] overflow-hidden">
                <span className="flex items-center gap-1.5 px-3 bg-[#0F172A] text-sm text-[#94A3B8]">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-[#0F172A] text-white"
                />
              </div>
              {error && <p className="text-xs text-[#F87171]">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-[#334155] text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? "Sending…" : "Proceed"} <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <button type="button" onClick={() => setStep("phone")} className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-2">
                <ArrowLeft size={13} /> Change number
              </button>
              <div className="w-12 h-12 rounded-full bg-[#0F172A] flex items-center justify-center mb-2">
                <ShieldCheck size={22} color="#94A3B8" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full rounded-lg border border-[#334155] px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono bg-[#0F172A] text-white"
              />
              {error && <p className="text-xs text-[#F87171]">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-[#334155] text-white font-semibold rounded-lg py-2.5 disabled:opacity-60">
                {submitting ? "Verifying…" : "Verify & Continue"}
              </button>
            </form>
          )}
        </div>
        <Link to="/" className="block text-center text-xs text-[#64748B] mt-6">Back to Fixora</Link>
      </div>
    </div>
  );
}
