import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, PhoneCall, Mail, MapPin } from "lucide-react";
import FixoraLogo from "../components/FixoraLogo";

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", role: "", comment: "" });
  const [sent, setSent] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // In production this posts to the backend, which forwards it to support
    // or creates a ticket — for now it just confirms receipt in the UI.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border p-8 text-center" style={{ borderColor: "#DCE8F7" }}>
        <CheckCircle2 size={28} color="#1FA97F" className="mx-auto mb-3" />
        <p className="font-semibold text-[#14213D] mb-1">Thanks, {form.name.split(" ")[0] || "there"} — we've got it.</p>
        <p className="text-sm" style={{ color: "#6B7280" }}>Our support team will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-[#14213D] mb-1.5 block">Name <span style={{ color: "#2563EB" }}>*</span></label>
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Enter your name"
          className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[#14213D] mb-1.5 block">Email Address <span style={{ color: "#2563EB" }}>*</span></label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[#14213D] mb-1.5 block">Mobile Number <span style={{ color: "#2563EB" }}>*</span></label>
        <input
          required
          type="tel"
          value={form.mobile}
          onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
          placeholder="Enter your mobile number"
          className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[#14213D] mb-1.5 block">You are a <span style={{ color: "#2563EB" }}>*</span></label>
        <select
          required
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
          className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white"
        >
          <option value="">-select-</option>
          <option value="customer">Customer</option>
          <option value="worker">Worker</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-[#14213D] mb-1.5 block">Comment <span style={{ color: "#2563EB" }}>*</span></label>
        <textarea
          required
          rows={5}
          value={form.comment}
          onChange={(e) => update("comment", e.target.value)}
          placeholder="Enter your comment"
          className="w-full rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm text-[#14213D] bg-white resize-none"
        />
      </div>
      <button type="submit" className="w-full text-white font-semibold rounded-lg py-3" style={{ background: "#2563EB" }}>
        Submit
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFE]">
      <header className="border-b bg-white" style={{ borderColor: "#DCE8F7" }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6B7280]">
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <FixoraLogo size={26} />
            <span className="font-display font-bold text-[#14213D]">Fixora</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-14">
        <h1 className="display-font text-3xl md:text-4xl font-bold text-[#14213D] mb-2">You can find us here</h1>
        <p className="text-sm mb-8" style={{ color: "#2563EB" }}>Find help for your queries here:</p>
        <ContactForm />

        <div className="grid sm:grid-cols-3 gap-4 mt-10 pt-8 border-t" style={{ borderColor: "#DCE8F7" }}>
          <a href="tel:+911800123456" className="flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
            <PhoneCall size={15} color="#2563EB" /> 1800-123-456
          </a>
          <a href="mailto:support@fixora.app" className="flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
            <Mail size={15} color="#2563EB" /> support@fixora.app
          </a>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
            <MapPin size={15} color="#2563EB" /> Bengaluru, India
          </div>
        </div>
      </main>
    </div>
  );
}
