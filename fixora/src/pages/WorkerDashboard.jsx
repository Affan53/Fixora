import React, { useEffect, useRef, useState } from "react";
import { Wallet, TrendingUp, Bell, LogOut, Star, CheckCircle2, Volume2, MapPin, Clock } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";
import { subscribe } from "../lib/socket";
import { watchPosition } from "../lib/geolocation";

const ACCEPT_WINDOW_SECONDS = 20;

const STATUS_FLOW = {
  ACCEPTED: { next: "ON_THE_WAY", label: "Start heading there" },
  ON_THE_WAY: { next: "ARRIVED", label: "I've arrived" },
  ARRIVED: { next: "WORKING", label: "Start the job" },
  WORKING: { next: "COMPLETED", label: "Mark completed" },
};

// A short two-tone chime built with the Web Audio API — no audio file needed.
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.35);
    });
  } catch (e) {
    // Autoplay policies can block audio before any user interaction — harmless if so.
  }
}

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const [online, setOnline] = useState(false);
  const [incomingJob, setIncomingJob] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(ACCEPT_WINDOW_SECONDS);
  const [activeJob, setActiveJob] = useState(null);
  const [toast, setToast] = useState("");
  const [earnings] = useState({ today: 0, week: 0 }); // wallet/payments not built yet — placeholder
  const timerRef = useRef(null);
  const stopWatchRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Restore any job this worker already has in progress (e.g. after a refresh)
  useEffect(() => {
    api.get("/bookings/worker/mine").then((res) => {
      const inProgress = res.data.find((b) => ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "WORKING"].includes(b.status));
      if (inProgress) setActiveJob(inProgress);
    }).catch(() => {});
  }, []);

  // Subscribe to new-job alerts for this worker's trade while online
  useEffect(() => {
    if (!online || !user?.trade || activeJob) return;
    const unsubscribe = subscribe(`/topic/workers/${user.trade}`, (dto) => {
      if (dto.status === "PENDING") {
        setIncomingJob(dto);
        setSecondsLeft(ACCEPT_WINDOW_SECONDS);
        playChime();
      }
    });
    return unsubscribe;
  }, [online, user?.trade, activeJob]);

  // Countdown timer for the incoming job card
  useEffect(() => {
    if (!incomingJob) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setIncomingJob(null); // auto-dismiss — another worker gets the chance
          return ACCEPT_WINDOW_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [incomingJob]);

  // While a job is active, watch position and push updates every ~15-20s.
  // Uses the native Geolocation plugin inside the app (properly requests
  // Android's runtime permission) via lib/geolocation, falling back to the
  // browser API on the plain website.
  useEffect(() => {
    if (!activeJob || !["ACCEPTED", "ON_THE_WAY"].includes(activeJob.status)) {
      stopWatchRef.current?.();
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      return;
    }

    let lastPosition = null;
    let cancelled = false;

    watchPosition((pos) => { lastPosition = pos; }).then((stop) => {
      if (cancelled) stop();
      else stopWatchRef.current = stop;
    });

    function pushLocation() {
      if (!lastPosition) return;
      api.post(`/bookings/${activeJob.id}/location`, {
        lat: lastPosition.latitude,
        lng: lastPosition.longitude,
      }).catch(() => {});
    }

    locationIntervalRef.current = setInterval(pushLocation, 17000);
    return () => {
      cancelled = true;
      stopWatchRef.current?.();
      clearInterval(locationIntervalRef.current);
    };
  }, [activeJob]);

  function speakJob(job) {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(job.description || "No description provided.");
    utterance.lang = job.language || "en-IN";
    window.speechSynthesis.speak(utterance);
  }

  async function toggleOnline() {
    const next = !online;
    setOnline(next);
    api.post("/workers/me/status", { online: next }).catch(() => {});
  }

  async function acceptJob() {
    const job = incomingJob;
    setIncomingJob(null);
    try {
      const res = await api.post(`/bookings/${job.id}/accept`);
      setActiveJob(res.data);
    } catch (err) {
      setToast(err.response?.data?.message || "That job is no longer available.");
      setTimeout(() => setToast(""), 3000);
    }
  }

  function rejectJob() {
    setIncomingJob(null); // stays PENDING for the next worker — no explicit "reject" needed server-side
  }

  async function advanceStatus() {
    const step = STATUS_FLOW[activeJob.status];
    if (!step) return;
    try {
      const res = await api.post(`/bookings/${activeJob.id}/status`, { status: step.next });
      setActiveJob(step.next === "COMPLETED" ? null : res.data);
      if (step.next === "COMPLETED") {
        setToast("Job marked complete!");
        setTimeout(() => setToast(""), 3000);
      }
    } catch (err) {
      setToast(err.response?.data?.message || "Couldn't update status.");
      setTimeout(() => setToast(""), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFE]">
      <header className="border-b border-[#DCE8F7] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B7280]">Worker</p>
            <h1 className="font-display text-lg font-bold text-[#14213D]">{user?.name || "Worker"}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleOnline}
              disabled={!!activeJob}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-60 ${online ? "bg-[#E8F7F2] text-[#1FA97F]" : "bg-[#F3F4F6] text-[#6B7280]"}`}
            >
              <span className={`w-2 h-2 rounded-full ${online ? "bg-[#1FA97F]" : "bg-[#9CA3AF]"}`} />
              {online ? "Online" : "Offline"}
            </button>
            <Bell size={18} className="text-[#6B7280]" />
            <button onClick={logout} className="flex items-center gap-1.5 text-sm text-[#6B7280]">
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#14213D] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Incoming job — Rapido-style accept/reject card with countdown */}
      {incomingJob && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#6B7280]">NEW JOB REQUEST</span>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="17" fill="none" stroke="#E7F3F1" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="17" fill="none" stroke="#0F7C6C" strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 17}
                    strokeDashoffset={2 * Math.PI * 17 * (1 - secondsLeft / ACCEPT_WINDOW_SECONDS)}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="text-sm font-bold text-[#14213D]">{secondsLeft}</span>
              </div>
            </div>
            <p className="font-semibold text-[#14213D] mb-1">{incomingJob.category}</p>
            <p className="text-sm text-[#374151] mb-4">{incomingJob.description}</p>
            <div className="flex gap-2">
              <button onClick={acceptJob} className="flex-1 bg-[#0F7C6C] text-white font-semibold rounded-lg py-2.5">Accept</button>
              <button onClick={rejectJob} className="flex-1 border border-[#D7E3F4] text-[#14213D] font-semibold rounded-lg py-2.5">Reject</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {activeJob ? (
            <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
              <h2 className="font-semibold text-[#14213D] mb-4">Active job</h2>
              <div className="border border-[#DCE8F7] rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-[#14213D]">{activeJob.category}</p>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1"><MapPin size={11} /> {activeJob.status.replace(/_/g, " ")}</p>
                  </div>
                  <button onClick={() => speakJob(activeJob)} className="text-[#0F7C6C]">
                    <Volume2 size={17} />
                  </button>
                </div>
                <p className="text-sm text-[#374151]">{activeJob.description}</p>
              </div>
              {STATUS_FLOW[activeJob.status] && (
                <button onClick={advanceStatus} className="w-full bg-[#0F7C6C] text-white font-semibold rounded-lg py-3 flex items-center justify-center gap-2">
                  <Clock size={16} /> {STATUS_FLOW[activeJob.status].label}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
              <h2 className="font-semibold text-[#14213D] mb-4">Waiting for a job</h2>
              <p className="text-sm text-[#6B7280]">
                {!user?.trade
                  ? "Complete your worker onboarding to start receiving jobs."
                  : online
                  ? "You're online — a chime will sound the moment a job comes in."
                  : "Go online to start receiving job requests."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6B7280]">TODAY</span>
              <TrendingUp size={16} color="#1FA97F" />
            </div>
            <p className="font-display text-3xl font-bold text-[#14213D] mb-1">₹{earnings.today}</p>
            <p className="text-xs text-[#6B7280]">₹{earnings.week} this week</p>
            <p className="text-[10px] text-[#9CA3AF] mt-2">Wallet payouts aren't wired up yet — coming with Razorpay integration.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} color="#0F7C6C" />
              <span className="text-sm font-medium text-[#14213D]">Wallet</span>
            </div>
            <button className="w-full border border-[#D7E3F4] text-sm font-semibold rounded-lg py-2.5 text-[#14213D]" disabled>
              Withdraw to bank
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} fill="#0F7C6C" color="#0F7C6C" />
              <span className="text-sm font-medium text-[#14213D]">Badges</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded bg-[#E7F3F1] text-[#0F7C6C] flex items-center gap-1"><CheckCircle2 size={11} /> Top Rated</span>
              <span className="text-xs px-2 py-1 rounded bg-[#E8F7F2] text-[#1FA97F] flex items-center gap-1"><CheckCircle2 size={11} /> Fast Responder</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
