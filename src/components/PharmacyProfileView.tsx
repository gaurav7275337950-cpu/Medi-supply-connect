import React, { useEffect, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BLUEPRINT_LIMITS, INDIAN_STATES, type IndianState } from '../types';

export function PharmacyProfileView() {
  const { user, profile, savePharmacyProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [pharmacyName, setPharmacyName] = useState(profile?.pharmacyName || '');
  const [city, setCity] = useState(profile?.city || 'Dehradun');
  const [state, setState] = useState<IndianState>(profile?.state || 'Uttarakhand');
  const [drugLicenseNo, setDrugLicenseNo] = useState(profile?.drugLicenseNo || '');
  const [gstin, setGstin] = useState(profile?.gstin || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPharmacyName(profile.pharmacyName || '');
      setCity(profile.city || 'Dehradun');
      setState(profile.state || 'Uttarakhand');
      setDrugLicenseNo(profile.drugLicenseNo || '');
      setGstin(profile.gstin || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedNotice(false);
    setSaving(true);
    try {
      await savePharmacyProfile({
        displayName,
        pharmacyName,
        city,
        state,
        drugLicenseNo,
        gstin,
        phone,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save pharmacy profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Pharmacy Account &amp; Licensing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in via Google as {user?.email}. Details below appear on submitted distributor POs.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 uppercase">
          Role: {profile?.role || 'pharmacy'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {savedNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-sm text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Pharmacy profile saved to your account.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="pharmacyName" className="block text-xs font-medium text-slate-700 mb-1.5">
              Retail Pharmacy Name
            </label>
            <input
              id="pharmacyName"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.PHARMACY_NAME_MAX}
              value={pharmacyName}
              onChange={(e) => setPharmacyName(e.target.value)}
              placeholder="e.g., Shivalik Medicos"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-xs font-medium text-slate-700 mb-1.5">
              Pharmacist / Owner Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.DISPLAY_NAME_MAX}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-xs font-medium text-slate-700 mb-1.5">
              City / Town
            </label>
            <input
              id="city"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.CITY_MAX}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Dehradun, Meerut, Haldwani, Lucknow"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-xs font-medium text-slate-700 mb-1.5">
              State
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value as IndianState)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="drugLicenseNo" className="block text-xs font-medium text-slate-700 mb-1.5">
              Drug License Number (Form 20 / 21)
            </label>
            <input
              id="drugLicenseNo"
              type="text"
              maxLength={BLUEPRINT_LIMITS.DRUG_LICENSE_MAX}
              value={drugLicenseNo}
              onChange={(e) => setDrugLicenseNo(e.target.value)}
              placeholder="e.g., UK-DDN-20-10492"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label htmlFor="gstin" className="block text-xs font-medium text-slate-700 mb-1.5">
              GSTIN (Optional)
            </label>
            <input
              id="gstin"
              type="text"
              maxLength={BLUEPRINT_LIMITS.GSTIN_MAX}
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="e.g., 05AABCS1429B1Z5"
              className="w-full px-3.5 py-2 text-sm font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-slate-700 mb-1.5">
              Contact Phone (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Pharmacy Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
