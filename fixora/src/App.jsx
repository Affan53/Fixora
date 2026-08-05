import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded so a crash in one page's code (e.g. a map or WebSocket
// library failing to initialize) only breaks that page, not the entire site.
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const BookService = lazy(() => import("./pages/BookService"));
const WorkerOnboarding = lazy(() => import("./pages/WorkerOnboarding"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const WorkerDashboard = lazy(() => import("./pages/WorkerDashboard"));
const TrackingPage = lazy(() => import("./pages/TrackingPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// This one codebase produces two separate apps via `npm run build:customer`
// and `npm run build:worker` (see package.json + capacitor.*.config.json) —
// same split as Rapido's separate Customer and Captain apps. The worker
// build skips the marketing homepage entirely and opens straight to the
// worker login, since a partner app has no reason to show the customer
// storefront.
const IS_WORKER_APP = import.meta.env.MODE === "worker";

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFE] text-[#6B7280] text-sm font-mono">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/"
            element={IS_WORKER_APP ? <Navigate to="/login?role=worker" replace /> : <Landing />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/book/:categorySlug" element={<BookService />} />
          <Route
            path="/track/:bookingId"
            element={
              <ProtectedRoute role="CUSTOMER">
                <TrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="CUSTOMER">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/onboarding"
            element={
              <ProtectedRoute role="WORKER">
                <WorkerOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker"
            element={
              <ProtectedRoute role="WORKER">
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
