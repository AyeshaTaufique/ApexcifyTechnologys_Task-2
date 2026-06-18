import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade">
      <div className={`rounded-xl px-4 py-2 text-sm font-medium shadow-lg ${
        toast.type === 'success' ? 'bg-green-600 text-white' :
        toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
      }`}>
        {toast.message}
        <button onClick={onClose} className="ml-3 text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  );
}