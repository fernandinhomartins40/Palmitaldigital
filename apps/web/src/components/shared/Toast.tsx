import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onRemove: (id: string) => void;
}

const styles = {
  success: {
    bar: 'bg-mint',
    iconColor: 'text-mint',
    label: 'text-mint',
    Icon: CheckCircle2,
    title: 'SUCESSO',
  },
  error: {
    bar: 'bg-coral',
    iconColor: 'text-coral',
    label: 'text-coral',
    Icon: AlertCircle,
    title: 'ERRO',
  },
  info: {
    bar: 'bg-cobalt',
    iconColor: 'text-cobalt',
    label: 'text-cobalt',
    Icon: Info,
    title: 'INFO',
  },
};

function ToastItem({ id, message, type, onRemove }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const s = styles[type];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  }

  return (
    <div
      className={`glass-strong shape-signature relative flex w-full max-w-sm items-start gap-3 px-4 py-3.5 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      role="alert"
    >
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${s.bar}`} />

      <s.Icon size={18} className={`mt-0.5 flex-shrink-0 ${s.iconColor}`} strokeWidth={2.2} />

      <div className="min-w-0 flex-1 pl-1">
        <p className={`font-mono text-[10px] font-bold uppercase tracking-wider ${s.label}`}>
          {s.title}
        </p>
        <p className="mt-0.5 text-sm leading-snug text-ink">{message}</p>
      </div>

      <button
        onClick={dismiss}
        className="mt-0.5 flex-shrink-0 rounded-lg p-1 text-mute transition-colors hover:bg-ink/5 hover:text-ink"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[9999] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem id={t.id} message={t.message} type={t.type} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
