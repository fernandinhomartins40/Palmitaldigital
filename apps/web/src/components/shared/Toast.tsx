import { useUIStore } from '../../store/uiStore';
import { X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex w-full max-w-sm items-center justify-between rounded-xl px-4 py-3 shadow-lg text-white text-sm ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
          }`}
        >
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-3 opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
