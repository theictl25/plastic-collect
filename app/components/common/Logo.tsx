import { Recycle } from 'lucide-react';

interface LogoProps {
  sub?: string;
  className?: string;
  onClick?: () => void;
}

export function Logo({ sub, className = '', onClick }: LogoProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="w-9 h-9 rounded-xl bg-gp-l flex items-center justify-center text-gp shadow-xs">
        <Recycle className="w-5 h-5 text-gp" />
      </div>
      <div className="leading-tight">
        <div className="font-bold text-gp text-lg tracking-tight">Green Point</div>
        <div className="text-[10px] text-gp-gray hidden sm:block">
          {sub || 'Recycle for a Better Tomorrow'}
        </div>
      </div>
    </div>
  );
}
