import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Clock, Star, Bell, LogOut, Zap, Wrench, Wind, Droplets, Hammer, Bike, Car, MapPin } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const CATEGORY_ICONS = {
  electrician: { icon: Zap, tint: "#2563EB" },
  plumber: { icon: Wrench, tint: "#0F7C6C" },
  "ac-fridge": { icon: Wind, tint: "#2E86C1" },
  "pump-motor": { icon: Droplets, tint: "#1B9AAA" },
  carpenter: { icon: Hammer, tint: "#A9652E" },
  "bike-mechanic": { icon: Bike, tint: "#D64541" },
  "car-mechanic": { icon: Car, tint: "#14213D" },
};

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    api.get("/bookings/mine").then((res) => setBookings(res.data)).catch(() => setBookings([]));
    api.get("/customers/me/wallet").then((res) => setWallet(res.data)).catch(() => setWallet({ balance: 0 }));
  }, []);

  return (
    <div className="min-h-screen bg-[#F7FAFE]">
      <header className="border-b border-[#DCE8F7] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B7280]">Welcome back</p>
            <h1 className="font-display text-lg font-bold text-[#14213D]">{user?.name || "Customer"}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-[#6B7280]" />
            <button onClick={logout} className="flex items-center gap-1.5 text-sm text-[#6B7280]">
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <h2 className="font-semibold text-[#14213D] mb-4">Current booking</h2>
            {bookings.filter((b) => b.status !== "COMPLETED").length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#6B7280] mb-4">No active booking right now.</p>
                <Link to="/" className="text-[#2563EB] text-sm font-semibold">Book a worker →</Link>
              </div>
            ) : (
              bookings
                .filter((b) => b.status !== "COMPLETED")
                .map((b) => {
                  const meta = CATEGORY_ICONS[b.category] || CATEGORY_ICONS.electrician;
                  const Icon = meta.icon;
                  return (
                    <Link key={b.id} to={`/track/${b.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-[#DCE8F7] hover:border-[#2563EB] transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${meta.tint}18` }}>
                        <Icon size={16} color={meta.tint} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{b.category}</p>
                        <p className="text-xs text-[#6B7280] flex items-center gap-1"><MapPin size={11} /> {b.status.replace(/_/g, " ")}</p>
                      </div>
                    </Link>
                  );
                })
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <h2 className="font-semibold text-[#14213D] mb-4">Booking history</h2>
            {bookings.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Your completed jobs will show up here.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm border-b border-[#F5EFE4] pb-3 last:border-0">
                    <span>{b.category}</span>
                    <span className="text-[#6B7280] flex items-center gap-1"><Star size={12} fill="#2563EB" color="#2563EB" /> {b.rating || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} color="#2563EB" />
              <span className="text-sm font-medium text-[#14213D]">Wallet balance</span>
            </div>
            <p className="font-display text-3xl font-bold text-[#14213D] mb-4">
              ₹{wallet?.balance ?? 0}
            </p>
            <button className="w-full bg-[#2563EB] text-white text-sm font-semibold rounded-lg py-2.5">
              Add money (Razorpay)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} color="#0F7C6C" />
              <span className="text-sm font-medium text-[#14213D]">Emergency booking</span>
            </div>
            <p className="text-xs text-[#6B7280] mb-4">Need someone right now? Jump the queue.</p>
            <Link to="/" className="block text-center w-full border border-[#D7E3F4] text-sm font-semibold rounded-lg py-2.5 text-[#14213D]">
              Book emergency
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
