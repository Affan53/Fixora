import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft, Star, PhoneCall, MessageCircle, CheckCircle2,
  Navigation, Wrench, Zap, Wind, Droplets, Hammer, Bike, Car,
} from "lucide-react";
import api from "../lib/api";
import { subscribe } from "../lib/socket";

// Leaflet's default marker icons reference image paths that don't resolve
// correctly through bundlers like Vite — this is the standard fix, pulling
// the icon images from a CDN instead.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORY_ICONS = {
  electrician: { icon: Zap, tint: "#2563EB" },
  plumber: { icon: Wrench, tint: "#0F7C6C" },
  "ac-fridge": { icon: Wind, tint: "#2E86C1" },
  "pump-motor": { icon: Droplets, tint: "#1B9AAA" },
  carpenter: { icon: Hammer, tint: "#A9652E" },
  "bike-mechanic": { icon: Bike, tint: "#D64541" },
  "car-mechanic": { icon: Car, tint: "#14213D" },
};

const STEPS = ["PENDING", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "WORKING", "COMPLETED"];
const STEP_LABELS = {
  PENDING: "Finding a worker",
  ACCEPTED: "Accepted",
  ON_THE_WAY: "On the way",
  ARRIVED: "Arrived",
  WORKING: "Working",
  COMPLETED: "Completed",
};

// Straight-line distance in km — good enough for a rough ETA, not real
// road-routing (that would need a routing API, out of scope for now).
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TrackingPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data))
      .catch(() => setError("Couldn't load this booking."));

    const unsubscribe = subscribe(`/topic/bookings/${bookingId}`, (dto) => {
      setBooking(dto);
    });
    return unsubscribe;
  }, [bookingId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFE] px-6">
        <div className="text-center">
          <p className="text-[#14213D] font-semibold mb-2">{error}</p>
          <Link to="/dashboard" className="text-[#2563EB] text-sm font-medium">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFE] text-[#6B7280] text-sm font-mono">
        Loading…
      </div>
    );
  }

  const meta = CATEGORY_ICONS[booking.category] || CATEGORY_ICONS.electrician;
  const Icon = meta.icon;
  const stepIndex = STEPS.indexOf(booking.status);
  const hasWorkerLocation = booking.workerLat != null && booking.workerLng != null;
  const dist = hasWorkerLocation
    ? distanceKm(booking.customerLat, booking.customerLng, booking.workerLat, booking.workerLng)
    : null;
  const etaMinutes = dist != null ? Math.max(1, Math.round((dist / 25) * 60)) : null; // assumes ~25km/h average

  const mapCenter = hasWorkerLocation
    ? [(booking.customerLat + booking.workerLat) / 2, (booking.customerLng + booking.workerLng) / 2]
    : [booking.customerLat, booking.customerLng];

  return (
    <div className="min-h-screen bg-[#F7FAFE]">
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-[#6B7280] mb-4">
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        {/* Status timeline — Rapido-style step tracker */}
        <div className="bg-white rounded-2xl border border-[#DCE8F7] p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${meta.tint}18` }}>
                <Icon size={17} color={meta.tint} />
              </div>
              <div>
                <p className="text-xs text-[#6B7280] font-mono">BOOKING #{booking.id}</p>
                <p className="font-semibold text-[#14213D]">{STEP_LABELS[booking.status]}</p>
              </div>
            </div>
            {etaMinutes && booking.status !== "COMPLETED" && (
              <div className="text-right">
                <p className="text-xs text-[#6B7280]">ETA</p>
                <p className="font-display font-bold text-[#2563EB]">{etaMinutes} min</p>
              </div>
            )}
          </div>

          <div className="flex gap-1 mt-4">
            {STEPS.slice(0, 5).map((s, i) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: i <= stepIndex ? meta.tint : "#E8F2FF" }}
              />
            ))}
          </div>
        </div>

        {/* Live map */}
        <div className="rounded-2xl overflow-hidden border border-[#DCE8F7] mb-4" style={{ height: 320 }}>
          <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[booking.customerLat, booking.customerLng]}>
              <Popup>Your location</Popup>
            </Marker>
            {hasWorkerLocation && (
              <Marker position={[booking.workerLat, booking.workerLng]}>
                <Popup>{booking.workerName || "Your worker"}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Worker card */}
        {booking.workerName && (
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-5 flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${meta.tint}18` }}>
              <Icon size={19} color={meta.tint} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#14213D]">{booking.workerName}</p>
              <p className="text-xs text-[#6B7280] flex items-center gap-1">
                <Star size={11} fill="#2563EB" color="#2563EB" /> 4.8
                {dist != null && <> · {dist.toFixed(1)} km away</>}
              </p>
            </div>
            <a href="tel:" className="w-9 h-9 rounded-full bg-[#E8F2FF] flex items-center justify-center">
              <PhoneCall size={15} color="#2563EB" />
            </a>
            <button className="w-9 h-9 rounded-full bg-[#E8F2FF] flex items-center justify-center">
              <MessageCircle size={15} color="#2563EB" />
            </button>
          </div>
        )}

        {booking.status === "PENDING" && (
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">
              Notifying nearby {(booking.category || "").replace("-", " ")}s — first to accept gets your job.
            </p>
          </div>
        )}

        {booking.status === "COMPLETED" && (
          <div className="bg-white rounded-2xl border border-[#DCE8F7] p-6 text-center">
            <CheckCircle2 size={28} color="#1FA97F" className="mx-auto mb-2" />
            <p className="font-semibold text-[#14213D] mb-1">Job completed</p>
            <p className="text-sm text-[#6B7280]">Rate your worker from your dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
