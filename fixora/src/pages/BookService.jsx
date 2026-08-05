import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Zap, Wrench, Hammer, Wind, Droplets, Bike, Car, Mic, MicOff,
  ArrowLeft, IndianRupee, AlertTriangle, Loader2, CheckCircle2,
} from "lucide-react";
import api from "../lib/api";
import { getCurrentPosition } from "../lib/geolocation";
import LanguageDropdown from "../components/LanguageDropdown";

const CATEGORY_MAP = {
  "electrician": { name: "Electrician", icon: Zap, tint: "#2563EB", estimate: [149, 349] },
  "plumber": { name: "Plumber", icon: Wrench, tint: "#0F7C6C", estimate: [149, 399] },
  "ac-fridge": { name: "AC & Refrigerator Technician", icon: Wind, tint: "#2E86C1", estimate: [299, 799] },
  "pump-motor": { name: "Water Pump & Motor Technician", icon: Droplets, tint: "#1B9AAA", estimate: [249, 699] },
  "carpenter": { name: "Carpenter", icon: Hammer, tint: "#A9652E", estimate: [199, 599] },
  "bike-mechanic": { name: "Bike Mechanic", icon: Bike, tint: "#D64541", estimate: [149, 449] },
  "car-mechanic": { name: "Car Mechanic", icon: Car, tint: "#14213D", estimate: [299, 899] },
};

