import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Wrench, Hammer, Wind, Droplets, Bike, Car, Upload, CheckCircle2,
  FileText, User, Landmark, ArrowRight, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";
import SelfieCapture from "../components/SelfieCapture";
import { isValidAadhaarChecksum, isValidPanFormat } from "../lib/validators";

const TRADES = [
  { name: "Electrician", icon: Zap },
  { name: "Plumber", icon: Wrench },
  { name: "AC & Refrigerator Technician", icon: Wind },
  { name: "Water Pump & Motor Technician", icon: Droplets },
  { name: "Carpenter", icon: Hammer },
  { name: "Bike Mechanic", icon: Bike },
  { name: "Car Mechanic", icon: Car },
];

const MIN_FILE_SIZE = 15 * 1024; // 15KB — catches accidental blank/corrupt uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function FileRow({ label, hint, file, onChange, fileError, onError }) {
  function handleFile(f) {
    if (!f) {
      onChange(null);
      onError("");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type)) {
      onError("Upload a JPG, PNG, or PDF file.");
      return;
    }
    if (f.size < MIN_FILE_SIZE) {
      onError("That file looks too small to be a readable document — try a clearer photo or scan.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      onError("That file is too large (max 10MB).");
      return;
    }
    onError("");
    onChange(f);
  }

  return (
    <div>
      <label className="flex items-center gap-3 p-3 rounded-lg border border-[#D7E3F4] cursor-pointer hover:bg-[#F0F7FF]">
        <div className="w-9 h-9 rounded-lg bg-[#E7F3F1] flex items-center justify-center shrink-0">
          <Upload size={16} color="#0F7C6C" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#14213D]">{label}</p>
          <p className="text-xs text-[#6B7280] truncate">{file ? file.name : hint}</p>
        </div>
        {file && <CheckCircle2 size={16} color="#1FA97F" className="shrink-0" />}
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      </label>
      {fileError && (
        <p className="text-xs text-[#D64541] flex items-center gap-1.5 mt-1.5">
          <AlertTriangle size={12} /> {fileError}
        </p>
      )}
    </div>
  );
}

