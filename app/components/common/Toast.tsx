import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 bg-[#0f2a1d] text-white text-sm font-medium rounded-xl px-5 py-3 shadow-2xl z-50 flex items-center gap-2.5 animate-bounce-short">
      <CheckCircle2 className="w-4 h-4 text-gp-m shrink-0" />
      <span>{message}</span>
    </div>
  );
}
