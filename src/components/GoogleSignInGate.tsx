import React from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  TrendingDown,
  Truck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function GoogleSignInGate() {
  const { signInWithGoogle, signingIn, authError, clearAuthError } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            MediSupply Connect
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#overview"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#workflow"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <a
              href="#coverage"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Coverage
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="inline-flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GoogleMark />
              <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section id="overview" className="max-w-7xl mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium tracking-wide text-teal-800">
                B2B Pharmaceutical Procurement · Uttar Pradesh &amp; Uttarakhand
              </p>

              <h1
                className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Check medicine availability and compare distributor prices in one place.
              </h1>

              <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-xl">
                Built for independent retail pharmacies across tier-2 and tier-3 cities. Replace
                fragmented phone calls and WhatsApp follow-ups with verified stock visibility,
                side-by-side PTR comparison, and direct order tracking.
              </p>

              {authError && (
                <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3">
                  <p className="text-sm text-red-800">{authError}</p>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="text-xs font-medium text-red-700 hover:text-red-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={signingIn}
                  className="inline-flex items-center gap-3 px-6 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <GoogleMark />
                  <span>{signingIn ? 'Connecting Google Account...' : 'Continue with Google'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#workflow"
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  See Procurement Flow
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>Google-verified pharmacy sign-in</span>
                <span aria-hidden="true">·</span>
                <span>DL-20B / 21B verified wholesalers</span>
                <span aria-hidden="true">·</span>
                <span>Transparent ₹99 fee per completed order</span>
              </div>
            </div>

            {/* Live Comparison Sample Preview */}
            <div className="lg:col-span-6 flex">
              <div className="w-full bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Live Multi-Supplier Comparison Sample
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">
                        Augmentin 625 Duo Tablet
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Amoxycillin 500mg + Clavulanic Acid 125mg · GSK · 10 Tabs
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500">MRP</p>
                      <p className="text-base font-mono font-semibold text-slate-900 tabular-nums">
                        ₹201.70
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                          <th className="py-2.5 pr-3">Distributor</th>
                          <th className="py-2.5 px-3 text-right">PTR</th>
                          <th className="py-2.5 px-3">Scheme</th>
                          <th className="py-2.5 pl-3 text-right">Stock &amp; ETA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        <tr>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-slate-900">Doon Valley Pharma</p>
                            <p className="text-xs text-slate-500">Dehradun, UK</p>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-teal-800 tabular-nums">
                            ₹144.20
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700">10+1 Free</td>
                          <td className="py-3 pl-3 text-right">
                            <p className="text-xs font-medium text-emerald-700">In Stock · 185</p>
                            <p className="text-xs text-slate-500">4–6 hrs Today</p>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-slate-900">Ganga Lifecare</p>
                            <p className="text-xs text-slate-500">Meerut, UP</p>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            ₹147.80
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700">Net Rate</td>
                          <td className="py-3 pl-3 text-right">
                            <p className="text-xs font-medium text-emerald-700">In Stock · 92</p>
                            <p className="text-xs text-slate-500">6 hrs Express</p>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-slate-900">Awadh Medico Supply</p>
                            <p className="text-xs text-slate-500">Lucknow, UP</p>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            ₹151.50
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700">2% Cash Disc</td>
                          <td className="py-3 pl-3 text-right">
                            <p className="text-xs font-medium text-amber-700">Low Stock · 18</p>
                            <p className="text-xs text-slate-500">Tomorrow 9 AM</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-4 text-xs text-slate-600">
                  <span>Best margin saves ₹7.30/strip vs highest quote</span>
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={signingIn}
                    className="font-semibold text-teal-800 hover:text-teal-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sign in to order →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Full-Width Summary Strip below Hero */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Regional Focus</p>
              <p className="mt-1.5 text-lg font-semibold text-slate-900">UP &amp; Uttarakhand</p>
              <p className="mt-1 text-xs text-slate-600">
                Serving independent pharmacies in tier-2 &amp; tier-3 cities
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Distributor Network</p>
              <p className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
                6 Verified Stockists
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Dehradun, Haldwani, Meerut, Lucknow, Kanpur, Varanasi
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Platform Pricing</p>
              <p className="mt-1.5 text-lg font-semibold text-slate-900 font-mono tabular-nums">
                ₹99 / Order
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Flat per-transaction fee with zero hidden markups on PTR
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Fulfillment SLA</p>
              <p className="mt-1.5 text-lg font-semibold text-slate-900">4–18 hrs Dispatch</p>
              <p className="mt-1 text-xs text-slate-600">
                Same-day local and next-morning regional delivery tracking
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="bg-white border-y border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                One procurement workflow instead of ten phone calls
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Designed around the daily restocking workflow of pharmacy owners and purchasing staff.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50">
                <Search className="w-5 h-5 text-teal-700" />
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  01. Search Availability
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Look up medicines by brand, salt composition, or manufacturer and see real-time
                  stock quantities across verified distributors.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50">
                <TrendingDown className="w-5 h-5 text-teal-700" />
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  02. Compare PTR &amp; Schemes
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Evaluate unit PTR, retailer margin against MRP, free-strip schemes, minimum order
                  quantities, and expiry dates side-by-side.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50">
                <Truck className="w-5 h-5 text-teal-700" />
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  03. Place &amp; Track Orders
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Submit distributor-wise purchase orders directly and follow confirmation,
                  dispatch, and delivery status from one dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage & Pricing Section */}
        <section id="coverage" className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl p-7">
              <div className="flex items-center gap-2.5 text-teal-800">
                <Building2 className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Verified Regional Wholesalers
                </h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Every distributor on MediSupply Connect carries verified Form 20B/21B wholesale
                drug licensing and clear regional delivery windows.
              </p>
              <div className="mt-5 divide-y divide-slate-100 border-t border-slate-200 text-sm">
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">Dehradun &amp; Haldwani Hubs</p>
                    <p className="text-xs text-slate-500">Uttarakhand · Doon Valley &amp; Kumaon</p>
                  </div>
                  <span className="text-xs font-mono text-slate-700 tabular-nums">4–8 hrs</span>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">Meerut &amp; Kanpur Hubs</p>
                    <p className="text-xs text-slate-500">Western &amp; Central Uttar Pradesh</p>
                  </div>
                  <span className="text-xs font-mono text-slate-700 tabular-nums">6–8 hrs</span>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">Lucknow &amp; Varanasi Hubs</p>
                    <p className="text-xs text-slate-500">Awadh &amp; Purvanchal Corridors</p>
                  </div>
                  <span className="text-xs font-mono text-slate-700 tabular-nums">12–18 hrs</span>
                </div>
              </div>
            </div>

            <div id="pricing" className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 text-teal-800">
                  <ShieldCheck className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Transparent Per-Order Pricing
                  </h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  No hidden distributor markups. Pay only when you submit a procurement order.
                </p>

                <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Standard Pilot Transaction Fee</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Includes supplier comparison, PO routing, and live delivery tracking
                    </p>
                  </div>
                  <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums shrink-0">
                    ₹99
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited medicine searches and real-time availability checks</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Urgent restock watchlist persisted to your pharmacy account</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant Google Sign-In with pharmacy profile &amp; order history</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">Ready to check stock for your store?</span>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={signingIn}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Sign in with Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>MediSupply Connect · B2B Pharmaceutical Procurement</span>
          <span>Serving Independent Retail Pharmacies in Uttar Pradesh &amp; Uttarakhand</span>
        </div>
      </footer>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M21.8 12.23c0-.72-.06-1.41-.18-2.08H12v3.94h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.5z"
      />
      <path
        fill="#E2E8F0"
        d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.97-3.45.97-2.65 0-4.9-1.79-5.7-4.2H2.89v2.64A9.99 9.99 0 0 0 12 22z"
      />
      <path
        fill="#CBD5E1"
        d="M6.3 13.74A6 6 0 0 1 5.99 12c0-.6.11-1.19.31-1.74V7.62H2.89A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.09 4.38l3.21-2.64z"
      />
      <path
        fill="#FFFFFF"
        d="M12 6.06c1.5 0 2.84.51 3.9 1.52l2.92-2.92C17.05 2.99 14.74 2 12 2 8.09 2 4.71 4.24 2.89 7.62l3.41 2.64c.8-2.41 3.05-4.2 5.7-4.2z"
      />
    </svg>
  );
}
