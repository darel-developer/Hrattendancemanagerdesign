import React, { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useAuth } from "../../context/AuthContext";
import { LayoutContext } from "../../context/LayoutContext";

export function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Silent background geolocation permission request at app start.
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  // Reload the page when a new service worker activates so users always
  // run the latest version of the app.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onSwMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string })?.type === "SW_UPDATED") {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("message", onSwMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onSwMessage);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--hr-page-bg)" }}>
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return (
    <LayoutContext.Provider value={{ mobileOpen, setMobileOpen }}>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--hr-page-bg)" }}>
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        {/* Sidebar: fixed overlay on mobile, static on desktop */}
        <div
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto transition-transform duration-300 md:transform-none w-72 md:w-auto ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
