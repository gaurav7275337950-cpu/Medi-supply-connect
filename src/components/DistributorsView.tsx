import React, { useMemo, useState } from 'react';
import { ArrowRight, MapPin, ShieldCheck, Star } from 'lucide-react';
import type { Distributor, MedicineOffer } from '../types';

interface DistributorsViewProps {
  distributors: Distributor[];
  offers: MedicineOffer[];
  onFilterByDistributor: (distributorId: string) => void;
}

export function DistributorsView({
  distributors,
  offers,
  onFilterByDistributor,
}: DistributorsViewProps) {
  const [stateFilter, setStateFilter] = useState<'All' | 'Uttar Pradesh' | 'Uttarakhand'>('All');

  const offerCountsByDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of offers) {
      if (o.stockStatus !== 'Out of Stock') {
        map.set(o.distributorId, (map.get(o.distributorId) ?? 0) + 1);
      }
    }
    return map;
  }, [offers]);

  const filtered = useMemo(() => {
    if (stateFilter === 'All') return distributors;
    return distributors.filter((d) => d.state === stateFilter);
  }, [distributors, stateFilter]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {(['All', 'Uttar Pradesh', 'Uttarakhand'] as const).map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => setStateFilter(region)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stateFilter === region
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {region === 'All' ? 'All Corridors' : region}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {filtered.length} verified wholesale distributors
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dist) => {
          const activeOffers = offerCountsByDist.get(dist.id) ?? 0;

          return (
            <article
              key={dist.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{dist.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {dist.city}, {dist.state}
                      </span>
                    </p>
                  </div>

                  {dist.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                      <span>DL Verified</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500">Drug License (20B/21B)</p>
                    <p className="mt-0.5 font-mono font-medium text-slate-900">
                      {dist.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Delivery Window</p>
                    <p className="mt-0.5 font-medium text-slate-900">{dist.deliveryWindow}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Minimum PO Value</p>
                    <p className="mt-0.5 font-mono font-medium text-slate-900 tabular-nums">
                      ₹{dist.minOrderInr.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Service Rating</p>
                    <p className="mt-0.5 font-mono font-medium text-slate-900 inline-flex items-center gap-1 tabular-nums">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{dist.rating.toFixed(1)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-600 tabular-nums">
                  {activeOffers} active SKUs in stock
                </span>
                <button
                  type="button"
                  onClick={() => onFilterByDistributor(dist.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Browse Stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
