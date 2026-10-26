import { ShieldCheck, Star } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useApp } from '../../context/AppContext';
import type { TabType, Language } from '../../types';

export function Header() {
  const { tab, setTab, lang, setLang, points, setMode, t } = useApp();
  const tabs: TabType[] = ['home', 'map', 'rewards', 'history'];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Logo onClick={() => setTab('home')} />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((k) => {
            const isActive = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-gp bg-gp-l'
                    : 'text-gp-gray hover:text-gp hover:bg-gray-50'
                }`}
              >
                {t[k]}
              </button>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex text-xs font-semibold bg-gray-100 rounded-lg p-0.5">
            {(['th', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer uppercase ${
                  lang === l
                    ? 'bg-white text-gp shadow-xs font-bold'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Admin Switch */}
          <button
            onClick={() => setMode('admin')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gp-gray hover:text-gp px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gp-m to-gp text-white flex items-center justify-center font-bold text-sm shadow-xs">
              S
            </div>
            <div className="hidden sm:block leading-tight text-left">
              <div className="text-xs font-semibold text-gray-900">Somsak</div>
              <div className="text-[11px] text-gp font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-gp text-gp" />
                <span>
                  {points} {t.pts}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden flex border-t border-gray-100 bg-white">
        {tabs.map((k) => {
          const isActive = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 py-3 text-xs font-semibold transition cursor-pointer text-center ${
                isActive
                  ? 'text-gp border-b-2 border-gp bg-emerald-50/30'
                  : 'text-gp-gray hover:text-gray-900'
              }`}
            >
              {t[k]}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
