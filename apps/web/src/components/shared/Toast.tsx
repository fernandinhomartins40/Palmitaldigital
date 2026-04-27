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
    container: 'bg-white border-emerald-200 shadow-emerald-100/60',
    icon: 'text-emerald-500',
    bar: 'bg-emerald-500',
    title: 'text-emerald-700',
    text: 'text-gray-600',
    Icon: CheckCircle2,
    label: 'Sucesso',
  },
  error: {
    container: 'bg-white border-red-200 shadow-red-100/60',
    icon: 'text-red-500',
    bar: 'bg-red-500',
    title: 'text-red-700',
    text: 'text-gray-600',
    Icon: AlertCircle,
    label: 'Erro',
  },
  info: {
    container: 'bg-white border-blue-200 shadow-blue-100/60',
    icon: 'text-blue-500',
    bar: 'bg-blue-500',
    title: 'text-blue-700',
    text: 'text-gray-600',
    Icon: Info,
    label: 'Info',
  },
};

function ToastItem({ id, message, type, onRemove }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const s = styles[type];

  // Slide-in on mount
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
      className={`relative flex items-start gap-3 w-full max-w-sm rounded-2xl border px-4 py-3.5 shadow-lg
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${s.container}`}
      role="alert"
    >
      {/* Colored left bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${s.bar}`} />

      <s.Icon size={20} className={`flex-shrink-0 mt-0.5 ${s.icon}`} />

      <div className="flex-1 min-w-0 pl-1">
        <p className={`text-xs font-bold uppercase tracking-wide ${s.title}`}>{s.label}</p>
        <p className={`text-sm mt-0.5 leading-snug ${s.text}`}>{message}</p>
      </div>

      <button
        onClick={dismiss}
        className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-0.5 mt-0.5"
        aria-label="Fechar notificação"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem id={t.id} message={t.message} type={t.type} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
