import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { fetchOrderItems, updateOrderStatus } from '../services/firestoreService';
import type { OrderStatus, ProcurementOrder, ProcurementOrderItem } from '../types';

interface OrdersTrackingViewProps {
  uid: string;
  orders: ProcurementOrder[];
  loading: boolean;
  onBrowseCatalog: () => void;
}

const STATUS_STEPS: OrderStatus[] = ['Placed', 'Confirmed', 'Dispatched', 'Delivered'];

export function OrdersTrackingView({
  uid,
  orders,
  loading,
  onBrowseCatalog,
}: OrdersTrackingViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, ProcurementOrderItem[]>>({});
  const [loadingItemsId, setLoadingItemsId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'All') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!itemsByOrder[orderId]) {
      setLoadingItemsId(orderId);
      try {
        const items = await fetchOrderItems(orderId, uid);
        setItemsByOrder((prev) => ({ ...prev, [orderId]: items }));
      } finally {
        setLoadingItemsId(null);
      }
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatTimestamp = (order: ProcurementOrder) => {
    const ms = order.createdAt?.toMillis?.();
    if (!ms) return 'Just now';
    return new Date(ms).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Segmented Status Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Truck className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {orders.length === 0 ? 'No procurement orders yet' : `No ${statusFilter.toLowerCase()} orders`}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            {orders.length === 0
              ? 'Compare distributor prices in Medicine Search and place your first procurement order.'
              : 'Select another status tab to view your procurement history.'}
          </p>
          {orders.length === 0 && (
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              <span>Search Medicines</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const items = itemsByOrder[order.id] ?? [];
            const isLoadingItems = loadingItemsId === order.id;
            const isUpdating = updatingOrderId === order.id;
            const currentStepIdx = STATUS_STEPS.indexOf(order.status);

            const nextStep: OrderStatus | null =
              order.status === 'Placed'
                ? 'Confirmed'
                : order.status === 'Confirmed'
                  ? 'Dispatched'
                  : order.status === 'Dispatched'
                    ? 'Delivered'
                    : null;

            return (
              <section
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                        {order.orderNumber}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <OrderStatusIndicator status={order.status} />
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {formatTimestamp(order)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {order.distributorName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.itemCount} {order.itemCount === 1 ? 'line item' : 'line items'} · ETA{' '}
                      {order.deliveryEta} · Delivering to {order.pharmacyCity}, {order.pharmacyState}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <div className="text-left lg:text-right">
                      <p className="text-[11px] text-slate-500">
                        Subtotal ₹{order.subtotalInr.toFixed(2)} + ₹{order.platformFeeInr} fee
                      </p>
                      <p className="text-base font-mono font-bold text-slate-900 tabular-nums">
                        ₹{order.totalInr.toFixed(2)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Track & Inspect'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-5 space-y-5">
                    {/* Fulfillment Pipeline */}
                    {order.status !== 'Cancelled' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {STATUS_STEPS.map((step, idx) => {
                          const completed = currentStepIdx >= idx;
                          return (
                            <div
                              key={step}
                              className={`p-3 rounded-lg border ${
                                completed
                                  ? 'bg-white border-teal-300 text-slate-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono tabular-nums">0{idx + 1}</span>
                                {completed && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                )}
                              </div>
                              <p className="mt-1 text-xs font-semibold">{step}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>This procurement order was cancelled prior to dispatch.</span>
                      </div>
                    )}

                    {order.notes && (
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-800">Pharmacy Note:</strong> {order.notes}
                      </p>
                    )}

                    {/* Line Items Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      {isLoadingItems ? (
                        <div className="p-4 text-xs text-slate-500">Loading order line items...</div>
                      ) : items.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500">No line items recorded.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                                <th className="py-2.5 px-4">Medicine</th>
                                <th className="py-2.5 px-3">Pack</th>
                                <th className="py-2.5 px-3">Scheme</th>
                                <th className="py-2.5 px-3 text-right">Qty</th>
                                <th className="py-2.5 px-3 text-right">Unit PTR</th>
                                <th className="py-2.5 px-4 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-2.5 px-4">
                                    <p className="font-medium text-slate-900">{item.medicineName}</p>
                                    <p className="text-slate-500">{item.composition}</p>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600">{item.packSize}</td>
                                  <td className="py-2.5 px-3 text-slate-600">{item.schemeLabel}</td>
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                    {item.quantity}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                    ₹{item.unitPtrInr.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                                    ₹{item.lineTotalInr.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Pilot Fulfillment Controls */}
                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-slate-500">
                          Fulfillment status updates sync immediately to your pharmacy record
                        </span>
                        <div className="flex items-center gap-2.5">
                          {(order.status === 'Placed' || order.status === 'Confirmed') && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(order.id, 'Cancelled')}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Cancel Order
                            </button>
                          )}
                          {nextStep && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(order.id, nextStep)}
                              className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              {isUpdating ? 'Updating...' : `Mark as ${nextStep}`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderStatusIndicator({ status }: { status: OrderStatus }) {
  if (status === 'Delivered') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <PackageCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Delivered</span>
      </span>
    );
  }
  if (status === 'Dispatched') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        <span>Dispatched</span>
      </span>
    );
  }
  if (status === 'Confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Confirmed</span>
      </span>
    );
  }
  if (status === 'Cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Cancelled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>Placed</span>
    </span>
  );
}
