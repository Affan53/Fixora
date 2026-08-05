import React, { useEffect, useState } from "react";
import { Users, Wrench, Clock, Calendar, LogOut, CheckCircle2, XCircle, Shield } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const TABS = ["Workers", "Customers", "Bookings"];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("Workers");
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);

  function loadAll() {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/admin/workers").then((r) => setWorkers(r.data)).catch(() => {});
    api.get("/admin/customers").then((r) => setCustomers(r.data)).catch(() => {});
    api.get("/admin/bookings").then((r) => setBookings(r.data)).catch(() => {});
  }

  useEffect(loadAll, []);

  async function verifyWorker(id) {
    await api.post(`/admin/workers/${id}/verify`).catch(() => {});
    loadAll();
  }

  async function rejectWorker(id) {
    await api.post(`/admin/workers/${id}/reject`).catch(() => {});
    loadAll();
  }

  const statCards = stats
    ? [
        { label: "Total Customers", value: stats.totalCustomers, icon: Users },
        { label: "Total Workers", value: stats.totalWorkers, icon: Wrench },
        { label: "Pending Verifications", value: stats.pendingVerifications, icon: Clock },
        { label: "Today's Bookings", value: stats.todaysBookings, icon: Calendar },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <header className="border-b border-[#1E293B] bg-[#1E293B]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} color="#94A3B8" />
            <h1 className="font-display text-lg font-bold">Fixora Admin</h1>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-[#94A3B8]">
            <LogOut size={15} /> Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
                <Icon size={18} color="#94A3B8" className="mb-3" />
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-[#94A3B8] mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-[#1E293B] rounded-lg w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${tab === t ? "bg-[#334155] text-white" : "text-[#94A3B8]"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Workers" && (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#94A3B8] border-b border-[#334155]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-[#334155] last:border-0">
                    <td className="px-4 py-3">{w.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">+91 {w.phone}</td>
                    <td className="px-4 py-3">{w.trade || "—"}</td>
                    <td className="px-4 py-3">
                      {w.verified ? (
                        <span className="text-xs text-[#34D399] flex items-center gap-1"><CheckCircle2 size={13} /> Verified</span>
                      ) : w.trade ? (
                        <span className="text-xs text-[#FBBF24]">Pending review</span>
                      ) : (
                        <span className="text-xs text-[#64748B]">Not onboarded</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {w.trade && !w.verified && (
                        <div className="flex gap-2">
                          <button onClick={() => verifyWorker(w.id)} className="text-xs px-2.5 py-1 rounded bg-[#34D399]/15 text-[#34D399] flex items-center gap-1">
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button onClick={() => rejectWorker(w.id)} className="text-xs px-2.5 py-1 rounded bg-[#F87171]/15 text-[#F87171] flex items-center gap-1">
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#64748B]">No workers yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Customers" && (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#94A3B8] border-b border-[#334155]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-[#334155] last:border-0">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">+91 {c.phone}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-[#64748B]">No customers yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Bookings" && (
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#94A3B8] border-b border-[#334155]">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-[#334155] last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                    <td className="px-4 py-3">{b.category}</td>
                    <td className="px-4 py-3">{b.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{b.workerName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">{b.createdAt?.slice(0, 16).replace("T", " ")}</td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#64748B]">No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
