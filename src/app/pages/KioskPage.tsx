import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, MapPin, AlertTriangle, Loader2, QrCode, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { kioskApi, companiesApi } from "../services/api";
import { Company } from "../data/mockData";

type GeoStatus = "idle" | "checking" | "allowed" | "denied" | "error" | "unavailable";

// ─── Clock ─────────────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Geolocation (watchPosition) ──────────────────────────────────────────────
function useGeolocation(
  companyLat: number | null | undefined,
  companyLng: number | null | undefined,
  geoRadius: number
) {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [distance, setDistance] = useState<number | null>(null);

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000, toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    if (companyLat == null || companyLng == null) { setStatus("allowed"); return; }
    if (!navigator.geolocation) { setStatus("unavailable"); return; }
    setStatus("checking");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = Math.round(haversine(pos.coords.latitude, pos.coords.longitude, companyLat, companyLng));
        setDistance(dist);
        setStatus(dist <= geoRadius ? "allowed" : "denied");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [companyLat, companyLng, geoRadius]);

  const retry = useCallback(() => {
    if (companyLat == null || companyLng == null) return;
    setStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = Math.round(haversine(pos.coords.latitude, pos.coords.longitude, companyLat, companyLng));
        setDistance(dist);
        setStatus(dist <= geoRadius ? "allowed" : "denied");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [companyLat, companyLng, geoRadius]);

  return { status, distance, retry };
}

// ─── QR Token — auto-refresh toutes les 15 secondes ──────────────────────────
function useQrToken(companyId: string | null) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const appBase = import.meta.env.VITE_APP_URL || window.location.origin;

  const fetchToken = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await kioskApi.getToken(companyId);
      const scanUrl = `${appBase}/kiosk/scan?t=${encodeURIComponent(res.token)}&c=${encodeURIComponent(companyId)}`;
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
  }, [companyId, appBase]);

  // Génère un nouveau token toutes les 15 secondes
  useEffect(() => {
    if (!companyId) return;
    fetchToken();
    const id = setInterval(fetchToken, 15000);
    return () => clearInterval(id);
  }, [fetchToken, companyId]);

  // Décompte local
  useEffect(() => {
    if (!qrDataUrl) return;
    setSecondsLeft(15);
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [qrDataUrl]);

  // Retry automatique si erreur réseau (après 5 s)
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(fetchToken, 5000);
    return () => clearTimeout(id);
  }, [error, fetchToken]);

  return { qrDataUrl, secondsLeft, loading, error };
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
  const now = useClock();

  useEffect(() => {
    companiesApi.getAll().then((list) => {
      setCompanies(list);
      if (list.length === 1) setSelectedCompanyId(list[0].id);
    });
  }, []);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const { status: geoStatus, distance, retry: retryGeo } = useGeolocation(
    selectedCompany?.latitude,
    selectedCompany?.longitude,
    selectedCompany?.geoRadius ?? 100
  );

  const geoRequired = selectedCompany?.latitude != null && selectedCompany?.longitude != null;

  const { qrDataUrl, secondsLeft, loading: qrLoading, error: qrError } = useQrToken(selectedCompanyId);

  if (!selectedCompanyId && companies.length > 1) {
    return <CompanySelector companies={companies} onSelect={setSelectedCompanyId} />;
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-5">
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

        <div className="flex items-center gap-5">
          {/* Géo badge */}
          {geoRequired && (
            <>
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
                    {geoStatus === "denied" ? `Hors zone · ${distance ?? "?"} m` : "GPS indisponible"}
                  </p>
                </button>
              )}
            </>
          )}

          {/* Horloge */}
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
            className="mx-8 mb-2 px-5 py-3 rounded-2xl flex items-center gap-3"
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
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="relative rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ width: 300, height: 300, background: "#ffffff", boxShadow: "0 0 60px rgba(99,102,241,0.25)" }}>
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

          {/* Barre de décompte */}
          <div className="w-full space-y-1.5">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: secondsLeft > 7
                    ? "linear-gradient(90deg, #6366F1, #8B5CF6)"
                    : secondsLeft > 3
                    ? "#F59E0B"
                    : "#EF4444",
                  width: `${(secondsLeft / 15) * 100}%`,
                  transition: "width 1s linear, background 0.3s",
                }}
              />
            </div>
            <p className="text-xs text-center tabular-nums" style={{
              color: secondsLeft > 7 ? "#64748B" : secondsLeft > 3 ? "#F59E0B" : "#EF4444",
            }}>
              Nouveau QR dans {secondsLeft} s
            </p>
          </div>

          {/* Instructions */}
          <div className="w-full rounded-2xl p-4"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
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
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.3)", color: "#A5B4FC", fontWeight: 700, fontSize: "10px" }}>
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
