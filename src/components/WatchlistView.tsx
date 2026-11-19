import React, { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, CheckCircle2, ShoppingCart, Trash2 } from 'lucide-react';
import type { MedicineOffer, WatchlistItem } from '../types';

interface WatchlistViewProps {
  watchlist: WatchlistItem[];
  offers: MedicineOffer[];
  onUpdateWatchlistItem: (item: {
    medicineId: string;
    medicineName: string;
    composition: string;
    targetMaxPtr: number;
    preferredQty: number;
    notes?: string;
  }) => Promise<void>;
  onRemoveWatchlistItem: (medicineId: string) => Promise<void>;
  onAddBestToCart: (offer: MedicineOffer, qty: number) => void;
  onBrowseCatalog: () => void;
}

export function WatchlistView({
  watchlist,
  offers,
  onUpdateWatchlistItem,
  onRemoveWatchlistItem,
  onAddBestToCart,
  onBrowseCatalog,
}: WatchlistViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPtr, setDraftPtr] = useState<string>('');
  const [draftQty, setDraftQty] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const bestOfferByMedicine = useMemo(() => {
    const map = new Map<string, MedicineOffer>();
    for (const offer of offers) {
      if (offer.stockStatus === 'Out of Stock') continue;
      const current = map.get(offer.medicineId);
      if (!current || offer.ptrInr < current.ptrInr) {
        map.set(offer.medicineId, offer);
      }
    }
    return map;
  }, [offers]);

  const startEditing = (item: WatchlistItem) => {
    setEditingId(item.medicineId);
    setDraftPtr(String(item.targetMaxPtr));
    setDraftQty(String(item.preferredQty));
  };

  const handleSave = async (item: WatchlistItem) => {
    setSavingId(item.medicineId);
    try {
      await onUpdateWatchlistItem({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        composition: item.composition,
        targetMaxPtr: Number(draftPtr) || item.targetMaxPtr,
        preferredQty: Math.max(1, Math.floor(Number(draftQty) || item.preferredQty)),
        notes: item.notes,
      });
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  if (watchlist.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          No medicines in your urgent restock watchlist
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
          Pin fast-moving or low-stock medicines from Medicine Search to monitor best distributor
          PTR prices and reorder quickly.
        </p>
        <button
          type="button"
          onClick={onBrowseCatalog}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
        >
          <span>Browse Medicine Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Urgent Restock Watchlist</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track target PTR thresholds against live verified distributor quotes
          </p>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
              <th className="py-2.5 px-5">Medicine &amp; Salt</th>
              <th className="py-2.5 px-3 text-right">Target Max PTR</th>
              <th className="py-2.5 px-3 text-right">Best Live PTR</th>
              <th className="py-2.5 px-3 text-right">Preferred Qty</th>
              <th className="py-2.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {watchlist.map((item) => {
              const bestOffer = bestOfferByMedicine.get(item.medicineId);
              const isEditing = editingId === item.medicineId;
              const isSaving = savingId === item.medicineId;
              const withinTarget = bestOffer ? bestOffer.ptrInr <= item.targetMaxPtr : false;

              return (
                <tr key={item.medicineId} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-slate-900">{item.medicineName}</p>
                    <p className="text-xs text-slate-500">{item.composition}</p>
                    {bestOffer && (
                      <p className="mt-1 text-xs text-slate-600">
                        Best supplier: {bestOffer.distributorName} ({bestOffer.distributorCity}) ·{' '}
                        {bestOffer.deliveryEta}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={draftPtr}
                        onChange={(e) => setDraftPtr(e.target.value)}
                        className="w-24 px-2 py-1 text-right text-xs border border-slate-300 rounded"
                      />
                    ) : (
                      <span className="text-slate-900">₹{item.targetMaxPtr.toFixed(2)}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                    {bestOffer ? (
                      <div>
                        <span
                          className={`font-semibold ${
                            withinTarget ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          ₹{bestOffer.ptrInr.toFixed(2)}
                        </span>
                        {withinTarget && (
                          <p className="inline-flex items-center justify-end gap-1 text-[11px] font-sans text-emerald-700 ml-2">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>At Target</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-sans text-red-700">Out of Stock</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        value={draftQty}
                        onChange={(e) => setDraftQty(e.target.value)}
                        className="w-20 px-2 py-1 text-right text-xs border border-slate-300 rounded"
                      />
                    ) : (
                      <span>{item.preferredQty}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSave(item)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            Edit Target
                          </button>
                          {bestOffer && (
                            <button
                              type="button"
                              onClick={() =>
                                onAddBestToCart(
                                  bestOffer,
                                  Math.max(bestOffer.minQty, item.preferredQty)
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add Best</span>
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`Remove ${item.medicineName} from watchlist`}
                            onClick={() => onRemoveWatchlistItem(item.medicineId)}
                            className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
