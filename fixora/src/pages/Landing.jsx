import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap, Wrench, Hammer, Wind, Droplets, Bike, Car, MapPin, Star, Shield,
  Bell, Menu, X, ArrowRight, CheckCircle2, Navigation, PhoneCall,
  TrendingUp, Download, Mic, Languages, Mail
} from "lucide-react";
import TiltCard from "../components/TiltCard";
import FixoraLogo from "../components/FixoraLogo";

/* ---------------------------------------------------------------
   Design tokens — light, warm, Rapido-adjacent but original
   bg       #F7FAFE  – warm paper white
   panel    #E8F2FF  – soft saffron-tinted card bg
   ink      #14213D  – deep navy for headings/text
   saffron  #2563EB  – primary action color
   rust     #D64541  – urgent / emergency
   teal     #0F7C6C  – secondary trust accent
   steel    #6B7280  – muted body text
   success  #1FA97F
------------------------------------------------------------------*/

// Only the 7 trades this build supports
const CATEGORIES = [
  { name: "Electrician", slug: "electrician", desc: "Wiring, switches, short-circuit fixes", icon: Zap, tint: "#2563EB", img: "/images/electrician.jpg", avatar: "/images/electrician-avatar.jpg" },
  { name: "Plumber", slug: "plumber", desc: "Leaks, pipes, tap & tank repair", icon: Wrench, tint: "#0F7C6C", img: "/images/plumber.jpg", avatar: "/images/plumber-avatar.jpg" },
  { name: "AC & Refrigerator Technician", slug: "ac-fridge", desc: "Servicing, gas refill, cooling issues", icon: Wind, tint: "#2E86C1", img: "/images/ac-fridge.jpg", avatar: "/images/ac-fridge-avatar.jpg" },
  { name: "Water Pump & Motor Technician", slug: "pump-motor", desc: "Pump repair, motor rewinding, installs", icon: Droplets, tint: "#1B9AAA", img: "/images/pump-motor.jpg", avatar: "/images/pump-motor-avatar.jpg" },
  { name: "Carpenter", slug: "carpenter", desc: "Furniture, doors, custom woodwork", icon: Hammer, tint: "#A9652E", img: "/images/carpenter.jpg", avatar: "/images/carpenter-avatar.jpg" },
  { name: "Bike Mechanic", slug: "bike-mechanic", desc: "Servicing, breakdown, tyre work", icon: Bike, tint: "#D64541", img: "/images/bike-mechanic.jpg", avatar: "/images/bike-mechanic-avatar.jpg" },
  { name: "Car Mechanic", slug: "car-mechanic", desc: "Diagnostics, AC, break-down help", icon: Car, tint: "#14213D", img: "/images/car-mechanic.jpg", avatar: "/images/car-mechanic-avatar.jpg" },
];

const STEPS = [
  { title: "Choose a technician", desc: "Pick from 7 verified trades in seconds.", icon: MapPin },
  { title: "Describe the problem", desc: "Type it, or just speak — in your own language.", icon: Mic },
  { title: "A worker accepts", desc: "First to accept locks the job — no bidding wars.", icon: CheckCircle2 },
  { title: "Track them live", desc: "Watch their marker move toward you in real time.", icon: Navigation },
  { title: "Work gets done", desc: "Chat, call, or share photos while the job's on.", icon: Wrench },
  { title: "Pay & rate", desc: "Release payment from your wallet, then rate the job.", icon: Star },
];

const FEATURES = [
  { title: "Verified Workers", desc: "ID-checked, background-verified professionals only.", icon: Shield },
  { title: "Live GPS Tracking", desc: "See your worker's exact position, updated every 15s.", icon: MapPin },
  { title: "Voice in Your Language", desc: "Speak your problem in any major Indian language.", icon: Languages },
  { title: "Instant Booking", desc: "Average accept time under 20 seconds.", icon: Zap },
  { title: "Secure Payments", desc: "Money is held in escrow until the job's done.", icon: Shield },
  { title: "Ratings & Reviews", desc: "Real feedback from real completed jobs.", icon: Star },
  { title: "Real-time Alerts", desc: "Status pushes the moment anything changes.", icon: Bell },
  { title: "Customer Support", desc: "A human on the line when something goes wrong.", icon: PhoneCall },
];

