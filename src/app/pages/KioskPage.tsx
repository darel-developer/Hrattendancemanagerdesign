import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, MapPin, AlertTriangle, Loader2, QrCode, Smartphone, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { kioskApi, companiesApi } from "../services/api";
import { Company } from "../data/mockData";

// ─── Types ─────────────────────────────────────────────────────────────────────
type KioskEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  position: string;
  department: string;
};

type GeoStatus = "idle" | "checking" | "allowed" | "denied" | "error" | "unavailable";

// ─── Clock hook ────────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Geolocation hook (watchPosition for real-time) ───────────────────────────
function useGeolocation(
  companyLat: number | null | undefined,
  companyLng: number | null | undefined,
  geoRadius: number
) {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    if (companyLat == null || companyLng == null) { setStatus("allowed"); return; }
    if (!navigator.geolocation) { setStatus("unavailable"); return; }
    setStatus("checking");
    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      const dist = Math.round(haversine(latitude, longitude, companyLat, companyLng));
      setDistance(dist);
      setStatus(dist <= geoRadius ? "allowed" : "denied");
    };
    const watchId = navigator.geolocation.watchPosition(onSuccess, () => setStatus("error"), {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [companyLat, companyLng, geoRadius]);

  const retry = useCallback(() => {
    if (companyLat == null || companyLng == null) return;
    setStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const dist = Math.round(haversine(latitude, longitude, companyLat, companyLng));
        setDistance(dist);
        setStatus(dist <= geoRadius ? "allowed" : "denied");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [companyLat, companyLng, geoRadius]);

  return { status, coords, distance, retry };
}

// ─── QR Token hook — auto-refreshes every 9 seconds ──────────────────────────
function useQrToken(companyId: string | null) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const appBase = import.meta.env.VITE_APP_URL || window.location.origin;

  const fetchToken = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await kioskApi.getToken(companyId);
      setToken(res.token);
      const exp = new Date(res.expiresAt);
      setExpiresAt(exp);
      setSecondsLeft(Math.max(0, Math.floor((exp.getTime() - Date.now()) / 1000)));

      // Build the deep-link URL the employee's phone will open
      const scanUrl = `${appBase}/kiosk/scan?t=${encodeURIComponent(res.token)}&c=${encodeURIComponent(companyId)}`;
      const dataUrl = await QRCode.toDataURL(scanUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#1E1B4B", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [companyId, appBase]);

  // Refresh token every 9 seconds (token valid 30s, gives 21s buffer for scan)
  useEffect(() => {
    if (!companyId) return;
    fetchToken();
    const id = setInterval(fetchToken, 9000);
    return () => clearInterval(id);
  }, [fetchToken, companyId]);

  // Countdown ticker
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
    }, 500);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { qrDataUrl, token, secondsLeft, loading, error, refresh: fetchToken };
}

