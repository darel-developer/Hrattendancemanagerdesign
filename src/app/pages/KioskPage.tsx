import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, MapPin, AlertTriangle, Loader2, QrCode, Smartphone, LogOut, Eye, EyeOff } from "lucide-react";
import QRCode from "qrcode";
import { kioskAuthApi } from "../services/api";
import { getDeviceId } from "../utils/deviceId";

const API_BASE = import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/api` : "/api";
const KIOSK_SESSION_KEY = "hr_kiosk";

interface KioskSession {
  token: string;
  companyId: string;
  companyName: string;
  label: string | null;
}

// ─── Persist / restore kiosk session ─────────────────────────────────────────
function saveKioskSession(session: KioskSession) {
  localStorage.setItem(KIOSK_SESSION_KEY, JSON.stringify(session));
}
function loadKioskSession(): KioskSession | null {
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as KioskSession;
    // Decode JWT to check expiry without a library
    const payload = JSON.parse(atob(s.token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(KIOSK_SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    localStorage.removeItem(KIOSK_SESSION_KEY);
    return null;
  }
}
function clearKioskSession() {
  localStorage.removeItem(KIOSK_SESSION_KEY);
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── QR Token — auto-refresh every 15 seconds using kiosk JWT ────────────────
function useQrToken(session: KioskSession | null) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const appBase = import.meta.env.VITE_APP_URL || window.location.origin;

  const fetchToken = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/kiosk/token/${encodeURIComponent(session.companyId)}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) throw new Error("token_error");
      const data = await res.json();
      const scanUrl = `${appBase}/kiosk/scan?t=${encodeURIComponent(data.token)}&c=${encodeURIComponent(session.companyId)}`;
      const dataUrl = await QRCode.toDataURL(scanUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#1E1B4B", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
      setSecondsLeft(15);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session, appBase]);

  useEffect(() => {
    if (!session) return;
    fetchToken();
    const id = setInterval(fetchToken, 15000);
    return () => clearInterval(id);
  }, [fetchToken, session]);

  useEffect(() => {
    if (!qrDataUrl) return;
    setSecondsLeft(15);
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [qrDataUrl]);

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(fetchToken, 5000);
    return () => clearTimeout(id);
  }, [error, fetchToken]);

  return { qrDataUrl, secondsLeft, loading, error };
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function KioskLoginForm({ onSuccess }: { onSuccess: (session: KioskSession) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await kioskAuthApi.login(email.trim(), password, getDeviceId());
      const session: KioskSession = {
        token: result.token,
        companyId: result.companyId,
        companyName: result.companyName,
        label: result.label,
      };
      saveKioskSession(session);
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            <QrCode size={28} className="text-white" />
          </div>
          <h1 className="text-white text-2xl" style={{ fontWeight: 800 }}>Terminal de Pointage</h1>
          <p className="text-sm mt-1" style={{ color: "#8B7CF8" }}>Connexion compte kiosk</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#94A3B8", fontWeight: 600 }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kiosk@entreprise.com"
              autoComplete="username"
              required
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.12)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#94A3B8", fontWeight: 600 }}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none pr-11"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#6B7280" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#FCA5A5" }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full py-3.5 rounded-xl text-white text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: loading || !email.trim() || !password
                ? "rgba(99,102,241,0.35)"
                : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: "#334155" }}>
          Ce terminal est configuré par l'administrateur de l'entreprise.
        </p>
      </motion.div>
    </div>
  );
}

// ─── QR Display Page ─────────────────────────────────────────────────────────
function KioskQrDisplay({ session, onLogout }: { session: KioskSession; onLogout: () => void }) {
  const now = useClock();
  const { qrDataUrl, secondsLeft, loading: qrLoading, error: qrError } = useQrToken(session);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white text-base" style={{ fontWeight: 800 }}>
              {session.companyName}
            </p>
            <p className="text-xs" style={{ color: "#8B7CF8" }}>
              {session.label ? session.label : "Terminal de pointage"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Horloge */}
          <div className="text-right">
            <p
              className="text-white text-3xl"
              style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}
            >
              {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* ── QR centré ── */}
      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Titre */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode size={20} style={{ color: "#8B5CF6" }} />
              <p className="text-white text-xl" style={{ fontWeight: 800 }}>Scanner pour pointer</p>
            </div>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Ouvrez l'application HR Manager et scannez ce code
            </p>
          </div>

          {/* QR image */}
          <div
            className="relative rounded-3xl overflow-hidden flex items-center justify-center"
            style={{
              width: 300,
              height: 300,
              background: "#ffffff",
              boxShadow: "0 0 60px rgba(99,102,241,0.25)",
            }}
          >
            {qrLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 size={36} className="animate-spin" style={{ color: "#6366F1" }} />
              </div>
            )}
            {qrError && !qrLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white">
                <AlertTriangle size={32} style={{ color: "#EF4444" }} />
                <p className="text-sm font-semibold text-red-500">Erreur réseau</p>
                <p className="text-xs text-gray-400">Nouvelle tentative dans 5 s…</p>
              </div>
            )}
            {qrDataUrl && !qrLoading && (
              <motion.img
                key={qrDataUrl}
                src={qrDataUrl}
                alt="QR Code"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-contain p-3"
              />
            )}
          </div>

          {/* Countdown bar */}
          <div className="w-full space-y-1.5">
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    secondsLeft > 7
                      ? "linear-gradient(90deg, #6366F1, #8B5CF6)"
                      : secondsLeft > 3
                      ? "#F59E0B"
                      : "#EF4444",
                  width: `${(secondsLeft / 15) * 100}%`,
                  transition: "width 1s linear, background 0.3s",
                }}
              />
            </div>
            <p
              className="text-xs text-center tabular-nums"
              style={{ color: secondsLeft > 7 ? "#64748B" : secondsLeft > 3 ? "#F59E0B" : "#EF4444" }}
            >
              Nouveau QR dans {secondsLeft} s
            </p>
          </div>

          {/* Instructions */}
          <div
            className="w-full rounded-2xl p-4"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={13} style={{ color: "#8B5CF6" }} />
              <p className="text-xs" style={{ color: "#A5B4FC", fontWeight: 700 }}>Comment pointer ?</p>
            </div>
            <ol className="space-y-1.5">
              {[
                "Ouvrez l'app HR Manager sur votre téléphone",
                "Connectez-vous avec votre compte",
                "Pointez votre caméra sur le QR code",
                "Confirmez votre pointage sur l'écran",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                  <span
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(99,102,241,0.3)",
                      color: "#A5B4FC",
                      fontWeight: 700,
                      fontSize: "10px",
                    }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-8 pb-4 flex items-center justify-between">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
          style={{ color: "#374151" }}
        >
          <LogOut size={11} />
          Déconnexion
        </button>
        <p className="text-xs" style={{ color: "#1E293B" }}>
          Terminal HR Manager · Pointage sécurisé
        </p>
      </div>

      {/* Logout confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.7)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-xs text-center"
              style={{ background: "#1E1B4B", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <LogOut size={28} className="mx-auto mb-3" style={{ color: "#EF4444" }} />
              <p className="text-white text-base mb-1" style={{ fontWeight: 700 }}>Déconnecter ce terminal ?</p>
              <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>
                La session sera effacée. Un identifiant kiosk sera requis pour reconnecter cet appareil.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8" }}
                >
                  Annuler
                </button>
                <button
                  onClick={onLogout}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", fontWeight: 700 }}
                >
                  Déconnecter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main KioskPage ───────────────────────────────────────────────────────────
export function KioskPage() {
  const [kioskSession, setKioskSession] = useState<KioskSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = loadKioskSession();
    setKioskSession(session);
    setChecking(false);
  }, []);

  const handleLoginSuccess = (session: KioskSession) => {
    setKioskSession(session);
  };

  const handleLogout = () => {
    clearKioskSession();
    setKioskSession(null);
  };

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 100%)" }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: "#6366F1" }} />
      </div>
    );
  }

  if (!kioskSession) {
    return <KioskLoginForm onSuccess={handleLoginSuccess} />;
  }

  return <KioskQrDisplay session={kioskSession} onLogout={handleLogout} />;
}