export default function FixoraLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "#services" },
    { label: "About", href: "#footer" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#F7FAFE", color: "#14213D" }} className="min-h-screen w-full overflow-x-hidden">
      <style>{`
        .display-font { font-family: 'Space Grotesk', sans-serif; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }
        .cat-card:hover { transform: translateY(-5px); box-shadow: 0 16px 32px -14px rgba(20,33,61,0.18); }
        .cat-card { transition: transform .22s ease, box-shadow .22s ease; }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(31,169,127,0.45); }
          100% { box-shadow: 0 0 0 12px rgba(31,169,127,0); }
        }
        .pulse-dot { animation: pulse-ring 1.8s infinite; }
        .nav-link { position: relative; padding-bottom: 2px; }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background: #2563EB;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .nav-link:hover::after { transform: scaleX(1); }
      `}</style>

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-md shadow-sm" : ""}`}
        style={{ background: scrolled ? "rgba(255,253,249,0.92)" : "transparent", borderBottom: scrolled ? "1px solid #DCE8F7" : "1px solid transparent" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <FixoraLogo size={32} />
            <span className="display-font text-xl font-bold tracking-tight">Fixora</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#4B5563" }}>
            {navLinks.map((l) =>
              l.href.startsWith("/") ? (
                <Link key={l.label} to={l.href} className="nav-link hover:text-[#14213D] transition-colors">{l.label}</Link>
              ) : (
                <a key={l.label} href={l.href} className="nav-link hover:text-[#14213D] transition-colors">{l.label}</a>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login?role=customer" className="text-sm px-5 py-2.5 rounded-lg font-semibold flex items-center gap-1.5 text-white" style={{ background: "#2563EB" }}>
              Book Now <ArrowRight size={15} />
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 pb-5 flex flex-col gap-3 bg-white border-t border-[#DCE8F7]">
            {navLinks.map((l) =>
              l.href.startsWith("/") ? (
                <Link key={l.label} to={l.href} className="text-sm py-1" style={{ color: "#4B5563" }}>{l.label}</Link>
              ) : (
                <a key={l.label} href={l.href} className="text-sm py-1" style={{ color: "#4B5563" }}>{l.label}</a>
              )
            )}
            <Link to="/login?role=customer" className="text-sm py-2 rounded-lg font-semibold text-center text-white" style={{ background: "#2563EB" }}>Book Now</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-36 pb-0 px-6" style={{ background: "linear-gradient(180deg, #CEE2FC 0%, #D8E9FC 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center pb-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs mono-font" style={{ background: "rgba(255,255,255,0.7)", color: "#1FA97F" }}>
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "#1FA97F" }} />
                2,300+ workers online right now
              </div>
              <h1 className="display-font text-5xl md:text-6xl font-bold leading-[1.05] mb-6">
                Need a Skilled Worker?<br />
                <span style={{ color: "#2563EB" }}>Get One in Minutes.</span>
              </h1>
              <p className="text-lg mb-8 max-w-md" style={{ color: "#475569" }}>
                Book trusted nearby professionals instantly. Speak your problem in your own language. Track them live. Pay after the work is done.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link to="/login?role=customer" className="px-6 py-3.5 rounded-lg font-semibold flex items-center gap-2 text-white" style={{ background: "#2563EB" }}>
                  Book a Worker <ArrowRight size={17} />
                </Link>
                <Link to="/login?role=worker" className="px-6 py-3.5 rounded-lg font-semibold flex items-center gap-2 text-white" style={{ background: "#2563EB" }}>
                  Become a Worker <ArrowRight size={17} />
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
                <Mic size={14} color="#2563EB" /> Speak in Hindi, Kannada, Tamil, Telugu & more
              </div>
            </div>

            {/* Original illustration, blended into the page — no frame, no shadow, no rounded box */}
            <div>
              <img
                src="/images/hero-illustration.jpg"
                alt="Fixora — electrician, plumber, AC technician, water pump technician, carpenter, bike mechanic and car mechanic, all bookable from the app"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES — Rapido-style icon tiles */}
      <section className="max-w-7xl mx-auto px-6 py-20 scroll-mt-24" id="services">
        <div className="mb-12">
          <span className="mono-font text-xs tracking-widest" style={{ color: "#2563EB" }}>SERVICE CATEGORIES</span>
          <h2 className="display-font text-3xl md:text-4xl font-bold mt-2">Seven trades. One tap away.</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" style={{ perspective: "1200px" }}>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <TiltCard key={c.slug} intensity={6} className="rounded-xl">
                <Link to={`/book/${c.slug}`} className="cat-card rounded-xl border bg-white block overflow-hidden" style={{ borderColor: "#DCE8F7", boxShadow: "0 10px 24px -16px rgba(20,33,61,0.2)" }}>
                  {c.img ? (
                    <div className="h-32 w-full overflow-hidden relative">
                      <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-28 w-full flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${c.tint}22, ${c.tint}08)` }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#fff", boxShadow: `0 10px 20px -8px ${c.tint}66` }}>
                        <Icon size={22} color={c.tint} />
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 text-sm">{c.name}</h3>
                    <p className="text-xs mb-3" style={{ color: "#6B7280" }}>{c.desc}</p>
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: c.tint }}>
                      Book Now <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20" style={{ background: "#F0F7FF" }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-14 text-center">
            <span className="mono-font text-xs tracking-widest" style={{ color: "#2563EB" }}>THE FLOW</span>
            <h2 className="display-font text-3xl md:text-4xl font-bold mt-2">How Fixora Works</h2>
          </div>
          <div className="relative pl-10">
            <div className="absolute left-[19px] top-2 bottom-2 w-px" style={{ background: "#F0DDC0" }} />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative mb-8 last:mb-0">
                  <div className="absolute -left-10 w-10 h-10 rounded-full flex items-center justify-center mono-font text-xs font-bold bg-white" style={{ border: "1px solid #BFDBFE", color: "#2563EB" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="ml-4 flex items-start gap-4 rounded-xl p-5 bg-white" style={{ border: "1px solid #DCE8F7" }}>
                    <Icon size={20} color="#2563EB" className="mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{s.title}</h3>
                      <p className="text-sm" style={{ color: "#6B7280" }}>{s.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VOICE AI CALLOUT */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-2xl h-80 flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #E8F2FF, #FFE8D1)" }}>
            {/* Custom illustration — a phone mockup with a live waveform, since stock photos of "voice assistants" mostly show generic phone calls rather than speech-to-text */}
            <div className="relative w-44 h-80 rounded-[2rem] bg-[#14213D] p-3 shadow-2xl" style={{ transform: "rotate(-4deg)" }}>
              <div className="w-full h-full rounded-[1.5rem] bg-white flex flex-col items-center justify-center gap-6 px-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#E8F2FF" }}>
                  <Mic size={26} color="#2563EB" />
                </div>
                <div className="flex items-end gap-1 h-10">
                  {[8, 20, 32, 16, 28, 12, 24].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 rounded-full"
                      style={{
                        height: `${h}px`,
                        background: "#2563EB",
                        animation: `bar-bounce 1.1s ease-in-out ${i * 0.1}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#6B7280] text-center">"बिजली का स्विच बोर्ड ठीक करना है…"</p>
              </div>
            </div>
            <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-white rounded-full pl-2 pr-4 py-2 shadow-md">
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#E8F2FF" }}>
                <Mic size={14} color="#2563EB" />
              </span>
              <span className="text-xs font-semibold text-[#14213D]">Listening…</span>
            </div>
            <style>{`
              @keyframes bar-bounce {
                0%, 100% { transform: scaleY(0.4); }
                50% { transform: scaleY(1); }
              }
            `}</style>
          </div>
          <div>
            <span className="mono-font text-xs tracking-widest" style={{ color: "#2563EB" }}>VOICE ASSISTANT</span>
            <h2 className="display-font text-3xl md:text-4xl font-bold mt-2 mb-4">Just speak. We'll write it down.</h2>
            <p className="mb-6" style={{ color: "#6B7280" }}>
              Tap the mic on the booking screen and describe your problem out loud — in Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, or plenty more. Fixora converts it to text, lets you review it, and translates it for the worker if needed.
            </p>
            <div className="space-y-2">
              {["Speak instead of typing", "Review and edit before sending"].map((b) => (
                <div key={b} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                  <CheckCircle2 size={15} color="#1FA97F" className="mt-0.5 shrink-0" /> {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="mono-font text-xs tracking-widest" style={{ color: "#2563EB" }}>WHY FIXORA</span>
          <h2 className="display-font text-3xl md:text-4xl font-bold mt-2">Built for trust, tuned for speed.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl p-5 border bg-white" style={{ borderColor: "#DCE8F7" }}>
                <Icon size={20} color="#2563EB" className="mb-3" />
                <h3 className="font-semibold mb-1 text-sm">{f.title}</h3>
                <p className="text-xs" style={{ color: "#6B7280" }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* WORKER BENEFITS */}
      <section className="px-6 py-20" style={{ background: "#F0F7FF" }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="mono-font text-xs tracking-widest" style={{ color: "#2563EB" }}>FOR WORKERS</span>
            <h2 className="display-font text-3xl md:text-4xl font-bold mt-2 mb-4">More jobs. More control.</h2>
            <div className="grid grid-cols-2 gap-3">
              {["Instant bookings", "Flexible hours", "Weekly earnings", "Verified profile", "Performance rewards", "Wallet system"].map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                  <CheckCircle2 size={15} color="#1FA97F" /> {b}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-8 bg-white shadow-sm" style={{ border: "1px solid #DCE8F7" }}>
            <div className="flex items-center justify-between mb-6">
              <span className="mono-font text-xs" style={{ color: "#6B7280" }}>THIS WEEK</span>
              <TrendingUp size={16} color="#1FA97F" />
            </div>
            <p className="display-font text-4xl font-bold mb-1">₹18,420</p>
            <p className="text-xs mb-6" style={{ color: "#6B7280" }}>from 23 completed jobs</p>
            <div className="flex gap-2">
              <span className="mono-font text-[10px] px-2 py-1 rounded" style={{ background: "#E8F2FF", color: "#2563EB" }}>TOP RATED</span>
              <span className="mono-font text-[10px] px-2 py-1 rounded" style={{ background: "#E8F7F2", color: "#1FA97F" }}>FAST RESPONDER</span>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <span className="mono-font text-xs tracking-widest" style={{ color: "#2563EB" }}>TESTIMONIALS</span>
          <h2 className="display-font text-3xl md:text-4xl font-bold mt-2">Real jobs, real ratings.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: "Anita R.", role: "Customer", text: "The electrician arrived in under ten minutes and fixed everything without any drama." },
            { name: "Suresh M.", role: "Plumber, Worker", text: "Bookings come in steadily and I get paid straight to my wallet the same day." },
            { name: "Priya D.", role: "Customer", text: "Tracking the worker's location live made waiting so much less stressful." },
            { name: "Karthik V.", role: "Customer", text: "Booked an AC technician on a Sunday and someone was at my door in twenty minutes." },
            { name: "Fathima S.", role: "Customer", text: "I spoke my problem in Tamil and it worked exactly as expected — no typing needed." },
            { name: "Manoj T.", role: "Bike Mechanic, Worker", text: "The wallet payouts are quick and I like that customers rate every single job." },
          ].map((r) => (
            <div key={r.name} className="rounded-xl p-6 bg-white border" style={{ borderColor: "#DCE8F7" }}>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill="#2563EB" color="#2563EB" />
                ))}
              </div>
              <p className="text-sm mb-4" style={{ color: "#374151" }}>"{r.text}"</p>
              <p className="text-xs font-semibold">{r.name} <span className="font-normal" style={{ color: "#6B7280" }}>· {r.role}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* DOWNLOAD APP */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-2xl px-8 py-12 text-white" style={{ background: "linear-gradient(135deg, #14213D, #0F2A3D)" }}>
          <div className="mb-8">
            <h2 className="display-font text-2xl md:text-3xl font-bold mb-2">Take Fixora with you.</h2>
            <p className="text-white/70">Download the app directly — no app store needed.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/downloads/fixora-customer.apk"
              download
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-[#14213D]"
            >
              <Download size={18} /> <span className="text-sm font-semibold">Download — Book a Worker</span>
            </a>
            <a
              href="/downloads/fixora-worker.apk"
              download
              className="flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-white text-white"
            >
              <Download size={18} /> <span className="text-sm font-semibold">Download — Become a Worker</span>
            </a>
          </div>
          <p className="text-xs text-white/50 mt-4">
            Android only, direct download (.apk). Your phone will ask you to allow "install from unknown sources" —
            that's expected since this isn't on the Play Store.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer" className="border-t px-6 py-14 scroll-mt-24" style={{ borderColor: "#DCE8F7" }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FixoraLogo size={28} />
              <span className="display-font font-bold">Fixora</span>
            </div>
            <p className="text-xs" style={{ color: "#6B7280" }}>Skilled help, dispatched instantly.</p>
          </div>
          {[
            { h: "Company", items: ["About", "Contact", "Become a Worker"] },
            { h: "Product", items: ["Services", "Pricing", "Live Tracking"] },
            { h: "Legal", items: ["Privacy Policy", "Terms of Service"] },
          ].map((col) => (
            <div key={col.h}>
              <h4 className="text-sm font-semibold mb-3">{col.h}</h4>
              {col.items.map((it) =>
                it === "Contact" ? (
                  <Link key={it} to="/contact" className="block text-xs mb-2" style={{ color: "#6B7280" }}>{it}</Link>
                ) : (
                  <a key={it} href="#" className="block text-xs mb-2" style={{ color: "#6B7280" }}>{it}</a>
                )
              )}
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-3 text-xs" style={{ borderColor: "#DCE8F7", color: "#9CA3AF" }}>
          <span>© 2026 Fixora Technologies Pvt. Ltd. All rights reserved.</span>
          <span className="mono-font">support@fixora.app</span>
        </div>
      </footer>
    </div>
  );
}