// ─── Company selector ──────────────────────────────────────────────────────────
function CompanySelector({ companies, onSelect }: { companies: Company[]; onSelect: (id: string) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
          <Building2 size={28} className="text-white" />
        </div>
        <h1 className="text-white text-2xl mb-2" style={{ fontWeight: 800 }}>Terminal de Pointage</h1>
        <p className="mb-8" style={{ color: "#94A3B8" }}>Sélectionnez votre entreprise</p>
        <div className="flex flex-col gap-3 w-80">
          {companies.map((c) => (
            <button key={c.id} onClick={() => onSelect(c.id)}
              className="px-6 py-4 rounded-2xl text-white text-left transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <p style={{ fontWeight: 700 }}>{c.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{c.sector}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main KioskPage ────────────────────────────────────────────────────────────
export function KioskPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<KioskEmployee[]>([]);
  const now = useClock();

  useEffect(() => {
    companiesApi.getAll().then((list) => {
      setCompanies(list);
      if (list.length === 1) setSelectedCompanyId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;
    kioskApi.getEmployees(selectedCompanyId).then(setEmployees).catch(console.error);
    const id = setInterval(() => {
      kioskApi.getEmployees(selectedCompanyId).then(setEmployees).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [selectedCompanyId]);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const { status: geoStatus, coords, distance, retry: retryGeo } = useGeolocation(
    selectedCompany?.latitude,
    selectedCompany?.longitude,
    selectedCompany?.geoRadius ?? 100
  );

  const geoRequired = selectedCompany?.latitude != null && selectedCompany?.longitude != null;

  const { qrDataUrl, secondsLeft, loading: qrLoading, error: qrError, refresh: refreshQr } =
    useQrToken(selectedCompanyId);

  if (!selectedCompanyId && companies.length > 1) {
    return <CompanySelector companies={companies} onSelect={setSelectedCompanyId} />;
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white text-base" style={{ fontWeight: 800 }}>
              {selectedCompany?.name || "Terminal Pointage"}
            </p>
            <p className="text-xs" style={{ color: "#8B7CF8" }}>Terminal de pointage</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {geoRequired && (
            <div className="flex items-center gap-2">
              {geoStatus === "checking" && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <Loader2 size={12} className="text-amber-400 animate-spin" />
                  <p className="text-xs text-amber-400" style={{ fontWeight: 600 }}>Localisation…</p>
                </div>
              )}
              {geoStatus === "allowed" && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <MapPin size={12} style={{ color: "#10B981" }} />
                  <p className="text-xs" style={{ color: "#10B981", fontWeight: 600 }}>
                    Zone autorisée{distance != null ? ` · ${distance} m` : ""}
                  </p>
                </div>
              )}
              {(geoStatus === "denied" || geoStatus === "error" || geoStatus === "unavailable") && (
                <button onClick={retryGeo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <AlertTriangle size={12} style={{ color: "#EF4444" }} />
                  <p className="text-xs" style={{ color: "#EF4444", fontWeight: 600 }}>
                    {geoStatus === "denied"
                      ? `Hors zone · ${distance != null ? `${distance} m` : ""}`
                      : "GPS indisponible"}
                  </p>
                </button>
              )}
            </div>
          )}

          <div className="text-right">
            <p className="text-white text-3xl" style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bannière hors zone ── */}
      <AnimatePresence>
        {geoRequired && geoStatus === "denied" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-6 mb-2 px-5 py-3 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertTriangle size={18} style={{ color: "#EF4444" }} className="flex-shrink-0" />
            <div>
              <p className="text-sm" style={{ color: "#EF4444", fontWeight: 700 }}>
                Vous devez être à proximité de l'entreprise pour pointer.
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#F87171" }}>
                Distance actuelle : {distance ?? "?"} m · Rayon autorisé : {selectedCompany?.geoRadius ?? 100} m
              </p>
            </div>
            <button onClick={retryGeo}
              className="ml-auto text-xs px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444", fontWeight: 700 }}>
              Réessayer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex gap-6 px-6 pb-6 min-h-0">

        {/* ── Employee list (left) ── */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs mb-4 uppercase tracking-widest" style={{ color: "#94A3B8", fontWeight: 700 }}>
            Employés ({employees.length})
          </p>
          <div className="grid grid-cols-3 gap-3">
            {employees.map((emp) => (
              <div key={emp.id}
                className="flex flex-col items-center p-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={emp.avatar} alt={emp.firstName}
                  className="w-12 h-12 rounded-xl object-cover mb-2"
                  style={{ border: "1.5px solid rgba(255,255,255,0.12)" }} />
                <p className="text-white text-xs text-center leading-tight" style={{ fontWeight: 700 }}>
                  {emp.firstName}<br />{emp.lastName}
                </p>
                <p className="text-xs mt-0.5 text-center truncate w-full" style={{ color: "#6B7280" }}>
                  {emp.position}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── QR Panel (right) ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">

          {/* QR Code card */}
          <div className="rounded-3xl overflow-hidden flex flex-col items-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", padding: "1.5rem" }}>

            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} style={{ color: "#8B5CF6" }} />
              <p className="text-white text-sm" style={{ fontWeight: 700 }}>Scanner pour pointer</p>
            </div>

            {/* QR image */}
            <div className="relative w-64 h-64 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "#ffffff" }}>
              {qrLoading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#ffffff" }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: "#6366F1" }} />
                </div>
              )}
              {qrError && !qrLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{ background: "#ffffff" }}>
                  <AlertTriangle size={28} style={{ color: "#EF4444" }} />
                  <p className="text-xs text-red-500 font-semibold">Erreur réseau</p>
                  <button onClick={refreshQr}
                    className="text-xs px-3 py-1.5 rounded-lg text-indigo-600 font-bold"
                    style={{ background: "rgba(99,102,241,0.1)" }}>
                    Réessayer
                  </button>
                </div>
              )}
              {qrDataUrl && !qrLoading && (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain p-2" />
              )}
            </div>

            {/* Countdown */}
            <div className="mt-4 flex items-center gap-3 w-full">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: secondsLeft > 10
                      ? "linear-gradient(90deg, #6366F1, #8B5CF6)"
                      : secondsLeft > 5
                      ? "linear-gradient(90deg, #F59E0B, #EF4444)"
                      : "#EF4444",
                    width: `${(secondsLeft / 30) * 100}%`,
                    transition: "width 0.5s linear, background 0.3s",
                  }}
                />
              </div>
              <span className="text-xs tabular-nums" style={{
                color: secondsLeft > 10 ? "#94A3B8" : secondsLeft > 5 ? "#F59E0B" : "#EF4444",
                fontWeight: 700, minWidth: "24px",
              }}>
                {secondsLeft}s
              </span>
              <button onClick={refreshQr}
                className="p-1 rounded-lg transition-all hover:opacity-70"
                style={{ color: "#6366F1" }}>
                <RefreshCw size={14} />
              </button>
            </div>

            <p className="text-xs text-center mt-3" style={{ color: "#64748B" }}>
              QR code valide 30 s · se régénère automatiquement
            </p>
          </div>

          {/* Instructions card */}
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={14} style={{ color: "#8B5CF6" }} />
              <p className="text-xs" style={{ color: "#A5B4FC", fontWeight: 700 }}>Comment pointer ?</p>
            </div>
            <ol className="space-y-1.5">
              {[
                "Ouvrez l'application HR Manager sur votre téléphone",
                "Connectez-vous avec votre compte",
                "Scannez ce QR code avec la caméra",
                "Confirmez votre pointage",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#94A3B8" }}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "rgba(99,102,241,0.3)", color: "#A5B4FC", fontWeight: 700 }}>
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
      <div className="px-6 pb-4 flex items-center justify-between">
        <a href="/login" className="text-xs hover:underline" style={{ color: "#6366F1" }}>
          → Connexion administrateur
        </a>
        <p className="text-xs" style={{ color: "#475569" }}>
          Terminal HR Manager · Pointage sécurisé par QR Code
        </p>
      </div>
    </div>
  );
}
