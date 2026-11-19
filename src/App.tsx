import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Building2,
  ClipboardList,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GoogleSignInGate } from './components/GoogleSignInGate';
import { MedicineSearchView } from './components/MedicineSearchView';
import { ProcurementCartView } from './components/ProcurementCartView';
import { OrdersTrackingView } from './components/OrdersTrackingView';
import { WatchlistView } from './components/WatchlistView';
import { DistributorsView } from './components/DistributorsView';
import { PharmacyProfileView } from './components/PharmacyProfileView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SEED_DISTRIBUTORS, SEED_MEDICINE_OFFERS } from './data/catalogSeed';
import {
  addOrUpdateWatchlistItem,
  createProcurementOrder,
  removeWatchlistItem,
  subscribeDistributors,
  subscribeMedicineOffers,
  subscribeUserOrders,
  subscribeWatchlist,
} from './services/firestoreService';
import type {
  CartItem,
  Distributor,
  MedicineOffer,
  ProcurementOrder,
  WatchlistItem,
  WorkspaceSection,
} from './types';

function WorkspaceApp() {
  const { user, profile, authReady, signOutUser } = useAuth();

  const [activeSection, setActiveSection] = useState<WorkspaceSection>('search');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [distributors, setDistributors] = useState<Distributor[]>(SEED_DISTRIBUTORS);
  const [offers, setOffers] = useState<MedicineOffer[]>(SEED_MEDICINE_OFFERS);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [distributorFilter, setDistributorFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!authReady || !user) return;

    const unsubDist = subscribeDistributors(setDistributors);
    const unsubOffers = subscribeMedicineOffers(setOffers);
    const unsubOrders = subscribeUserOrders(user.uid, (list) => {
      setOrders(list);
      setOrdersLoading(false);
    });
    const unsubWatchlist = subscribeWatchlist(user.uid, setWatchlist);

    return () => {
      unsubDist();
      unsubOffers();
      unsubOrders();
      unsubWatchlist();
    };
  }, [authReady, user]);

  const handleAddToCart = (offer: MedicineOffer, quantity: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.offer.id === offer.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: Math.min(offer.stockQty || 1000, updated[idx].quantity + quantity),
        };
        return updated;
      }
      return [...prev, { offer, quantity }];
    });
  };

  const handleUpdateCartQty = (offerId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.offer.id === offerId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (offerId: string) => {
    setCart((prev) => prev.filter((item) => item.offer.id !== offerId));
  };

  const handleSubmitDistributorOrder = async (params: {
    distributorId: string;
    distributorName: string;
    deliveryEta: string;
    items: CartItem[];
    notes: string;
  }) => {
    if (!user || !profile) {
      throw new Error('Please sign in to submit an order.');
    }
    const orderNumber = await createProcurementOrder({
      pharmacyUid: user.uid,
      profile,
      distributorId: params.distributorId,
      distributorName: params.distributorName,
      deliveryEta: params.deliveryEta,
      items: params.items,
      notes: params.notes,
    });
    setCart((prev) => prev.filter((item) => item.offer.distributorId !== params.distributorId));
    return orderNumber;
  };

  const handleToggleWatchlist = async (medicine: {
    medicineId: string;
    medicineName: string;
    composition: string;
    bestPtr: number;
    minQty: number;
  }) => {
    if (!user) return;
    const exists = watchlist.some((w) => w.medicineId === medicine.medicineId);
    if (exists) {
      await removeWatchlistItem(user.uid, medicine.medicineId);
    } else {
      await addOrUpdateWatchlistItem(
        user.uid,
        {
          medicineId: medicine.medicineId,
          medicineName: medicine.medicineName,
          composition: medicine.composition,
          targetMaxPtr: medicine.bestPtr,
          preferredQty: medicine.minQty,
        },
        false
      );
    }
  };

  const cartItemCount = useMemo(() => cart.length, [cart]);
  const activeOrdersCount = useMemo(
    () => orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length,
    [orders]
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-sm text-slate-600">Loading MediSupply Connect...</div>
      </div>
    );
  }

  if (!user) {
    return <GoogleSignInGate />;
  }

  const navItems: {
    id: WorkspaceSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { id: 'search', label: 'Medicine Search', icon: Search },
    { id: 'cart', label: 'Procurement Cart', icon: ShoppingCart, count: cartItemCount },
    { id: 'orders', label: 'Orders & Tracking', icon: ClipboardList, count: activeOrdersCount },
    { id: 'watchlist', label: 'Restock Watchlist', icon: Bookmark, count: watchlist.length },
    { id: 'distributors', label: 'Distributors', icon: Building2 },
    { id: 'profile', label: 'Pharmacy Profile', icon: Store },
  ];

  const sectionTitles: Record<WorkspaceSection, string> = {
    search: 'Medicine Search & Price Comparison',
    cart: 'Procurement Cart & Order Submission',
    orders: 'Procurement Orders & Delivery Tracking',
    watchlist: 'Urgent Restock Watchlist',
    distributors: 'Verified UP & Uttarakhand Distributors',
    profile: 'Pharmacy Account & Licensing',
  };

  const userInitials = (profile?.displayName || user.displayName || 'P')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-20">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            MediSupply Connect
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-teal-700' : 'text-slate-400'}`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={profile?.displayName || 'User avatar'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-teal-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.pharmacyName || 'Retail Pharmacy'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOutUser}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 flex flex-col z-50">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="text-base font-bold text-slate-900">MediSupply Connect</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg ${
                      active ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="text-xs font-mono tabular-nums">{item.count}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={signOutUser}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">
                {profile?.pharmacyName || 'Retail Pharmacy'} · {profile?.city || 'Dehradun'},{' '}
                {profile?.state || 'Uttarakhand'}
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                {sectionTitles[activeSection]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection('cart')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart ({cartItemCount})</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'search' && (
            <MedicineSearchView
              offers={offers}
              distributors={distributors}
              watchlist={watchlist}
              initialDistributorFilter={distributorFilter}
              onClearInitialDistributor={() => setDistributorFilter(undefined)}
              onAddToCart={handleAddToCart}
              onToggleWatchlist={handleToggleWatchlist}
              onGoToCart={() => setActiveSection('cart')}
              cartCount={cartItemCount}
            />
          )}

          {activeSection === 'cart' && (
            <ProcurementCartView
              cart={cart}
              distributors={distributors}
              profile={profile}
              onUpdateQty={handleUpdateCartQty}
              onRemoveItem={handleRemoveCartItem}
              onSubmitDistributorOrder={handleSubmitDistributorOrder}
              onBrowseCatalog={() => setActiveSection('search')}
              onViewOrders={() => setActiveSection('orders')}
            />
          )}

          {activeSection === 'orders' && (
            <OrdersTrackingView
              uid={user.uid}
              orders={orders}
              loading={ordersLoading}
              onBrowseCatalog={() => setActiveSection('search')}
            />
          )}

          {activeSection === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              offers={offers}
              onUpdateWatchlistItem={async (item) => {
                await addOrUpdateWatchlistItem(user.uid, item, true);
              }}
              onRemoveWatchlistItem={async (medicineId) => {
                await removeWatchlistItem(user.uid, medicineId);
              }}
              onAddBestToCart={(offer, qty) => {
                handleAddToCart(offer, qty);
                setActiveSection('cart');
              }}
              onBrowseCatalog={() => setActiveSection('search')}
            />
          )}

          {activeSection === 'distributors' && (
            <DistributorsView
              distributors={distributors}
              offers={offers}
              onFilterByDistributor={(distId) => {
                setDistributorFilter(distId);
                setActiveSection('search');
              }}
            />
          )}

          {activeSection === 'profile' && <PharmacyProfileView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WorkspaceApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