// BCP-47 codes the browser's native Web Speech API can usually recognize.
// Coverage varies by browser/OS — Chrome on Android/desktop has the widest support.
const LANGUAGES = [
  { code: "en-IN", label: "English", supported: true },
  { code: "hi-IN", label: "Hindi", supported: true },
  { code: "kn-IN", label: "Kannada", supported: true },
  { code: "te-IN", label: "Telugu", supported: true },
  { code: "ta-IN", label: "Tamil", supported: true },
  { code: "ml-IN", label: "Malayalam", supported: true },
  { code: "mr-IN", label: "Marathi", supported: true },
  { code: "gu-IN", label: "Gujarati", supported: true },
  { code: "bn-IN", label: "Bengali", supported: true },
  { code: "pa-IN", label: "Punjabi (Gurmukhi)", supported: true },
  { code: "or-IN", label: "Odia", supported: false },
  { code: "as-IN", label: "Assamese", supported: false },
  { code: "ur-IN", label: "Urdu", supported: true },
  { code: "ne-NP", label: "Nepali", supported: true },
  { code: "sd-IN", label: "Sindhi", supported: false },
  { code: "kok-IN", label: "Konkani", supported: false },
  { code: "sa-IN", label: "Sanskrit", supported: false },
  { code: "ks-IN", label: "Kashmiri", supported: false },
  { code: "mni-IN", label: "Manipuri (Meitei)", supported: false },
  { code: "brx-IN", label: "Bodo", supported: false },
  { code: "doi-IN", label: "Dogri", supported: false },
  { code: "mai-IN", label: "Maithili", supported: false },
  { code: "sat-IN", label: "Santali", supported: false },
];
export default function BookService() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const category = CATEGORY_MAP[categorySlug];
  const Icon = category?.icon || Wrench;

  const [language, setLanguage] = useState("en-IN");
  const [description, setDescription] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [micError, setMicError] = useState("");
  const [budget, setBudget] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const recognitionRef = useRef(null);

  const speechSupported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function startListening() {
    if (!speechSupported) {
      setMicError("Voice input isn't supported in this browser. Try Chrome, or type your problem instead.");
      return;
    }
    setMicError("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interimText += transcript;
      }
      if (finalText) setDescription((prev) => (prev ? prev.trim() + " " : "") + finalText.trim());
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      setMicError(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings to use voice input."
          : "Didn't catch that — try again, or type it instead."
      );
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const position = await getCurrentPosition();

      const res = await api.post("/bookings", {
        category: categorySlug,
        description,
        language,
        budget: budget ? Number(budget) : null,
        emergency,
        customerLat: position.latitude,
        customerLng: position.longitude,
      });

      navigate(`/track/${res.data.id}`);
    } catch (err) {
      if (err.code === 1 || err.message?.includes("location")) {
        setSubmitError("We need your location to find nearby workers — please allow location access and try again.");
      } else {
        setSubmitError(err.response?.data?.message || "Couldn't send the request. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Nudges the estimate based on words in the description — a simple heuristic
  // stand-in for what a backend would eventually compute from real job data.
  const HIGH_SIGNAL_WORDS = ["not working", "no power", "burst", "leak", "broken", "new", "install", "replace", "stopped", "short circuit", "spark", "completely", "urgent"];
  const LOW_SIGNAL_WORDS = ["check", "minor", "small", "little", "just", "noise", "service", "routine", "loose"];

  const surcharge = emergency ? 1.25 : 1;
  let estimateLow = category ? category.estimate[0] : 0;
  let estimateHigh = category ? category.estimate[1] : 0;

  if (category && description.trim()) {
    const text = description.toLowerCase();
    const highHits = HIGH_SIGNAL_WORDS.filter((w) => text.includes(w)).length;
    const lowHits = LOW_SIGNAL_WORDS.filter((w) => text.includes(w)).length;
    const bias = Math.max(-1, Math.min(1, (highHits - lowHits) * 0.4 + (description.trim().length > 80 ? 0.15 : 0)));

    const [low, high] = category.estimate;
    const mid = (low + high) / 2;
    const halfWidth = (high - low) / 2;
    const center = mid + bias * halfWidth * 0.5;
    const tightHalfWidth = halfWidth * 0.65; // a described problem narrows the range vs. the flat default

    estimateLow = Math.round(center - tightHalfWidth);
    estimateHigh = Math.round(center + tightHalfWidth);
  }
  estimateLow = Math.round(estimateLow * surcharge);
  estimateHigh = Math.round(estimateHigh * surcharge);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFE] px-6">
        <div className="text-center">
          <p className="text-[#14213D] font-semibold mb-2">We don't recognize that service.</p>
          <Link to="/" className="text-[#2563EB] text-sm font-medium">Back to Fixora</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFE]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#6B7280] mb-6">
          <ArrowLeft size={15} /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${category.tint}18` }}>
            <Icon size={22} color={category.tint} />
          </div>
          <div>
            <p className="text-xs text-[#6B7280] font-mono tracking-wide">BOOKING</p>
            <h1 className="font-display text-2xl font-bold text-[#14213D]">{category.name}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#DCE8F7] p-6 space-y-6">
          {/* Language picker */}
          <div>
            <label className="text-sm font-medium text-[#14213D] mb-2 block">Your language</label>
            <LanguageDropdown options={LANGUAGES} value={language} onChange={setLanguage} />
          </div>

          {/* Problem description with mic */}
          <div>
            <label className="text-sm font-medium text-[#14213D] mb-2 block">Describe the problem</label>
            <div className="relative">
              <textarea
                value={description + (interim ? (description ? " " : "") + interim : "")}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="E.g. There's a spark from the switchboard in my kitchen whenever I turn on the light."
                className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 pr-14 text-sm resize-none text-[#14213D] bg-white"
              />
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  listening ? "bg-[#D64541]" : "bg-[#E8F2FF]"
                }`}
                title={listening ? "Stop recording" : "Speak your problem"}
              >
                {listening ? <MicOff size={16} color="#fff" /> : <Mic size={16} color="#2563EB" />}
              </button>
            </div>
            {listening && (
              <p className="text-xs text-[#1FA97F] mt-2 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> Listening — tap the mic again when you're done.
              </p>
            )}
            {micError && (
              <p className="text-xs text-[#D64541] mt-2">{micError}</p>
            )}
            <p className="text-xs text-[#9CA3AF] mt-2">
              You can review and edit the text above before sending — nothing is submitted until you tap "Send request."
            </p>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-medium text-[#14213D] mb-2 block">Your budget (optional)</label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
                className="w-full rounded-lg border border-[#D7E3F4] pl-8 pr-3 py-2.5 text-sm text-[#14213D] bg-white"
              />
            </div>
          </div>

          {/* Emergency toggle */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#DCE8F7] cursor-pointer">
            <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="w-4 h-4 accent-[#D64541]" />
            <AlertTriangle size={16} color={emergency ? "#D64541" : "#9CA3AF"} />
            <span className="text-sm text-[#14213D]">This is an emergency — prioritize my request</span>
          </label>

          {/* Fare estimate — shown before booking, like Rapido shows a fare before you confirm a ride */}
          <div className="rounded-lg p-4 flex items-center justify-between" style={{ background: "#F0F7FF", border: "1px solid #DCE8F7" }}>
            <div>
              <p className="text-xs text-[#6B7280] mb-0.5">
                {description.trim() ? "Estimated cost, based on your description" : "Estimated cost"}
              </p>
              <p className="font-display text-lg font-bold text-[#14213D]">
                ₹{estimateLow}–₹{estimateHigh}
              </p>
            </div>
            <p className="text-xs text-[#6B7280] max-w-[45%] text-right">
              {emergency ? "Includes emergency priority fee" : "Final price is confirmed by the worker on arrival"}
            </p>
          </div>

          {submitError && (
            <p className="text-xs text-[#D64541] flex items-center gap-1.5">
              <AlertTriangle size={13} /> {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="w-full bg-[#2563EB] text-white font-semibold rounded-lg py-3 disabled:opacity-50"
          >
            {submitting ? "Finding your location…" : `Send request · ₹${estimateLow}–₹${estimateHigh}`}
          </button>
        </form>
      </div>
    </div>
  );
}
