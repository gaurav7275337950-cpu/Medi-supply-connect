import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { BLUEPRINT_LIMITS, type CartItem, type Distributor, type UserProfile } from '../types';

interface ProcurementCartViewProps {
  cart: CartItem[];
  distributors: Distributor[];
  profile: UserProfile | null;
  onUpdateQty: (offerId: string, quantity: number) => void;
  onRemoveItem: (offerId: string) => void;
  onSubmitDistributorOrder: (params: {
    distributorId: string;
    distributorName: string;
    deliveryEta: string;
    items: CartItem[];
    notes: string;
  }) => Promise<string>;
  onBrowseCatalog: () => void;
  onViewOrders: () => void;
}

export function ProcurementCartView({
  cart,
  distributors,
  profile,
  onUpdateQty,
  onRemoveItem,
  onSubmitDistributorOrder,
  onBrowseCatalog,
  onViewOrders,
}: ProcurementCartViewProps) {
  const [notesByDist, setNotesByDist] = useState<Record<string, string>>({});
  const [submittingDist, setSubmittingDist] = useState<string | null>(null);
  const [submittedOrderNumbers, setSubmittedOrderNumbers] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const distributorMap = useMemo(() => {
    const map = new Map<string, Distributor>();
    for (const d of distributors) {
      map.set(d.id, d);
    }
    return map;
  }, [distributors]);

  const groupedCart = useMemo(() => {
    const map = new Map<
      string,
      {
        distributorId: string;
        distributorName: string;
        distributorCity: string;
        deliveryEta: string;
        minOrderInr: number;
        items: CartItem[];
        subtotalInr: number;
        mrpValueInr: number;
      }
    >();

    for (const item of cart) {
      const distId = item.offer.distributorId;
      const distMeta = distributorMap.get(distId);
      const linePtr = item.offer.ptrInr * item.quantity;
      const lineMrp = item.offer.mrpInr * item.quantity;

      const existing = map.get(distId);
      if (existing) {
        existing.items.push(item);
        existing.subtotalInr += linePtr;
        existing.mrpValueInr += lineMrp;
      } else {
        map.set(distId, {
          distributorId: distId,
          distributorName: item.offer.distributorName,
          distributorCity: item.offer.distributorCity,
          deliveryEta: item.offer.deliveryEta,
          minOrderInr: distMeta?.minOrderInr ?? 1500,
          items: [item],
          subtotalInr: linePtr,
          mrpValueInr: lineMrp,
        });
      }
    }

    return Array.from(map.values());
  }, [cart, distributorMap]);

  const handlePlaceOrder = async (group: (typeof groupedCart)[number]) => {
    setSubmitError(null);
    setSubmittingDist(group.distributorId);
    try {
      const orderNum = await onSubmitDistributorOrder({
        distributorId: group.distributorId,
        distributorName: group.distributorName,
        deliveryEta: group.deliveryEta,
        items: group.items,
        notes: notesByDist[group.distributorId] ?? '',
      });
      setSubmittedOrderNumbers((prev) => [orderNum, ...prev]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit order.');
    } finally {
      setSubmittingDist(null);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        {submittedOrderNumbers.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  Procurement order {submittedOrderNumbers[0]} submitted
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Your order has been recorded and routed for distributor confirmation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onViewOrders}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Track Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Your procurement cart is empty
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Search medicines and compare distributor PTR offers to add stock to your purchase order.
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {submittedOrderNumbers.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-sm font-medium text-emerald-950">
              Order {submittedOrderNumbers[0]} submitted to distributor.
            </span>
          </div>
          <button
            type="button"
            onClick={onViewOrders}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            View Orders &amp; Tracking →
          </button>
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          {submitError}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Delivering to: {profile?.pharmacyName || 'Retail Pharmacy'}
          </p>
          <p className="text-xs text-slate-500">
            {profile?.city || 'Dehradun'}, {profile?.state || 'Uttarakhand'}
            {profile?.drugLicenseNo ? ` · DL ${profile.drugLicenseNo}` : ''}
          </p>
        </div>
        <span className="text-xs text-slate-600">
          {groupedCart.length} distributor purchase{' '}
          {groupedCart.length === 1 ? 'order' : 'orders'} · ₹{BLUEPRINT_LIMITS.PLATFORM_FEE_INR} platform fee per PO
        </span>
      </div>

      {groupedCart.map((group) => {
        const belowMin = group.subtotalInr < group.minOrderInr;
        const totalInr = group.subtotalInr + BLUEPRINT_LIMITS.PLATFORM_FEE_INR;
        const estimatedRetailMargin = group.mrpValueInr - group.subtotalInr;
        const isSubmitting = submittingDist === group.distributorId;

        return (
          <section
            key={group.distributorId}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {group.distributorName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {group.distributorCity} · ETA {group.deliveryEta} · Min PO ₹
                  <span className="tabular-nums">{group.minOrderInr.toLocaleString('en-IN')}</span>
                </p>
              </div>
              {belowMin && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Add ₹{(group.minOrderInr - group.subtotalInr).toFixed(2)} more to meet distributor
                    minimum (or submit as urgent pilot PO)
                  </span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-5">Medicine</th>
                    <th className="py-2.5 px-3 text-right">Unit PTR</th>
                    <th className="py-2.5 px-3">Scheme</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Line Subtotal</th>
                    <th className="py-2.5 px-5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {group.items.map(({ offer, quantity }) => (
                    <tr key={offer.id}>
                      <td className="py-3 px-5">
                        <p className="font-medium text-slate-900">{offer.medicineName}</p>
                        <p className="text-xs text-slate-500">
                          {offer.composition} · {offer.packSize}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900 tabular-nums">
                        ₹{offer.ptrInr.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700">{offer.schemeLabel}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(offer.id, quantity - 1)}
                            disabled={quantity <= offer.minQty}
                            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-xs font-mono font-medium tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(offer.id, quantity + 1)}
                            disabled={quantity >= offer.stockQty}
                            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        ₹{(offer.ptrInr * quantity).toFixed(2)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          aria-label={`Remove ${offer.medicineName}`}
                          onClick={() => onRemoveItem(offer.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50/40 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-7">
                <label
                  htmlFor={`notes-${group.distributorId}`}
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Delivery / Batch Notes for Distributor (Optional)
                </label>
                <input
                  id={`notes-${group.distributorId}`}
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.NOTES_MAX}
                  value={notesByDist[group.distributorId] ?? ''}
                  onChange={(e) =>
                    setNotesByDist((prev) => ({
                      ...prev,
                      [group.distributorId]: e.target.value,
                    }))
                  }
                  placeholder="e.g., Urgent evening counter stock; send fresh 2028 expiry batch"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4">
                <div className="w-full space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Medicines Subtotal</span>
                    <span className="font-mono tabular-nums">₹{group.subtotalInr.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>MediSupply Platform Fee</span>
                    <span className="font-mono tabular-nums">
                      ₹{BLUEPRINT_LIMITS.PLATFORM_FEE_INR.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Estimated Retail Margin vs MRP</span>
                    <span className="font-mono tabular-nums">
                      +₹{estimatedRetailMargin.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-900">
                    <span>Total Order Payable</span>
                    <span className="font-mono text-base tabular-nums">
                      ₹{totalInr.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePlaceOrder(group)}
                  className="w-full sm:w-auto lg:w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? 'Submitting Order...'
                      : `Submit Procurement Order (₹${totalInr.toFixed(2)})`}
                  </span>
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
