import type { Timestamp } from 'firebase/firestore';

export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  ID_MAX: 128,
  DISPLAY_NAME_MAX: 120,
  EMAIL_MAX: 254,
  PHOTO_URL_MAX: 500,
  PHARMACY_NAME_MAX: 140,
  DRUG_LICENSE_MAX: 60,
  GSTIN_MAX: 20,
  CITY_MAX: 80,
  PHONE_MAX: 20,
  MEDICINE_NAME_MAX: 140,
  COMPOSITION_MAX: 200,
  NOTES_MAX: 400,
  WATCHLIST_NOTES_MAX: 240,
  PLATFORM_FEE_INR: 99,
} as const;

export const MEDICINE_CATEGORIES = [
  'Antibiotics',
  'Cardiac & Diabetic',
  'Gastro & Acid Reflux',
  'Pain & Fever',
  'Respiratory',
  'Vitamins & OTC',
] as const;

export type MedicineCategory = (typeof MEDICINE_CATEGORIES)[number];

export const INDIAN_STATES = ['Uttar Pradesh', 'Uttarakhand', 'Other'] as const;
export type IndianState = (typeof INDIAN_STATES)[number];

export type DistributorState = 'Uttar Pradesh' | 'Uttarakhand';
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type OrderStatus = 'Placed' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type UserRole = 'pharmacy' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  pharmacyName: string;
  drugLicenseNo?: string;
  gstin?: string;
  city: string;
  state: IndianState;
  phone?: string;
  role: UserRole;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Distributor {
  id: string;
  name: string;
  city: string;
  state: DistributorState;
  licenseNumber: string;
  deliveryWindow: string;
  minOrderInr: number;
  rating: number;
  verified: boolean;
  active: boolean;
}

export interface MedicineOffer {
  id: string;
  medicineId: string;
  medicineName: string;
  composition: string;
  manufacturer: string;
  packSize: string;
  category: MedicineCategory;
  hsnCode: string;
  mrpInr: number;
  distributorId: string;
  distributorName: string;
  distributorCity: string;
  ptrInr: number;
  schemeLabel: string;
  stockQty: number;
  stockStatus: StockStatus;
  minQty: number;
  deliveryEta: string;
  expiryDate: string;
}

export interface CartItem {
  offer: MedicineOffer;
  quantity: number;
}

export interface ProcurementOrder {
  id: string;
  orderNumber: string;
  pharmacyUid: string;
  pharmacyName: string;
  pharmacyCity: string;
  pharmacyState: string;
  distributorId: string;
  distributorName: string;
  itemCount: number;
  subtotalInr: number;
  platformFeeInr: number;
  totalInr: number;
  status: OrderStatus;
  deliveryEta: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProcurementOrderItem {
  id: string;
  orderId: string;
  pharmacyUid: string;
  offerId: string;
  medicineName: string;
  composition: string;
  packSize: string;
  quantity: number;
  unitPtrInr: number;
  lineTotalInr: number;
  schemeLabel: string;
  createdAt?: Timestamp;
}

export interface WatchlistItem {
  medicineId: string;
  medicineName: string;
  composition: string;
  targetMaxPtr: number;
  preferredQty: number;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type WorkspaceSection =
  | 'search'
  | 'cart'
  | 'orders'
  | 'watchlist'
  | 'distributors'
  | 'profile';
