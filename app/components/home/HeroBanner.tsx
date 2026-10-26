import { Recycle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function HeroBanner() {
  const { t } = useApp();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gp-l via-white to-emerald-100 border border-emerald-100 p-6 md:p-10 flex items-center justify-between shadow-xs">
      <div className="relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold text-gp whitespace-pre-line leading-tight">
          {t.tagline}
        </h1>
        <p className="mt-3 text-sm md:text-base text-gp-gray font-medium">
          Recycle Plastic • Earn Points • Get Rewards
        </p>
      </div>

      <div className="relative hidden sm:flex items-center justify-center w-44 h-44 md:w-56 md:h-56 rounded-full bg-gp text-white shadow-xl shrink-0">
        <Recycle className="w-24 h-24 md:w-28 md:h-28 text-white/90 animate-spin-slow" />
        <div className="absolute -top-2 -right-2 bg-white text-gp text-xs font-bold rounded-2xl shadow-lg px-3.5 py-2 text-center border border-emerald-100">
          Plastic Waste
          <br />= Points
        </div>
      </div>
    </section>
  );
}
