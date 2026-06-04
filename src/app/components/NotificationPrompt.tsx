import React, { useState } from 'react';
import { Bell, X, BellOff } from 'lucide-react';

interface Props {
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  onRequest: () => Promise<void>;
}

const DISMISSED_KEY = 'hr_notif_dismissed';

export function NotificationPrompt({ permission, onRequest }: Props) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  );
  const [loading, setLoading] = useState(false);

  // Ne rien afficher si supporté/accordé/dismissé
  if (permission === 'unsupported' || permission === 'granted' || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const handleActivate = async () => {
    setLoading(true);
    await onRequest();
    setLoading(false);
  };

  if (permission === 'denied') {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl"
          style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)' }}>
          <BellOff size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Notifications bloquées</p>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              Réactivez-les dans les paramètres du navigateur :
              Cadenas → Notifications → Autoriser
            </p>
          </div>
          <button onClick={handleDismiss} className="flex-shrink-0 mt-0.5" style={{ color: '#64748B' }}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1E1B4B, #312E81)', border: '1px solid rgba(99,102,241,0.4)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.25)' }}>
          <Bell size={18} style={{ color: '#A5B4FC' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Activer les notifications</p>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
            Recevez les alertes d'absence, congés et pointages en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleActivate} disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', opacity: loading ? 0.7 : 1 }}>
            {loading ? '…' : 'Activer'}
          </button>
          <button onClick={handleDismiss} style={{ color: '#64748B' }}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