export default function WorkerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.trade) navigate("/worker", { replace: true });
  }, [user, navigate]);

  const [step, setStep] = useState(1);
  const [trade, setTrade] = useState("");
  const [experience, setExperience] = useState("");
  const [address, setAddress] = useState("");

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaar, setAadhaar] = useState(null);
  const [pan, setPan] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [aadhaarError, setAadhaarError] = useState("");
  const [panError, setPanError] = useState("");
  const [certError, setCertError] = useState("");

  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [ifscStatus, setIfscStatus] = useState(null); // null | "checking" | "valid" | "invalid"
  const [bankInfo, setBankInfo] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const aadhaarNumberValid = isValidAadhaarChecksum(aadhaarNumber);
  const panNumberValid = isValidPanFormat(panNumber);

  const canContinueStep1 = trade && experience && address.trim().length > 4;
  const canContinueStep2 =
    aadhaarNumberValid && panNumberValid && aadhaar && pan && photo && !aadhaarError && !panError && !certError;
  const canSubmitStep3 =
    accountNumber.trim().length >= 9 && accountNumber.trim().length <= 18 && ifscStatus === "valid";

  // Real IFSC verification — Razorpay runs a free, public, no-auth lookup
  // against actual RBI bank/branch records. This confirms the IFSC itself
  // is real; it doesn't confirm the account number belongs to this person —
  // that needs a penny-drop / Fund Account Validation API (e.g. Razorpay's
  // paid Fund Account Validation product), which requires a business
  // account with payout KYC approved, not something we can fake here.
  useEffect(() => {
    if (ifsc.trim().length !== 11) {
      setIfscStatus(null);
      setBankInfo(null);
      return;
    }
    let cancelled = false;
    setIfscStatus("checking");
    fetch(`https://ifsc.razorpay.com/${ifsc.trim().toUpperCase()}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setIfscStatus("valid");
        setBankInfo(data);
      })
      .catch(() => {
        if (cancelled) return;
        setIfscStatus("invalid");
        setBankInfo(null);
      });
    return () => { cancelled = true; };
  }, [ifsc]);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      // In production: files upload to Cloudinary via the backend (signed
      // upload), and the form fields + resulting URLs go to Spring Boot,
      // which flags the profile "pending_verification" for an admin to review —
      // exactly like Blinkit's delivery-partner document check.
      const formData = new FormData();
      formData.append("trade", trade);
      formData.append("experience", experience);
      formData.append("address", address);
      formData.append("aadhaarNumber", aadhaarNumber);
      formData.append("panNumber", panNumber.toUpperCase());
      formData.append("accountNumber", accountNumber);
      formData.append("ifsc", ifsc.toUpperCase());
      formData.append("aadhaar", aadhaar);
      formData.append("pan", pan);
      formData.append("photo", photo);
      if (certificate) formData.append("certificate", certificate);

      await api.post("/workers/onboarding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit — try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setStep(4);
  }

  return (
    <div className="min-h-screen bg-[#F7FAFE] py-10 px-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= step ? "#0F7C6C" : "#DCE8F7" }} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center gap-2 mb-1">
              <User size={18} color="#0F7C6C" />
              <h1 className="font-display text-xl font-bold text-[#14213D]">Tell us about your work</h1>
            </div>
            <p className="text-sm text-[#6B7280] mb-6">Hi {user?.name || "there"} — let's get you set up to receive jobs.</p>

            <label className="text-sm font-medium text-[#14213D] mb-2 block">Your trade</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {TRADES.map((t) => {
                const Icon = t.icon;
                const selected = trade === t.name;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTrade(t.name)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-medium ${
                      selected ? "border-[#0F7C6C] bg-[#E7F3F1] text-[#0F7C6C]" : "border-[#D7E3F4] text-[#14213D]"
                    }`}
                  >
                    <Icon size={14} />
                    {t.name}
                  </button>
                );
              })}
            </div>

            <label className="text-sm font-medium text-[#14213D] mb-2 block">Years of experience</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="3"
              className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white mb-5"
            />

            <label className="text-sm font-medium text-[#14213D] mb-2 block">Service address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Area, city, PIN code"
              className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white mb-6"
            />

            <button
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
              className="w-full bg-[#0F7C6C] text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} color="#0F7C6C" />
              <h1 className="font-display text-xl font-bold text-[#14213D]">Verify your identity</h1>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">
              Same as Blinkit or any real gig platform — we verify every worker's documents before they can accept
              jobs. Make sure each document is well-lit, in focus, and shows all four corners with no glare.
            </p>

            <label className="text-sm font-medium text-[#14213D] mb-1.5 block">Aadhaar number</label>
            <input
              type="text"
              inputMode="numeric"
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="12-digit Aadhaar number"
              className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white font-mono mb-1.5"
            />
            {aadhaarNumber.length === 12 && (
              <p className={`text-xs flex items-center gap-1.5 mb-4 ${aadhaarNumberValid ? "text-[#1FA97F]" : "text-[#D64541]"}`}>
                {aadhaarNumberValid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {aadhaarNumberValid ? "Valid Aadhaar number format" : "This doesn't check out as a valid Aadhaar number"}
              </p>
            )}
            {aadhaarNumber.length > 0 && aadhaarNumber.length < 12 && <div className="mb-4" />}

            <label className="text-sm font-medium text-[#14213D] mb-1.5 block">PAN number</label>
            <input
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="ABCDE1234F"
              className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white font-mono mb-1.5"
            />
            {panNumber.length === 10 && (
              <p className={`text-xs flex items-center gap-1.5 mb-5 ${panNumberValid ? "text-[#1FA97F]" : "text-[#D64541]"}`}>
                {panNumberValid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {panNumberValid ? "Valid PAN format" : "Not a valid PAN format (e.g. ABCDE1234F)"}
              </p>
            )}
            {panNumber.length > 0 && panNumber.length < 10 && <div className="mb-5" />}

            <div className="space-y-3 mb-6">
              <FileRow label="Aadhaar card photo" hint="Front side, all corners visible, no glare" file={aadhaar} onChange={setAadhaar} fileError={aadhaarError} onError={setAadhaarError} />
              <FileRow label="PAN card photo" hint="For payout & tax compliance" file={pan} onChange={setPan} fileError={panError} onError={setPanError} />
              <SelfieCapture value={photo} onChange={setPhoto} />
              <FileRow label="Trade certificate (optional)" hint="ITI / apprenticeship certificate, if you have one" file={certificate} onChange={setCertificate} fileError={certError} onError={setCertError} />
            </div>

            <p className="text-[11px] text-[#9CA3AF] mb-5">
              Note: we validate that your Aadhaar/PAN numbers are structurally real (correct checksum/format) —
              confirming they're registered to you specifically requires UIDAI/NSDL-licensed verification APIs,
              which need government/business approval to access and will be added when this goes into production.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-[#D7E3F4] text-[#14213D] font-semibold rounded-lg py-2.5">Back</button>
              <button
                disabled={!canContinueStep2}
                onClick={() => setStep(3)}
                className="flex-1 bg-[#0F7C6C] text-white font-semibold rounded-lg py-2.5 disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center gap-2 mb-1">
              <Landmark size={18} color="#0F7C6C" />
              <h1 className="font-display text-xl font-bold text-[#14213D]">Where should we pay you?</h1>
            </div>
            <p className="text-sm text-[#6B7280] mb-6">Your job earnings are paid out here after each completed booking.</p>

            <label className="text-sm font-medium text-[#14213D] mb-2 block">Bank account number</label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))}
              placeholder="9-18 digit account number"
              className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white mb-5"
            />

            <label className="text-sm font-medium text-[#14213D] mb-2 block">IFSC code</label>
            <input
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              maxLength={11}
              placeholder="SBIN0001234"
              className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white font-mono"
            />
            <div className="mb-5 mt-1.5">
              {ifscStatus === "checking" && (
                <p className="text-xs text-[#6B7280] flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Checking against RBI bank records…</p>
              )}
              {ifscStatus === "valid" && bankInfo && (
                <p className="text-xs text-[#1FA97F] flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> {bankInfo.BANK} — {bankInfo.BRANCH}
                </p>
              )}
              {ifscStatus === "invalid" && (
                <p className="text-xs text-[#D64541] flex items-center gap-1.5"><AlertTriangle size={12} /> Not a real IFSC code — double-check it</p>
              )}
            </div>

            <p className="text-[11px] text-[#9CA3AF] mb-5">
              The IFSC is checked live against real RBI bank/branch records above. Confirming the account *number*
              actually belongs to you needs a penny-drop verification (e.g. Razorpay Fund Account Validation), which
              requires a business payout account with KYC approved — that's a production step, not something
              client-side code can verify.
            </p>

            {error && <p className="text-xs text-[#D64541] mb-4">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-[#D7E3F4] text-[#14213D] font-semibold rounded-lg py-2.5">Back</button>
              <button
                disabled={!canSubmitStep3 || submitting}
                onClick={handleSubmit}
                className="flex-1 bg-[#0F7C6C] text-white font-semibold rounded-lg py-2.5 disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit for verification"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#E7F3F1] flex items-center justify-center mx-auto mb-4">
              <Clock size={26} color="#0F7C6C" />
            </div>
            <h2 className="font-display text-xl font-bold text-[#14213D] mb-2">Documents submitted</h2>
            <p className="text-sm text-[#6B7280] mb-6">
              We're reviewing your Aadhaar, PAN, and selfie — this usually takes 24–48 hours, just like onboarding on
              Blinkit or Swiggy. You'll get a notification the moment you're verified and can start accepting jobs.
            </p>
            <button onClick={() => navigate("/worker")} className="w-full bg-[#0F7C6C] text-white font-semibold rounded-lg py-2.5">
              Go to my dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
