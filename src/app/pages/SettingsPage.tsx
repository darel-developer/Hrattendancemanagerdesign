import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Building2, Bell, Shield, Palette, Globe, ChevronRight,
  Camera, Save, Lock, Mail, Phone, MapPin, Sun, Moon,
  Check, X, Eye, EyeOff, AlertCircle, Upload, Navigation,
  Smartphone, Trash2, RefreshCw, Loader2, MonitorSmartphone, Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { companiesApi, devicesApi, DeviceInfo, kioskAccountsApi, KioskAccount } from "../services/api";
import { Company } from "../data/mockData";

const sections = [
  { id: "profile", icon: User, label: "Profil personnel", roles: null },
  { id: "company", icon: Building2, label: "Entreprise", roles: null },
  { id: "devices", icon: Smartphone, label: "Appareils", roles: null },
  { id: "kiosk", icon: MonitorSmartphone, label: "Terminaux Kiosk", roles: ["Admin"] as string[] },
  { id: "notifications", icon: Bell, label: "Notifications", roles: null },
  { id: "security", icon: Shield, label: "Sécurité", roles: null },
  { id: "appearance", icon: Palette, label: "Apparence", roles: null },
  { id: "language", icon: Globe, label: "Langue & Région", roles: null },
];

// ─── Device management panel ─────────────────────────────────────────────────
function DevicesPanel({ isAdmin }: { isAdmin: boolean }) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [myDevice, setMyDevice] = useState<{ registered: boolean; deviceName?: string; registeredAt?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, list] = await Promise.all([
        devicesApi.me(),
        isAdmin ? devicesApi.list() : Promise.resolve([] as DeviceInfo[]),
      ]);
      setMyDevice(me);
      setDevices(list);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { void load(); }, [load]);

  const handleReset = async (employeeId: string) => {
    if (!window.confirm("Réinitialiser l'appareil de cet employé ? Il devra se reconnecter pour enregistrer son nouvel appareil.")) return;
    setResetting(employeeId);
    try {
      await devicesApi.reset(employeeId);
      await load();
    } catch { /* ignore */ }
    finally { setResetting(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--hr-text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My device */}
      <div className="rounded-2xl p-5" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
        <p className="text-sm font-bold mb-4" style={{ color: "var(--hr-text)" }}>Mon appareil enregistré</p>
        {myDevice?.registered ? (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.15)" }}>
              <Smartphone size={16} style={{ color: "#10B981" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--hr-text)" }}>{myDevice.deviceName}</p>
              {myDevice.registeredAt && (
                <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-muted)" }}>
                  Enregistré le {new Date(myDevice.registeredAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>Actif</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
            <p className="text-xs font-semibold" style={{ color: "#D97706" }}>
              Aucun appareil enregistré. Déconnectez-vous et reconnectez-vous pour enregistrer cet appareil.
            </p>
          </div>
        )}
      </div>

      {/* Admin: all devices */}
      {isAdmin && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--hr-text)" }}>Appareils enregistrés ({devices.length})</p>
            <button onClick={() => void load()} className="p-1.5 rounded-lg transition-all hover:opacity-70" style={{ color: "var(--hr-text-muted)" }}>
              <RefreshCw size={14} />
            </button>
          </div>
          {devices.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--hr-text-muted)" }}>Aucun appareil enregistré</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--hr-card-border)" }}>
              {devices.map((d) => (
                <div key={d.employeeId} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--hr-hover)" }}>
                    <Smartphone size={14} style={{ color: "var(--hr-text-muted)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--hr-text)" }}>
                      {d.firstName} {d.lastName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--hr-text-muted)" }}>
                      {d.deviceName} · {d.department}
                    </p>
                    {d.lastSeenAt && (
                      <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                        Vu le {new Date(d.lastSeenAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => void handleReset(d.employeeId)}
                    disabled={resetting === d.employeeId}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {resetting === d.employeeId
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />}
                    Réinitialiser
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Kiosk Accounts panel ─────────────────────────────────────────────────────
function KioskAccountsPanel() {
  const [accounts, setAccounts] = useState<KioskAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLabel, setCreateLabel] = useState("");
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await kioskAccountsApi.list();
      setAccounts(rows);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createEmail.trim() || !createPassword) return;
    setCreating(true);
    try {
      const account = await kioskAccountsApi.create({
        email: createEmail.trim(),
        password: createPassword,
        label: createLabel.trim() || undefined,
      });
      setAccounts((prev) => [account, ...prev]);
      setShowCreate(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateLabel("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce compte kiosk ? Le terminal sera déconnecté.")) return;
    setDeletingId(id);
    try {
      await kioskAccountsApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const handleResetDevice = async (id: number) => {
    if (!window.confirm("Réinitialiser l'appareil lié à ce compte ? Le terminal devra se reconnecter.")) return;
    setResettingId(id);
    try {
      await kioskAccountsApi.resetDevice(id);
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, deviceBound: false } : a));
    } catch { /* ignore */ }
    finally { setResettingId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--hr-text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl p-5" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--hr-text)" }}>Terminaux Kiosk</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
              Créez des comptes dédiés pour chaque terminal de pointage.
            </p>
          </div>
          <button
            onClick={() => { setShowCreate((v) => !v); setCreateError(null); }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white", fontWeight: 700 }}
          >
            <Plus size={13} />
            Créer un terminal
          </button>
        </div>

        {/* Inline create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreate}
              className="mt-4 pt-4 border-t space-y-3"
              style={{ borderColor: "var(--hr-card-border-hard)" }}
            >
              <p className="text-xs font-bold" style={{ color: "var(--hr-text-sec)" }}>Nouveau terminal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
                    Email du terminal <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="kiosk-hall@entreprise.com"
                    required
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
                    Étiquette (optionnel)
                  </label>
                  <input
                    type="text"
                    value={createLabel}
                    onChange={(e) => setCreateLabel(e.target.value)}
                    placeholder="Ex: Hall d'entrée"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
                  Mot de passe <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePwd ? "text" : "password"}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none pr-10"
                    style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--hr-text-muted)" }}
                  >
                    {showCreatePwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {createError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#FEE2E2" }}>
                  <AlertCircle size={13} style={{ color: "#DC2626" }} />
                  <p className="text-xs" style={{ color: "#DC2626", fontWeight: 600 }}>{createError}</p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(null); setCreateEmail(""); setCreatePassword(""); setCreateLabel(""); }}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || !createEmail.trim() || !createPassword}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    fontWeight: 700,
                    opacity: creating || !createEmail.trim() || !createPassword ? 0.6 : 1,
                  }}
                >
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {creating ? "Création…" : "Créer"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Accounts list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--hr-text)" }}>
            Comptes créés ({accounts.length})
          </p>
          <button onClick={() => void load()} className="p-1.5 rounded-lg transition-all hover:opacity-70" style={{ color: "var(--hr-text-muted)" }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <MonitorSmartphone size={28} style={{ color: "var(--hr-text-light)" }} />
            <p className="text-sm" style={{ color: "var(--hr-text-muted)" }}>Aucun terminal créé</p>
            <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Cliquez sur "Créer un terminal" pour commencer.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--hr-card-border)" }}>
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: account.isActive ? "rgba(99,102,241,0.1)" : "var(--hr-hover)" }}
                >
                  <MonitorSmartphone size={15} style={{ color: account.isActive ? "#6366F1" : "var(--hr-text-muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--hr-text)" }}>
                    {account.label || account.email}
                  </p>
                  {account.label && (
                    <p className="text-xs truncate" style={{ color: "var(--hr-text-muted)" }}>{account.email}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: account.deviceBound ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                        color: account.deviceBound ? "#10B981" : "#F59E0B",
                        fontWeight: 600,
                      }}
                    >
                      {account.deviceBound ? "Appareil lié" : "Aucun appareil"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                      Créé le {new Date(account.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {account.deviceBound && (
                    <button
                      onClick={() => void handleResetDevice(account.id)}
                      disabled={resettingId === account.id}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl transition-all hover:opacity-80"
                      style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      {resettingId === account.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      Réinitialiser
                    </button>
                  )}
                  <button
                    onClick={() => void handleDelete(account.id)}
                    disabled={deletingId === account.id}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    {deletingId === account.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { currentUser, currentCompany, updateEmployee, changePassword, refreshCompany } = useAuth();
  const { theme, setTheme, language, setLanguage, isDark } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const s = localStorage.getItem("hr_notif_settings");
      if (s) return { absences: true, retards: true, conges: true, documents: true, email: false, system: true, ...JSON.parse(s) };
    } catch {}
    return { absences: true, retards: true, conges: true, documents: true, email: false, system: true };
  });

  const updateNotifSetting = (key: string, value: boolean) => {
    const next = { ...notifSettings, [key]: value };
    setNotifSettings(next);
    localStorage.setItem("hr_notif_settings", JSON.stringify(next));
  };

  // Photo modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<string>("");
  const [photoSaving, setPhotoSaving] = useState(false);

  // Password change
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Company form
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({});
  const [companySaving, setCompanySaving] = useState(false);
  const [geoDetecting, setGeoDetecting] = useState(false);
  const [geoDetectError, setGeoDetectError] = useState("");

  useEffect(() => {
    if (currentCompany) {
      setCompanyForm({
        name: currentCompany.name,
        sector: currentCompany.sector,
        address: currentCompany.address,
        hrEmail: currentCompany.hrEmail,
        workStart: currentCompany.workStart,
        lateTolerance: currentCompany.lateTolerance,
        latitude: currentCompany.latitude ?? null,
        longitude: currentCompany.longitude ?? null,
        geoRadius: currentCompany.geoRadius ?? 100,
      });
    }
  }, [currentCompany]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoFile(reader.result as string);
      setPhotoUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSave = async () => {
    const avatar = photoFile || photoUrl.trim();
    if (!avatar || !currentUser) return;
    setPhotoSaving(true);
    try {
      await updateEmployee(currentUser.id, { avatar });
      setShowPhotoModal(false);
      setPhotoFile("");
      setPhotoUrl("");
    } finally {
      setPhotoSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdError("");
    if (!pwdForm.next) { setPwdError("Entrez un nouveau mot de passe"); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Les mots de passe ne correspondent pas"); return; }
    if (pwdForm.next.length < 6) { setPwdError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    setPwdSaving(true);
    try {
      await changePassword(pwdForm.current, pwdForm.next);
      setPwdSaved(true);
      setPwdForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err: any) {
      setPwdError(err.message || "Erreur lors du changement");
    } finally {
      setPwdSaving(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoDetectError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    setGeoDetecting(true);
    setGeoDetectError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000000) / 10000000;
        const lng = Math.round(pos.coords.longitude * 10000000) / 10000000;
        setCompanyForm((p) => ({ ...p, latitude: lat, longitude: lng }));
        setGeoDetecting(false);
        // Auto-sauvegarde immédiate en base dès la détection
        if (currentCompany) {
          try {
            await companiesApi.update(currentCompany.id, {
              ...companyForm,
              latitude: lat,
              longitude: lng,
            });
            await refreshCompany();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          } catch {
            setGeoDetectError("Position détectée mais la sauvegarde a échoué. Cliquez sur Enregistrer.");
          }
        }
      },
      () => {
        setGeoDetectError("Impossible d'obtenir la position. Vérifiez les permissions du navigateur.");
        setGeoDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCompanySave = async () => {
    if (!currentCompany) return;
    setCompanySaving(true);
    try {
      await companiesApi.update(currentCompany.id, companyForm);
      await refreshCompany();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setCompanySaving(false);
    }
  };

  const themeOptions = [
    { id: "light", label: "Clair", description: "Interface lumineuse", icon: Sun, preview: "#F0F2F8" },
    { id: "dark", label: "Sombre", description: "Interface sombre, reposante", icon: Moon, preview: "#0F172A" },
  ] as const;

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷", region: "France" },
    { code: "en", label: "English", flag: "🇬🇧", region: "United Kingdom" },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5 max-w-5xl">
      {/* Photo URL modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowPhotoModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "var(--hr-card)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Changer la photo de profil</h3>
                <button onClick={() => setShowPhotoModal(false)}>
                  <X size={16} style={{ color: "var(--hr-text-muted)" }} />
                </button>
              </div>
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
                  Depuis l'appareil
                </label>
                <label
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1.5px dashed rgba(99,102,241,0.5)" }}
                >
                  <Upload size={14} style={{ color: "#6366F1" }} />
                  <span className="text-sm" style={{ color: "#6366F1", fontWeight: 600 }}>
                    {photoFile ? "Photo sélectionnée ✓" : "Choisir une photo"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
                  Ou par URL
                </label>
                <input
                  value={photoUrl}
                  onChange={(e) => { setPhotoUrl(e.target.value); setPhotoFile(""); }}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                />
              </div>
              {(photoFile || photoUrl) && (
                <img src={photoFile || photoUrl} alt="Aperçu" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4"
                  onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowPhotoModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>
                  Annuler
                </button>
                <button onClick={handlePhotoSave} disabled={(!photoFile && !photoUrl.trim()) || photoSaving}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: (!photoFile && !photoUrl.trim()) ? 0.5 : 1 }}>
                  {photoSaving ? "..." : "Appliquer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar nav */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-52 flex-shrink-0">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
          {/* On mobile: horizontal scrollable tabs */}
          <div className="flex md:flex-col overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {sections
              .filter((s) => !s.roles || s.roles.includes(currentUser?.role ?? ""))
              .map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex-shrink-0 md:w-full flex items-center justify-between px-3 md:px-4 py-3 transition-all text-left min-w-[80px] md:min-w-0"
                style={{
                  background: activeSection === s.id ? "rgba(99,102,241,0.08)" : "transparent",
                  borderLeft: activeSection === s.id ? "3px solid #6366F1" : "3px solid transparent",
                  borderBottom: activeSection === s.id ? "3px solid transparent" : "3px solid transparent",
                }}>
                <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2.5">
                  <s.icon size={15} style={{ color: activeSection === s.id ? "#6366F1" : "var(--hr-text-light)" }} />
                  <p className="text-xs text-center md:text-left" style={{
                    color: activeSection === s.id ? "#6366F1" : "var(--hr-text-sec)",
                    fontWeight: activeSection === s.id ? 700 : 400,
                    fontSize: "10px",
                  }}>
                    {s.label}
                  </p>
                </div>
                <ChevronRight size={13} className="hidden md:block" style={{ color: "var(--hr-text-light)" }} />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }} className="flex-1">

        {/* Profile */}
        {activeSection === "profile" && (
          <div className="rounded-2xl p-4 md:p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-5" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Profil personnel</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img src={currentUser?.avatar} alt={currentUser?.firstName}
                  className="w-20 h-20 rounded-2xl object-cover" style={{ border: "3px solid #EDE9FE" }} />
                <button onClick={() => setShowPhotoModal(true)}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "#6366F1" }}>
                  <Camera size={13} className="text-white" />
                </button>
              </div>
              <div>
                <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{currentUser?.role} · {currentUser?.department}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6366F1", fontWeight: 600 }}>{currentUser?.position}</p>
                <button onClick={() => setShowPhotoModal(true)}
                  className="text-xs mt-2 text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                  Changer la photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[
                { label: "Prénom", val: currentUser?.firstName, icon: User },
                { label: "Nom", val: currentUser?.lastName, icon: User },
                { label: "Email", val: currentUser?.email, icon: Mail, col: 2 },
                { label: "Téléphone", val: currentUser?.phone, icon: Phone },
                { label: "Adresse", val: currentUser?.address, icon: MapPin, col: 2 },
              ].map((f) => (
                <div key={f.label} className={(f as any).col === 2 ? "col-span-2" : ""}>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
                  <div className="relative">
                    <f.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-text-light)" }} />
                    <input defaultValue={f.val ?? ""}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--hr-hover)", border: "1px solid var(--hr-card-border-hard)" }}>
              <p className="text-xs mb-3" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Informations RH</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Salaire brut", value: `${currentUser?.salary?.toLocaleString("fr-FR")} FCFA/mois` },
                  { label: "Contrat", value: currentUser?.contractType },
                  { label: "Congés restants", value: `${(currentUser?.leaveBalance ?? 0) - (currentUser?.leaveUsed ?? 0)} jours` },
                ].map((item) => (
                  <div key={item.label} className="text-center p-2 rounded-lg" style={{ background: "var(--hr-card)" }}>
                    <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{item.label}</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 700, color: "#6366F1" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 justify-end flex-wrap">
              {saved && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs" style={{ color: "#10B981", fontWeight: 600 }}>
                  <Check size={13} /> Enregistré !
                </motion.div>
              )}
              <button onClick={handleSave}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 w-full sm:w-auto min-h-[44px]"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}>
                <Save size={14} /> Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Devices */}
        {activeSection === "devices" && (
          <DevicesPanel isAdmin={currentUser?.role === "Admin"} />
        )}

        {/* Kiosk Accounts — Admin only */}
        {activeSection === "kiosk" && currentUser?.role === "Admin" && (
          <KioskAccountsPanel />
        )}

        {/* Notifications */}
        {activeSection === "notifications" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-5" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Préférences de notifications</h2>
            <div className="space-y-4">
              {[
                { key: "absences", label: "Absences non justifiées", desc: "Recevoir une alerte en cas d'absence" },
                { key: "retards", label: "Retards signalés", desc: "Alerte quand un employé arrive en retard" },
                { key: "conges", label: "Demandes de congés", desc: "Nouvelles demandes de congé à valider" },
                { key: "documents", label: "Documents expirants", desc: "Contrats et documents arrivant à expiration" },
                { key: "email", label: "Notifications par email", desc: "Recevoir les alertes par email" },
                { key: "system", label: "Notifications système", desc: "Mises à jour et maintenance" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--hr-hover)" }}>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => updateNotifSetting(item.key, !notifSettings[item.key as keyof typeof notifSettings])}
                    className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                    style={{ background: notifSettings[item.key as keyof typeof notifSettings] ? "#6366F1" : "var(--hr-card-border-hard)" }}>
                    <motion.div
                      animate={{ x: notifSettings[item.key as keyof typeof notifSettings] ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security */}
        {activeSection === "security" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-5" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Sécurité du compte</h2>
            <div className="space-y-4">
              {[
                { label: "Mot de passe actuel", key: "current", placeholder: "••••••••" },
                { label: "Nouveau mot de passe", key: "next", placeholder: "••••••••" },
                { label: "Confirmer le nouveau mot de passe", key: "confirm", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-text-light)" }} />
                    <input type={showPwd ? "text" : "password"}
                      placeholder={f.placeholder}
                      value={pwdForm[f.key as keyof typeof pwdForm]}
                      onChange={(e) => setPwdForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="showPwd" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} />
                <label htmlFor="showPwd" className="text-xs" style={{ color: "var(--hr-text-sec)", cursor: "pointer" }}>
                  Afficher les mots de passe
                </label>
              </div>

              {pwdError && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEE2E2" }}>
                  <AlertCircle size={13} style={{ color: "#DC2626" }} />
                  <p className="text-xs" style={{ color: "#DC2626", fontWeight: 600 }}>{pwdError}</p>
                </div>
              )}

              {pwdSaved && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#D1FAE5" }}>
                  <Check size={13} style={{ color: "#16A34A" }} />
                  <p className="text-xs" style={{ color: "#16A34A", fontWeight: 600 }}>Mot de passe mis à jour !</p>
                </motion.div>
              )}

              <button onClick={handlePasswordChange} disabled={pwdSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 w-full sm:w-auto min-h-[44px]"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: pwdSaving ? 0.7 : 1 }}>
                <Save size={14} />
                {pwdSaving ? "Mise à jour…" : "Mettre à jour le mot de passe"}
              </button>
            </div>
          </div>
        )}

        {/* Appearance */}
        {activeSection === "appearance" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-2" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Apparence</h2>
            <p className="text-xs mb-6" style={{ color: "var(--hr-text-light)" }}>Choisissez le thème qui vous convient le mieux</p>
            <div className="space-y-3">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>THÈME</p>
              <div className="grid grid-cols-2 gap-3">
                {themeOptions.map((t) => (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className="rounded-2xl p-4 text-left transition-all"
                    style={{
                      background: theme === t.id ? "rgba(99,102,241,0.08)" : "var(--hr-hover)",
                      border: theme === t.id ? "2px solid #6366F1" : "2px solid var(--hr-card-border-hard)",
                    }}>
                    <div className="w-full h-16 rounded-xl mb-3 overflow-hidden flex"
                      style={{ background: t.preview, border: "1px solid rgba(0,0,0,0.1)" }}>
                      <div className="w-8 h-full" style={{ background: t.id === "dark" ? "#0B1437" : "#1E1B4B" }} />
                      <div className="flex-1 p-2 space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="rounded h-2"
                            style={{ background: t.id === "dark" ? "#1E293B" : "white", width: i === 1 ? "80%" : i === 2 ? "60%" : "70%" }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <t.icon size={14} style={{ color: theme === t.id ? "#6366F1" : "var(--hr-text-muted)" }} />
                          <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{t.label}</p>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{t.description}</p>
                      </div>
                      {theme === t.id && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#6366F1" }}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl" style={{ background: "var(--hr-hover)" }}>
              <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>
                Le thème <strong style={{ color: "var(--hr-text)" }}>{isDark ? "Sombre" : "Clair"}</strong> est actuellement actif.
              </p>
            </div>
          </div>
        )}

        {/* Language */}
        {activeSection === "language" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-2" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Langue & Région</h2>
            <p className="text-xs mb-6" style={{ color: "var(--hr-text-light)" }}>Choisissez la langue d'affichage de l'interface</p>
            <div className="space-y-3">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>LANGUE DE L'INTERFACE</p>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button key={lang.code} onClick={() => setLanguage(lang.code)}
                    className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
                    style={{
                      background: language === lang.code ? "rgba(99,102,241,0.08)" : "var(--hr-hover)",
                      border: language === lang.code ? "2px solid #6366F1" : "2px solid var(--hr-card-border-hard)",
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left">
                        <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{lang.label}</p>
                        <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{lang.region}</p>
                      </div>
                    </div>
                    {language === lang.code && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#6366F1" }}>
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}>
                {saved ? <><Check size={14} />Enregistré !</> : <><Save size={14} />Enregistrer</>}
              </button>
            </div>
          </div>
        )}

        {/* Company */}
        {activeSection === "company" && (() => {
          const canEdit = currentUser?.role === "Admin";
          const ro: React.CSSProperties = canEdit
            ? {}
            : { background: "var(--hr-hover)", color: "var(--hr-text-muted)", cursor: "not-allowed", opacity: 0.75 };
          return (
            <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Paramètres entreprise</h2>
                {!canEdit && (
                  <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "#FEF3C7", color: "#D97706", fontWeight: 700 }}>
                    <Lock size={11} />
                    Lecture seule
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {[
                  { label: "Nom de l'entreprise", key: "name", placeholder: "Ex: TechCorp" },
                  { label: "Secteur d'activité", key: "sector", placeholder: "Ex: Technologie" },
                  { label: "Email RH", key: "hrEmail", placeholder: "rh@entreprise.com" },
                  { label: "Adresse du siège", key: "address", placeholder: "123 Rue principale, Ville" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
                    <input
                      value={(companyForm as any)[f.key] ?? ""}
                      onChange={(e) => canEdit && setCompanyForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      readOnly={!canEdit}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)", ...ro }}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Heure de début de journée</label>
                  <input type="time"
                    value={companyForm.workStart ?? "09:00"}
                    onChange={(e) => canEdit && setCompanyForm((p) => ({ ...p, workStart: e.target.value }))}
                    readOnly={!canEdit}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)", ...ro }} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Tolérance de retard (minutes)</label>
                  <input type="number"
                    value={companyForm.lateTolerance ?? 5}
                    onChange={(e) => canEdit && setCompanyForm((p) => ({ ...p, lateTolerance: parseInt(e.target.value) || 0 }))}
                    readOnly={!canEdit}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none w-28"
                    style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)", ...ro }} />
                  <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>Délai avant qu'une arrivée soit considérée en retard</p>
                </div>

                {/* Géolocalisation */}
                <div className="pt-3 border-t" style={{ borderColor: "var(--hr-card-border-hard)" }}>
                  {/* En-tête avec statut actif/inactif */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Navigation size={14} style={{ color: "#6366F1" }} />
                      <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Géolocalisation du pointage</p>
                    </div>
                    {companyForm.latitude != null && companyForm.longitude != null ? (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Pointage géolocalisé actif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(156,163,175,0.15)", color: "var(--hr-text-light)", fontWeight: 600 }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                        Géolocalisation désactivée
                      </span>
                    )}
                  </div>

                  <p className="text-xs mb-3" style={{ color: "var(--hr-text-light)" }}>
                    Définissez la position GPS de l'entreprise. Les employés devront être dans le rayon pour pointer.
                    Supprimez les coordonnées pour désactiver la vérification.
                  </p>

                  {/* Bouton détecter ma position */}
                  {canEdit && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={geoDetecting}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 w-full justify-center"
                        style={{
                          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                          color: "white",
                          fontWeight: 700,
                          opacity: geoDetecting ? 0.7 : 1,
                        }}>
                        {geoDetecting ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Détection en cours…</>
                        ) : (
                          <><MapPin size={14} /> Utiliser ma position actuelle</>
                        )}
                      </button>
                      {geoDetectError && (
                        <p className="text-xs mt-2 px-3 py-2 rounded-xl"
                          style={{ background: "#FEE2E2", color: "#DC2626", fontWeight: 600 }}>
                          {geoDetectError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Champs manuels */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Latitude</label>
                      <input type="number" step="any"
                        value={companyForm.latitude ?? ""}
                        onChange={(e) => canEdit && setCompanyForm((p) => ({ ...p, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                        readOnly={!canEdit}
                        placeholder="Ex : 3.8480000"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)", ...ro }} />
                    </div>
                    <div>
                      <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Longitude</label>
                      <input type="number" step="any"
                        value={companyForm.longitude ?? ""}
                        onChange={(e) => canEdit && setCompanyForm((p) => ({ ...p, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                        readOnly={!canEdit}
                        placeholder="Ex : 11.5020000"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)", ...ro }} />
                    </div>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Rayon autorisé (mètres)</label>
                      <input type="number" min={10} max={5000}
                        value={companyForm.geoRadius ?? 100}
                        onChange={(e) => canEdit && setCompanyForm((p) => ({ ...p, geoRadius: parseInt(e.target.value) || 100 }))}
                        readOnly={!canEdit}
                        className="px-3 py-2.5 rounded-xl text-sm outline-none w-28"
                        style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)", ...ro }} />
                      <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>Distance maximale autorisée (défaut : 100 m)</p>
                    </div>
                    {canEdit && (companyForm.latitude != null || companyForm.longitude != null) && (
                      <button
                        type="button"
                        onClick={() => setCompanyForm((p) => ({ ...p, latitude: null, longitude: null }))}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-80 mb-5"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", fontWeight: 600, border: "1px solid rgba(239,68,68,0.2)" }}>
                        <X size={13} /> Désactiver
                      </button>
                    )}
                  </div>
                </div>

                {canEdit ? (
                  <button onClick={handleCompanySave} disabled={companySaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: companySaving ? 0.7 : 1 }}>
                    <Save size={14} />
                    {companySaving ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
                  </button>
                ) : (
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                    Seul l'administrateur peut modifier ces paramètres.
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </motion.div>
    </div>
  );
}
