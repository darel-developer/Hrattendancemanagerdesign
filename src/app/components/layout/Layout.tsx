import React, { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useAuth } from "../../context/AuthContext";
import { LayoutContext } from "../../context/LayoutContext";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { AppLogo } from "../AppLogo";

type GeoGateState = "checking" | "idle" | "waiting" | "granted" | "denied" | "unavailable";

function GeoPermissionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GeoGateState>("checking");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState("unavailable");
      return;
    }
    if (!("permissions" in navigator)) {
      setState("idle");
      return;
    }
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (result.state === "granted") setState("granted");
        else if (result.state === "denied") setState("denied");
        else setState("idle");
        result.addEventListener("change", () => {
          if (result.state === "granted") setState("granted");
          else if (result.state === "denied") setState("denied");
        });
      })
      .catch(() => setState("idle"));
  }, []);

  const requestPermission = () => {
    setState("waiting");
    navigator.geolocation.getCurrentPosition(
      () => setState("granted"),
      (err) => {
        // PERMISSION_DENIED → block; timeout/unavailable → let through (GPS issue, not permission)
        if (err.code === err.PERMISSION_DENIED) setState("denied");
        else setState("granted");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (state === "granted") return <>{children}</>;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-6 z-[100]"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #0B1437 100%)" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 left-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "#6366F1" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "#8B5CF6" }}
      />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {/* App brand */}
        <div className="flex items-center gap-3 mb-2">
          <AppLogo size={44} />
          <div className="text-left">
            <p className="text-white text-base" style={{ fontWeight: 800 }}>HR Manager</p>
            <p className="text-xs" style={{ color: "#6B7280" }}>Système de présences</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Checking permissions */}
          {state === "checking" && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 size={32} className="text-indigo-400 animate-spin" />
              <p className="text-sm" style={{ color: "#94A3B8" }}>Vérification en cours…</p>
            </motion.div>
          )}

          {/* Prompt — explain and request */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.2)", border: "2px solid rgba(99,102,241,0.5)" }}
              >
                <MapPin size={38} style={{ color: "#6366F1" }} />
              </div>
              <div className="space-y-2">
                <p className="text-white text-lg" style={{ fontWeight: 800 }}>Localisation requise</p>
                <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                  Le système de pointage utilise votre position GPS pour vérifier votre présence sur site.
                  Cette autorisation est obligatoire pour utiliser l'application.
                </p>
              </div>
              <div
                className="w-full p-4 rounded-2xl text-left space-y-2.5"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}
              >
                {[
                  "Vérifier votre présence sur site",
                  "Valider les pointages entrée / sortie",
                  "Sécuriser contre les fraudes de présence",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2.5">
                    <ShieldCheck size={14} style={{ color: "#6366F1", flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "#A5B4FC" }}>{t}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={requestPermission}
                className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  fontWeight: 700,
                  fontSize: "15px",
                }}
              >
                <MapPin size={17} />
                Autoriser la géolocalisation
              </button>
            </motion.div>
          )}

          {/* Waiting for browser dialog */}
          {state === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.15)", border: "2px solid #6366F1" }}
              >
                <Loader2 size={32} className="text-indigo-400 animate-spin" />
              </div>
              <p className="text-white text-sm" style={{ fontWeight: 700 }}>Autorisation en cours…</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>Répondez à la demande de permission du navigateur</p>
            </motion.div>
          )}

          {/* Permission denied */}
          {state === "denied" && (
            <motion.div
              key="denied"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.5)" }}
              >
                <AlertTriangle size={38} style={{ color: "#EF4444" }} />
              </div>
              <div className="space-y-2">
                <p className="text-white text-lg" style={{ fontWeight: 800 }}>Accès refusé</p>
                <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                  La géolocalisation a été bloquée. Activez-la dans les paramètres de votre navigateur pour continuer.
                </p>
              </div>
              <div
                className="w-full p-4 rounded-2xl text-left space-y-2"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <p className="text-xs" style={{ color: "#FCA5A5", fontWeight: 700 }}>Comment l'activer :</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>① Appuyez sur l'icône 🔒 ou ℹ️ dans la barre d'adresse</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>② Touchez « Localisation » → « Autoriser »</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>③ Rechargez la page</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-2xl text-white transition-all active:scale-95"
                style={{ background: "rgba(99,102,241,0.25)", border: "1.5px solid #6366F1", fontWeight: 600 }}
              >
                Recharger la page
              </button>
            </motion.div>
          )}

          {/* GPS unavailable (desktop / unsupported browser) */}
          {state === "unavailable" && (
            <motion.div
              key="unavailable"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.5)" }}
              >
                <AlertTriangle size={38} style={{ color: "#F59E0B" }} />
              </div>
              <div className="space-y-2">
                <p className="text-white text-lg" style={{ fontWeight: 800 }}>GPS non disponible</p>
                <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                  Votre navigateur ne supporte pas la géolocalisation. Le pointage sur site sera indisponible.
                  Vous pouvez continuer en mode bureau pour les fonctions d'administration.
                </p>
              </div>
              <button
                onClick={() => setState("granted")}
                className="w-full py-3.5 rounded-2xl text-white transition-all active:scale-95"
                style={{ background: "rgba(99,102,241,0.25)", border: "1.5px solid #6366F1", fontWeight: 600 }}
              >
                Continuer en mode bureau
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--hr-page-bg)" }}>
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <GeoPermissionGate>
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
    </GeoPermissionGate>
  );
}
