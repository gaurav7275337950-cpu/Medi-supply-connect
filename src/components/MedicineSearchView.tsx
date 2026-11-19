import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import {
  MEDICINE_CATEGORIES,
  type Distributor,
  type MedicineOffer,
  type WatchlistItem,
} from '../types';

interface MedicineSearchViewProps {
  offers: MedicineOffer[];
  distributors: Distributor[];
  watchlist: WatchlistItem[];
  initialDistributorFilter?: string;
  onClearInitialDistributor?: () => void;
  onAddToCart: (offer: MedicineOffer, quantity: number) => void;
  onToggleWatchlist: (medicine: {
    medicineId: string;
    medicineName: string;
    composition: string;
    bestPtr: number;
    minQty: number;
  }) => Promise<void>;
  onGoToCart: () => void;
  cartCount: number;
}

interface MedicineGroup {
  medicineId: string;
  medicineName: string;
  composition: string;
  manufacturer: string;
  packSize: string;
  category: string;
  hsnCode: string;
  mrpInr: number;
  bestPtr: number;
  offers: MedicineOffer[];
}

export function MedicineSearchView({
  offers,
  distributors,
  watchlist,
  initialDistributorFilter,
  onClearInitialDistributor,
  onAddToCart,
  onToggleWatchlist,
  onGoToCart,
  cartCount,
}: MedicineSearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});
  const [watchlistBusy, setWatchlistBusy] = useState<Record<string, boolean>>({});

  const distributorStateMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of distributors) {
      map.set(d.id, d.state);
    }
    return map;
  }, [distributors]);

  const watchlistIds = useMemo(() => new Set(watchlist.map((w) => w.medicineId)), [watchlist]);

  const groupedMedicines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups = new Map<string, MedicineGroup>();

    for (const offer of offers) {
      if (initialDistributorFilter && offer.distributorId !== initialDistributorFilter) {
        continue;
      }
      if (selectedCategory !== 'All' && offer.category !== selectedCategory) {
        continue;
      }
      if (selectedState !== 'All') {
        const distState = distributorStateMap.get(offer.distributorId);
        if (distState !== selectedState) continue;
      }
      if (onlyInStock && offer.stockStatus === 'Out of Stock') {
        continue;
      }
      if (q) {
        const haystack =
          `${offer.medicineName} ${offer.composition} ${offer.manufacturer} ${offer.distributorName} ${offer.distributorCity} ${offer.hsnCode}`.toLowerCase();
        if (!haystack.includes(q)) continue;
      }

      const existing = groups.get(offer.medicineId);
      if (existing) {
        existing.offers.push(offer);
        if (offer.stockStatus !== 'Out of Stock' && offer.ptrInr < existing.bestPtr) {
          existing.bestPtr = offer.ptrInr;
        }
      } else {
        groups.set(offer.medicineId, {
          medicineId: offer.medicineId,
          medicineName: offer.medicineName,
          composition: offer.composition,
          manufacturer: offer.manufacturer,
          packSize: offer.packSize,
          category: offer.category,
          hsnCode: offer.hsnCode,
          mrpInr: offer.mrpInr,
          bestPtr: offer.ptrInr,
          offers: [offer],
        });
      }
    }

    const result = Array.from(groups.values());
    for (const g of result) {
      g.offers.sort((a, b) => {
        if (a.stockStatus === 'Out of Stock' && b.stockStatus !== 'Out of Stock') return 1;
        if (b.stockStatus === 'Out of Stock' && a.stockStatus !== 'Out of Stock') return -1;
        return a.ptrInr - b.ptrInr;
      });
      const availableOffers = g.offers.filter((o) => o.stockStatus !== 'Out of Stock');
      if (availableOffers.length > 0) {
        g.bestPtr = availableOffers[0].ptrInr;
      }
    }
    return result.sort((a, b) => a.medicineName.localeCompare(b.medicineName));
  }, [
    offers,
    initialDistributorFilter,
    selectedCategory,
    selectedState,
    onlyInStock,
    searchQuery,
    distributorStateMap,
  ]);

  const activeDistributorName = useMemo(() => {
    if (!initialDistributorFilter) return null;
    return distributors.find((d) => d.id === initialDistributorFilter)?.name ?? null;
  }, [distributors, initialDistributorFilter]);

  const getQty = (offer: MedicineOffer) => quantities[offer.id] ?? offer.minQty;

  const setQty = (offer: MedicineOffer, next: number) => {
    const clamped = Math.max(offer.minQty, Math.min(offer.stockQty || 1000, next));
    setQuantities((prev) => ({ ...prev, [offer.id]: clamped }));
  };

  const handleAdd = (offer: MedicineOffer) => {
    const qty = getQty(offer);
    onAddToCart(offer, qty);
    setRecentlyAdded((prev) => ({ ...prev, [offer.id]: true }));
    setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [offer.id]: false }));
    }, 1400);
  };

  const handleWatchlistClick = async (group: MedicineGroup) => {
    setWatchlistBusy((prev) => ({ ...prev, [group.medicineId]: true }));
    try {
      await onToggleWatchlist({
        medicineId: group.medicineId,
        medicineName: group.medicineName,
        composition: group.composition,
        bestPtr: group.bestPtr,
        minQty: group.offers[0]?.minQty ?? 5,
      });
    } finally {
      setWatchlistBusy((prev) => ({ ...prev, [group.medicineId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters Surface */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine brand, salt composition, manufacturer, city, or HSN..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="All">All Regions (UP &amp; UK)</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Uttarakhand">Uttarakhand</option>
            </select>

            <button
              type="button"
              onClick={() => setOnlyInStock((v) => !v)}
              className={`px-3.5 py-2.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                onlyInStock
                  ? 'bg-teal-50 border-teal-300 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {onlyInStock ? 'In Stock Only' : 'All Stock Status'}
            </button>

            {cartCount > 0 && (
              <button
                type="button"
                onClick={onGoToCart}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Review Cart ({cartCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {['All', ...MEDICINE_CATEGORIES].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {activeDistributorName && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-600">
              Filtered to distributor: <strong className="text-slate-900">{activeDistributorName}</strong>
            </span>
            {onClearInitialDistributor && (
              <button
                type="button"
                onClick={onClearInitialDistributor}
                className="font-medium text-teal-800 hover:text-teal-900 cursor-pointer"
              >
                Show all distributors
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between gap-4 text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900 tabular-nums">{groupedMedicines.length}</strong>{' '}
          medicines across verified suppliers
        </span>
        <span>Sorted by lowest available PTR per medicine</span>
      </div>

      {/* Empty State */}
      {groupedMedicines.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-base font-semibold text-slate-900">
            No matching medicines found
          </p>
          <p className="mt-1.5 text-sm text-slate-600">
            Try clearing your category or region filters, or search by salt composition.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedState('All');
              setOnlyInStock(false);
              onClearInitialDistributor?.();
            }}
            className="mt-4 px-4 py-2 text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedMedicines.map((group) => {
            const isWatched = watchlistIds.has(group.medicineId);
            const busy = Boolean(watchlistBusy[group.medicineId]);
            const bestMarginPct =
              group.mrpInr > 0
                ? (((group.mrpInr - group.bestPtr) / group.mrpInr) * 100).toFixed(1)
                : '0.0';

            return (
              <section
                key={group.medicineId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Medicine Header Row */}
                <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-base font-semibold text-slate-900">
                        {group.medicineName}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {group.category} · {group.packSize} · HSN {group.hsnCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {group.composition} · {group.manufacturer}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500">MRP</p>
                      <p className="text-sm font-mono font-medium text-slate-700 tabular-nums">
                        ₹{group.mrpInr.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500">Best PTR</p>
                      <p className="text-sm font-mono font-semibold text-teal-800 tabular-nums">
                        ₹{group.bestPtr.toFixed(2)} ({bestMarginPct}%)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleWatchlistClick(group)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isWatched
                          ? 'bg-teal-50 border-teal-300 text-teal-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isWatched ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-teal-700" />
                          <span>Watchlisted</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Watchlist</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Supplier Comparison Data Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                        <th className="py-2.5 px-5">Verified Distributor</th>
                        <th className="py-2.5 px-3 text-right">Unit PTR</th>
                        <th className="py-2.5 px-3 text-right">Retail Margin</th>
                        <th className="py-2.5 px-3">Scheme</th>
                        <th className="py-2.5 px-3">Stock Availability</th>
                        <th className="py-2.5 px-3">Delivery ETA</th>
                        <th className="py-2.5 px-3">Expiry</th>
                        <th className="py-2.5 px-5 text-right">Procurement Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {group.offers.map((offer, idx) => {
                        const marginPct =
                          offer.mrpInr > 0
                            ? (((offer.mrpInr - offer.ptrInr) / offer.mrpInr) * 100).toFixed(1)
                            : '0.0';
                        const qty = getQty(offer);
                        const added = Boolean(recentlyAdded[offer.id]);
                        const outOfStock = offer.stockStatus === 'Out of Stock';

                        return (
                          <tr
                            key={offer.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {offer.distributorName}
                                </span>
                                {idx === 0 && !outOfStock && (
                                  <span className="text-[11px] font-semibold text-teal-800">
                                    · Lowest PTR
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                {offer.distributorCity} · Min {offer.minQty} units
                              </p>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                              ₹{offer.ptrInr.toFixed(2)}
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                              {marginPct}%
                            </td>

                            <td className="py-3 px-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                              {offer.schemeLabel}
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              {offer.stockStatus === 'In Stock' && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span className="tabular-nums">In Stock · {offer.stockQty}</span>
                                </span>
                              )}
                              {offer.stockStatus === 'Low Stock' && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span className="tabular-nums">Low Stock · {offer.stockQty}</span>
                                </span>
                              )}
                              {offer.stockStatus === 'Out of Stock' && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Out of Stock</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-xs text-slate-700 whitespace-nowrap">
                              {offer.deliveryEta}
                            </td>

                            <td className="py-3 px-3 text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
                              {offer.expiryDate}
                            </td>

                            <td className="py-3 px-5 text-right">
                              {outOfStock ? (
                                <span className="text-xs text-slate-400">Unavailable</span>
                              ) : (
                                <div className="inline-flex items-center justify-end gap-2">
                                  <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                                    <button
                                      type="button"
                                      aria-label={`Decrease quantity for ${offer.medicineName}`}
                                      onClick={() => setQty(offer, qty - 1)}
                                      disabled={qty <= offer.minQty}
                                      className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-9 text-center text-xs font-mono font-medium text-slate-900 tabular-nums">
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`Increase quantity for ${offer.medicineName}`}
                                      onClick={() => setQty(offer, qty + 1)}
                                      disabled={qty >= offer.stockQty}
                                      className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAdd(offer)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                      added
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-teal-700 hover:bg-teal-800 text-white'
                                    }`}
                                  >
                                    {added ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Added</span>
                                      </>
                                    ) : (
                                      <span>Add to Cart</span>
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
