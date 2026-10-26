import { useState, useMemo, useEffect } from "react";
import { MapPin, Locate, Search, Trash2, X, Plus, Minus } from "lucide-react";
import { Button } from "../common/Button";
import { WASTE_TYPE_COLORS } from "../../data/bins";
import { useApp } from "../../context/AppContext";
import type { Bin, WasteType } from "../../types";

export function MapView() {
  const { t, startScan, bins } = useApp();
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const filteredBins = useMemo(() => {
    return bins.filter((b) => {
      const matchesType = filterType === "all" || b.t === filterType;
      const matchesQuery = b.id
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [bins, filterType, searchQuery]);

  useEffect(() => {
    if (!selectedBin && bins.length) setSelectedBin(bins[0]);
  }, [bins, selectedBin]);

  const categories: Array<{ id: string; label: string }> = [
    { id: "all", label: t.all },
    { id: "plastic", label: t.plastic },
    { id: "paper", label: t.paper },
    { id: "metal", label: t.metal },
    { id: "other", label: t.other },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header & My Location button */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t.map}{" "}
            <span className="text-gp-gray text-base font-normal">/ Map</span>
          </h2>
          <p className="text-sm text-gp-gray">
            Find nearby bins and view details
          </p>
        </div>
        {/* <Button
          variant="outline"
          className="px-4 py-2 text-sm"
          onClick={() => setSelectedBin(BINS[2])}
        >
          <Locate className="w-4 h-4" />
          <span>{t.myLocation}</span>
        </Button> */}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gp-gray pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchBin}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gp-m focus:border-transparent text-sm transition"
        />
      </div>

      {/* Category Pills */}
      {/* <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = filterType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                isActive
                  ? "bg-gp text-white border-gp shadow-xs"
                  : "bg-white text-gp-gray border-gray-200 hover:border-gp hover:text-gp"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div> */}

      {/* Map + Bins List Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map Canvas */}
        <div className="lg:col-span-2 relative h-[420px] md:h-[520px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm map-bg select-none">
          {/* Street Grid pattern */}
          <div className="absolute inset-0 roads opacity-80 pointer-events-none" />

          {/* Interactive Bin Pins */}
          <div
            className="absolute inset-0 transition-transform duration-300"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
            }}
          >
            {filteredBins.map((bin) => {
              const isSelected = selectedBin?.id === bin.id;
              const colorClass =
                WASTE_TYPE_COLORS[bin.t as WasteType] || "bg-gp text-white";

              return (
                <button
                  key={bin.id}
                  onClick={() => setSelectedBin(bin)}
                  style={{ left: `${bin.x}%`, top: `${bin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-full group cursor-pointer transition-transform hover:z-20"
                >
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 border-white transition-all ${colorClass} ${
                      isSelected
                        ? "scale-125 ring-4 ring-white/80 z-20 shadow-xl"
                        : "group-hover:scale-110"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </span>
                  <span className="block text-[10px] font-bold bg-white/95 text-gray-800 rounded px-1.5 py-0.5 mt-0.5 shadow-xs border border-gray-100">
                    {bin.id}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Bin Card Popup */}
          {selectedBin && (
            <div className="absolute left-3 right-3 bottom-3 sm:left-auto sm:right-3 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => setSelectedBin(null)}
                className="absolute top-3 right-3 text-gp-gray hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs shrink-0 ${
                    WASTE_TYPE_COLORS[selectedBin.t as WasteType]
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-bold text-gray-900">
                    {selectedBin.id}
                  </div>
                  <div className="text-xs text-gp-gray capitalize">
                    {selectedBin.t} bin
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs border-t border-gray-100 pt-3">
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    selectedBin.ok ? "text-gp" : "text-red-700"
                  }`}
                >
                  <span className="text-base leading-none">●</span>{" "}
                  {selectedBin.ok ? t.available : t.full}
                </span>
                <span className="text-gp-gray font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedBin.d}
                </span>
              </div>

              <Button
                onClick={() => startScan(selectedBin.id)}
                className="w-full mt-3 py-2.5 text-sm"
              >
                {t.viewScan}
              </Button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute top-3 left-3 flex flex-col bg-white rounded-xl shadow border border-gray-100 overflow-hidden z-10">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.45))}
              className="p-2 hover:bg-gray-50 text-gray-700 cursor-pointer transition"
              title="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
              className="p-2 hover:bg-gray-50 border-t border-gray-100 text-gray-700 cursor-pointer transition"
              title="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bins List Sidebar */}
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredBins.map((bin) => {
            const isSelected = selectedBin?.id === bin.id;
            return (
              <button
                key={bin.id}
                onClick={() => setSelectedBin(bin)}
                className={`w-full text-left bg-white rounded-xl border p-3 flex items-center gap-3 hover:shadow-sm transition cursor-pointer ${
                  isSelected
                    ? "border-gp ring-2 ring-gp/10 bg-emerald-50/20"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    WASTE_TYPE_COLORS[bin.t as WasteType]
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {bin.id}
                  </div>
                  <div className="text-[11px] text-gp-gray capitalize">
                    {bin.t} · {bin.ok ? t.available : t.full}
                  </div>
                </div>
                <span className="text-xs text-gp-gray font-medium whitespace-nowrap">
                  {bin.d}
                </span>
              </button>
            );
          })}

          {filteredBins.length === 0 && (
            <div className="text-sm text-gp-gray p-6 text-center bg-white rounded-xl border border-gray-100">
              {t.noBins}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
