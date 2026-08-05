import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Wrench, ArrowRight, ShieldCheck, ArrowLeft, Star } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import FixoraLogo from "../components/FixoraLogo";

export default function Login() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();
  const [params] = useSearchParams();

  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState(params.get("role") === "worker" ? "WORKER" : "CUSTOMER");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Worker login gets the same teal identity as the rest of the worker
  // experience — a visual cue (like Rapido Captain vs Rapido customer app)
  // that you're in a different context, right from the login screen.
  const brand = role === "WORKER" ? "#0F7C6C" : "#2563EB";
  const brandTint = role === "WORKER" ? "#E7F3F1" : "#E8F2FF";

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
      setError(err.response?.data?.message || "Couldn't send the OTP. Check the number and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    setSubmitting(true);
    try {
      const digits = phone.replace(/\D/g, "");
      const user = await verifyOtp(digits, otp, role, name);
      if (user.role === "WORKER") {
        navigate(user.trade ? "/worker" : "/worker/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "That code didn't match. Check it and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFE] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-4 justify-center">
          <FixoraLogo size={32} />
          <span className="font-display text-xl font-bold text-[#14213D]">Fixora</span>
        </Link>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          <Star size={13} fill="#2563EB" color="#2563EB" />
          <span className="text-xs font-semibold text-[#14213D]">4.8</span>
          <span className="text-xs text-[#6B7280]">· Trusted by 50,000+ users across India</span>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#DCE8F7]">
          {step === "phone" ? (
            <>
              <h1 className="font-display text-2xl font-bold text-[#14213D] mb-6">Log in to Fixora</h1>

              <div className="flex gap-2 mb-6 p-1 rounded-lg" style={{ background: brandTint }}>
                {["CUSTOMER", "WORKER"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 text-center text-sm py-2 rounded-md font-medium transition-colors ${
                      role === r ? "bg-white shadow-sm" : "text-[#6B7280]"
                    }`}
                    style={role === r ? { color: brand } : undefined}
                  >
                    {r === "CUSTOMER" ? "I need a worker" : "I am a worker"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">Mobile number</label>
                  <div className="flex rounded-lg border border-[#D7E3F4] overflow-hidden">
                    <span className="flex items-center gap-1.5 px-3 bg-[#E8F2FF] text-sm text-[#6B7280]">
                      <span>🇮🇳</span> +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder=""
                      className="flex-1 px-3 py-2.5 text-sm outline-none text-[#14213D] bg-white"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-[#D64541]">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: brand }}
                  className="w-full text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Proceed"} <ArrowRight size={15} />
                </button>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => setStep("phone")} className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-4">
                <ArrowLeft size={13} /> Change number
              </button>
              <div className="w-12 h-12 rounded-full bg-[#E8F7F2] flex items-center justify-center mb-4">
                <ShieldCheck size={22} color="#1FA97F" />
              </div>
              <h1 className="font-display text-2xl font-bold text-[#14213D] mb-1">Enter the code</h1>
              <p className="text-sm text-[#6B7280] mb-6">Sent to +91 {phone}</p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {role === "WORKER" && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white"
                  />
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full rounded-lg border border-[#D7E3F4] px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono text-[#14213D] bg-white"
                />

                {error && <p className="text-xs text-[#D64541]">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: brand }}
                  className="w-full text-white font-semibold rounded-lg py-2.5 disabled:opacity-60"
                >
                  {submitting ? "Verifying…" : "Verify & Continue"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
