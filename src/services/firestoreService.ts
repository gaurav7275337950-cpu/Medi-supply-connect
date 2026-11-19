import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SEED_DISTRIBUTORS, SEED_MEDICINE_OFFERS } from '../data/catalogSeed';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import {
  BLUEPRINT_LIMITS,
  type CartItem,
  type Distributor,
  type IndianState,
  type MedicineOffer,
  type OrderStatus,
  type ProcurementOrder,
  type ProcurementOrderItem,
  type UserProfile,
  type WatchlistItem,
} from '../types';

function sanitizeString(value: string | undefined | null, maxLength: number): string {
  if (!value) return '';
  return value.trim().slice(0, maxLength);
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function getOrCreateUserProfile(params: {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}): Promise<UserProfile> {
  const path = `users/${params.uid}`;
  const ref = doc(db, 'users', params.uid);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const cleanName = sanitizeString(params.displayName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) || 'Pharmacy Owner';
    const cleanEmail = sanitizeString(params.email, BLUEPRINT_LIMITS.EMAIL_MAX);
    const cleanPhoto = sanitizeString(params.photoURL, BLUEPRINT_LIMITS.PHOTO_URL_MAX);

    const defaultPharmacyName = sanitizeString(
      `${cleanName.split(' ')[0]} Medical Store`,
      BLUEPRINT_LIMITS.PHARMACY_NAME_MAX
    );

    const payload: Record<string, unknown> = {
      uid: params.uid,
      displayName: cleanName,
      email: cleanEmail,
      pharmacyName: defaultPharmacyName,
      city: 'Dehradun',
      state: 'Uttarakhand' as IndianState,
      role: 'pharmacy',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (cleanPhoto) {
      payload.photoURL = cleanPhoto;
    }

    await setDoc(ref, payload);
    const createdSnap = await getDoc(ref);
    return (createdSnap.data() as UserProfile) ?? ({
      uid: params.uid,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: cleanPhoto || undefined,
      pharmacyName: defaultPharmacyName,
      city: 'Dehradun',
      state: 'Uttarakhand',
      role: 'pharmacy',
    } as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserPharmacyProfile(
  uid: string,
  updates: {
    displayName: string;
    pharmacyName: string;
    drugLicenseNo?: string;
    gstin?: string;
    city: string;
    state: IndianState;
    phone?: string;
  }
): Promise<void> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  const payload: Record<string, unknown> = {
    displayName: sanitizeString(updates.displayName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) || 'Pharmacy Owner',
    pharmacyName: sanitizeString(updates.pharmacyName, BLUEPRINT_LIMITS.PHARMACY_NAME_MAX) || 'Retail Pharmacy',
    city: sanitizeString(updates.city, BLUEPRINT_LIMITS.CITY_MAX) || 'Dehradun',
    state: updates.state,
    updatedAt: serverTimestamp(),
  };

  const dl = sanitizeString(updates.drugLicenseNo, BLUEPRINT_LIMITS.DRUG_LICENSE_MAX);
  const gst = sanitizeString(updates.gstin, BLUEPRINT_LIMITS.GSTIN_MAX);
  const phone = sanitizeString(updates.phone, BLUEPRINT_LIMITS.PHONE_MAX);

  if (dl) payload.drugLicenseNo = dl;
  if (gst) payload.gstin = gst;
  if (phone) payload.phone = phone;

  try {
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function seedCatalogIfAdmin(userEmail: string | null): Promise<boolean> {
  if (userEmail !== 'gaurav7275337950@gmail.com') {
    return false;
  }

  try {
    const distQuery = query(collection(db, 'distributors'), where('active', '==', true));
    const distSnap = await getDocs(distQuery);
    const offersQuery = query(collection(db, 'medicineOffers'), where('mrpInr', '>', 0));
    const offersSnap = await getDocs(offersQuery);

    if (!distSnap.empty && !offersSnap.empty) {
      return false;
    }

    const batch = writeBatch(db);
    if (distSnap.empty) {
      for (const d of SEED_DISTRIBUTORS) {
        batch.set(doc(db, 'distributors', d.id), {
          ...d,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (offersSnap.empty) {
      for (const offer of SEED_MEDICINE_OFFERS) {
        batch.set(doc(db, 'medicineOffers', offer.id), {
          ...offer,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'distributors');
  }
}

export function subscribeDistributors(
  onData: (distributors: Distributor[]) => void
): Unsubscribe {
  const path = 'distributors';
  const q = query(collection(db, path), where('active', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(SEED_DISTRIBUTORS);
        return;
      }
      const list = snapshot.docs.map((d) => d.data() as Distributor);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeMedicineOffers(
  onData: (offers: MedicineOffer[]) => void
): Unsubscribe {
  const path = 'medicineOffers';
  const q = query(collection(db, path), where('mrpInr', '>', 0));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(SEED_MEDICINE_OFFERS);
        return;
      }
      const list = snapshot.docs.map((d) => d.data() as MedicineOffer);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserOrders(
  uid: string,
  onData: (orders: ProcurementOrder[]) => void
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), where('pharmacyUid', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProcurementOrder, 'id'>),
      }));
      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function fetchOrderItems(orderId: string, uid: string): Promise<ProcurementOrderItem[]> {
  const path = `orders/${orderId}/items`;
  try {
    const q = query(collection(db, 'orders', orderId, 'items'), where('pharmacyUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ProcurementOrderItem, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createProcurementOrder(params: {
  pharmacyUid: string;
  profile: UserProfile;
  distributorId: string;
  distributorName: string;
  deliveryEta: string;
  items: CartItem[];
  notes?: string;
}): Promise<string> {
  const orderId = generateId('ord');
  const orderNumber = `MSC-${new Date().getFullYear().toString().slice(-2)}${String(
    Math.floor(100000 + Math.random() * 900000)
  )}`;
  const path = `orders/${orderId}`;

  const subtotalInr = Number(
    params.items.reduce((sum, item) => sum + item.offer.ptrInr * item.quantity, 0).toFixed(2)
  );
  const platformFeeInr = BLUEPRINT_LIMITS.PLATFORM_FEE_INR;
  const totalInr = Number((subtotalInr + platformFeeInr).toFixed(2));
  const cleanNotes = sanitizeString(params.notes, BLUEPRINT_LIMITS.NOTES_MAX);

  const orderPayload: Record<string, unknown> = {
    orderNumber,
    pharmacyUid: params.pharmacyUid,
    pharmacyName: sanitizeString(params.profile.pharmacyName, BLUEPRINT_LIMITS.PHARMACY_NAME_MAX),
    pharmacyCity: sanitizeString(params.profile.city, BLUEPRINT_LIMITS.CITY_MAX),
    pharmacyState: params.profile.state,
    distributorId: params.distributorId,
    distributorName: sanitizeString(params.distributorName, BLUEPRINT_LIMITS.PHARMACY_NAME_MAX),
    itemCount: params.items.length,
    subtotalInr,
    platformFeeInr,
    totalInr,
    status: 'Placed' as OrderStatus,
    deliveryEta: sanitizeString(params.deliveryEta, 60) || '6–12 hrs',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (cleanNotes) {
    orderPayload.notes = cleanNotes;
  }

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', orderId), orderPayload);

    params.items.forEach((cartItem, idx) => {
      const itemId = `item_${idx + 1}_${cartItem.offer.id}`.slice(0, 128);
      const lineTotal = Number((cartItem.offer.ptrInr * cartItem.quantity).toFixed(2));
      batch.set(doc(db, 'orders', orderId, 'items', itemId), {
        orderId,
        pharmacyUid: params.pharmacyUid,
        offerId: cartItem.offer.id,
        medicineName: sanitizeString(cartItem.offer.medicineName, BLUEPRINT_LIMITS.MEDICINE_NAME_MAX),
        composition: sanitizeString(cartItem.offer.composition, BLUEPRINT_LIMITS.COMPOSITION_MAX),
        packSize: sanitizeString(cartItem.offer.packSize, 60),
        quantity: Math.max(1, Math.floor(cartItem.quantity)),
        unitPtrInr: cartItem.offer.ptrInr,
        lineTotalInr: lineTotal,
        schemeLabel: sanitizeString(cartItem.offer.schemeLabel, 60) || 'Net Rate',
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return orderNumber;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeWatchlist(
  uid: string,
  onData: (items: WatchlistItem[]) => void
): Unsubscribe {
  const path = `users/${uid}/watchlist`;
  return onSnapshot(
    collection(db, 'users', uid, 'watchlist'),
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as WatchlistItem);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addOrUpdateWatchlistItem(
  uid: string,
  item: {
    medicineId: string;
    medicineName: string;
    composition: string;
    targetMaxPtr: number;
    preferredQty: number;
    notes?: string;
  },
  isExisting: boolean
): Promise<void> {
  const path = `users/${uid}/watchlist/${item.medicineId}`;
  const ref = doc(db, 'users', uid, 'watchlist', item.medicineId);
  const cleanNotes = sanitizeString(item.notes, BLUEPRINT_LIMITS.WATCHLIST_NOTES_MAX);

  try {
    if (isExisting) {
      const payload: Record<string, unknown> = {
        targetMaxPtr: Math.max(0, Number(item.targetMaxPtr) || 0),
        preferredQty: Math.max(1, Math.floor(item.preferredQty) || 1),
        updatedAt: serverTimestamp(),
      };
      if (cleanNotes) {
        payload.notes = cleanNotes;
      }
      await updateDoc(ref, payload);
    } else {
      const payload: Record<string, unknown> = {
        medicineId: item.medicineId,
        medicineName: sanitizeString(item.medicineName, BLUEPRINT_LIMITS.MEDICINE_NAME_MAX),
        composition: sanitizeString(item.composition, BLUEPRINT_LIMITS.COMPOSITION_MAX),
        targetMaxPtr: Math.max(0, Number(item.targetMaxPtr) || 0),
        preferredQty: Math.max(1, Math.floor(item.preferredQty) || 1),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (cleanNotes) {
        payload.notes = cleanNotes;
      }
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeWatchlistItem(uid: string, medicineId: string): Promise<void> {
  const path = `users/${uid}/watchlist/${medicineId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'watchlist', medicineId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
