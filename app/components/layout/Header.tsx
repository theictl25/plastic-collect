import { useState } from "react";
import {
  ShieldCheck,
  Star,
  UserRound,
  Home,
  Map,
  Gift,
  History,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "../common/Logo";
import { useApp } from "../../context/AppContext";
import { AdminLoginModal } from "../auth/AdminLoginModal";
import type { TabType, Language } from "../../types";

const TAB_ICONS: Partial<Record<TabType, LucideIcon>> = {
  home: Home,
  map: Map,
  rewards: Gift,
  history: History,
};

export function Header() {
  const { tab, setTab, lang, setLang, points, profile, t } = useApp();
  const [adminOpen, setAdminOpen] = useState(false);
  const tabs: TabType[] = ["home", "map", "rewards", "history"];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Logo onClick={() => setTab("home")} />

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
                      ? "text-gp bg-gp-l"
                      : "text-gp-gray hover:text-gp hover:bg-gray-50"
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
              {(["lo", "en"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer uppercase ${
                    lang === l
                      ? "bg-white text-gp shadow-xs font-bold"
                      : "text-gp-gray hover:text-gray-900"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Admin Switch */}
            <button
              onClick={() => setAdminOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gp-gray hover:text-gp p-2 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              title="Admin"
              aria-label="Admin"
            >
              <ShieldCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* User Profile Badge */}
            <button
              onClick={() => setTab("profile")}
              className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-gray-100 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              title="View profile"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gp-m to-gp text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.displayName?.slice(0, 1).toUpperCase() || (
                    <UserRound className="w-4 h-4" />
                  )
                )}
              </div>
              <div className="hidden sm:block leading-tight text-left">
                <div className="text-xs font-semibold text-gray-900 max-w-28 truncate">
                  {profile?.displayName || "Loading..."}
                </div>
                <div className="text-[11px] text-gp font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-gp text-gp" />
                  <span>
                    {points} {t.pts}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-white/95 backdrop-blur-md border-t border-gray-100 pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        {tabs.map((k) => {
          const isActive = tab === k;
          const Icon = TAB_ICONS[k];
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              aria-current={isActive ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-2.5 text-[11px] font-semibold transition cursor-pointer ${
                isActive ? "text-gp" : "text-gp-gray hover:text-gray-900"
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <span>{t[k]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
