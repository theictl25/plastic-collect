import { MapPin, Camera, Image, Star, Gift } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function QuickActions() {
  const { t, setTab, startScan } = useApp();

  const actions = [
    {
      icon: MapPin,
      label: t.nearby,
      action: () => setTab('map'),
    },
    {
      icon: Camera,
      label: t.scan,
      action: () => startScan(),
    },
    {
      icon: Image,
      label: t.photo,
      action: () => startScan(),
    },
    {
      icon: Star,
      label: t.earn,
      action: () => startScan(),
    },
    {
      icon: Gift,
      label: t.redeem,
      action: () => setTab('rewards'),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {actions.map((act) => {
        const IconComponent = act.icon;
        return (
          <button
            key={act.label}
            onClick={act.action}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2.5 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
          >
            <span className="w-12 h-12 rounded-full bg-gp-l text-gp flex items-center justify-center group-hover:bg-gp group-hover:text-white transition duration-200">
              <IconComponent className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold text-center text-gray-800 line-clamp-1">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
