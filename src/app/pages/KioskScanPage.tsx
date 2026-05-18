import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, LogIn, LogOut, AlertTriangle, Loader2, MapPin } from "lucide-react";
import { kioskApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getDeviceId } from "../utils/deviceId";

type ScanState = "idle" | "loading" | "success" | "error";

type ScanResult = {
  action: "check_in" | "check_out";
  time: string;
  status?: string;
  hoursWorked?: number;
  employee: string;
};

export function KioskScanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();

  const token = searchParams.get("t") ?? "";
  const companyId = searchParams.get("c") ?? "";

  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Redirect to login if not authenticated, preserving the scan URL
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(`/kiosk/scan?t=${token}&c=${companyId}`);
      navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
    }
  }, [authLoading, isAuthenticated, token, companyId, navigate]);

  // Try to get GPS coords for geo-enabled companies
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  const handleScan = async () => {
    if (!token || !companyId || !currentUser) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await kioskApi.scan(
        token,
        companyId,
        getDeviceId(),
        geoCoords?.lat ?? null,
        geoCoords?.lng ?? null
      );
      setResult(res as ScanResult);
      setState("success");
      // Auto-redirect after 4 seconds
      setTimeout(() => navigate("/dashboard", { replace: true }), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors du pointage";
      setErrorMsg(msg);
      setState("error");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0B1437, #1E1B4B)" }}>
        <Loader2 size={36} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!token || !companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, #0B1437, #1E1B4B)" }}>
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-white text-lg font-bold mb-2">QR code invalide</p>
          <p className="text-slate-400 text-sm mb-6">Scannez un QR code valide depuis le kiosque.</p>
          <button onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0B1437, #1E1B4B)" }}>

      <AnimatePresence mode="wait">
        {/* ── Success screen ── */}
        {state === "success" && result && (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-center text-white"
            style={{ background: result.action === "check_in" ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.15)",
              border: `1px solid ${result.action === "check_in" ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.4)"}`,
              borderRadius: "2rem", padding: "3rem 2rem" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: result.action === "check_in" ? "rgba(16,185,129,0.25)" : "rgba(99,102,241,0.25)" }}>
              {result.action === "check_in"
                ? <LogIn size={36} style={{ color: "#10B981" }} />
                : <LogOut size={36} style={{ color: "#A5B4FC" }} />}
            </motion.div>
            <p className="text-2xl mb-1" style={{ fontWeight: 900 }}>
              {result.action === "check_in" ? "Arrivée enregistrée !" : "Départ enregistré !"}
            </p>
            <p className="text-lg opacity-80 mb-1">{result.employee}</p>
            <p className="text-4xl mt-3" style={{ fontWeight: 800 }}>{result.time}</p>
            {result.hoursWorked && (
              <p className="text-base mt-2 opacity-70">{result.hoursWorked}h travaillées</p>
            )}
            {result.status === "Retard" && (
              <span className="mt-3 px-4 py-1.5 rounded-full text-sm inline-block"
                style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B", fontWeight: 600 }}>
                Arrivée en retard
              </span>
            )}
            <p className="text-xs mt-5 opacity-50">Redirection dans 4 secondes…</p>
          </motion.div>
        )}

        {/* ── Error screen ── */}
        {state === "error" && (
          <motion.div key="error"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-center w-full max-w-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(239,68,68,0.2)" }}>
              <XCircle size={32} style={{ color: "#EF4444" }} />
            </div>
            <p className="text-white text-lg font-bold mb-2">Pointage refusé</p>
            <p className="text-sm text-center mb-6" style={{ color: "#FCA5A5" }}>{errorMsg}</p>
            <div className="flex gap-3">
              <button onClick={() => { setState("idle"); setErrorMsg(""); }}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                Réessayer
              </button>
              <button onClick={() => navigate("/dashboard")}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
                Tableau de bord
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Idle / confirm screen ── */}
        {(state === "idle" || state === "loading") && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm">

            {/* Employee card */}
            <div className="rounded-2xl p-5 mb-4 flex items-center gap-4"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <img src={currentUser?.avatar} alt={currentUser?.firstName}
                className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <p className="text-white font-bold">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{currentUser?.position}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6366F1" }}>{currentUser?.department}</p>
              </div>
            </div>

            {/* GPS status */}
            {geoLoading && (
              <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Loader2 size={13} className="animate-spin text-amber-400" />
                <p className="text-xs font-semibold text-amber-400">Récupération de votre position GPS…</p>
              </div>
            )}
            {!geoLoading && geoCoords && (
              <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <MapPin size={13} style={{ color: "#10B981" }} />
                <p className="text-xs font-semibold" style={{ color: "#6EE7B7" }}>Position GPS détectée</p>
              </div>
            )}

            {/* Confirm button */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleScan}
              disabled={state === "loading"}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 mb-3"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", opacity: state === "loading" ? 0.7 : 1 }}>
              {state === "loading"
                ? <><Loader2 size={20} className="animate-spin" />Vérification en cours…</>
                : <><CheckCircle size={20} />Confirmer mon pointage</>}
            </motion.button>

            <button onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 rounded-xl text-sm transition-all"
              style={{ color: "#94A3B8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
