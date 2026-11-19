import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  getOrCreateUserProfile,
  seedCatalogIfAdmin,
  updateUserPharmacyProfile,
} from '../services/firestoreService';
import type { IndianState, UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  profileLoading: boolean;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  savePharmacyProfile: (updates: {
    displayName: string;
    pharmacyName: string;
    drugLicenseNo?: string;
    gstin?: string;
    city: string;
    state: IndianState;
    phone?: string;
  }) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setProfileLoading(false);
        setAuthReady(true);
        return;
      }

      setProfileLoading(true);
      try {
        const userProfile = await getOrCreateUserProfile({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Pharmacy Owner',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL,
        });
        setProfile(userProfile);

        // Seed initial UP/Uttarakhand catalog when admin signs in on an empty DB
        await seedCatalogIfAdmin(firebaseUser.email);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setAuthError(
          err instanceof Error ? err.message : 'Unable to initialize your pharmacy profile.'
        );
      } finally {
        setProfileLoading(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in window was closed before completing authentication.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups and try again.');
      } else {
        setAuthError(
          err instanceof Error ? err.message : 'Google Sign-In failed. Please try again.'
        );
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const savePharmacyProfile = useCallback(
    async (updates: {
      displayName: string;
      pharmacyName: string;
      drugLicenseNo?: string;
      gstin?: string;
      city: string;
      state: IndianState;
      phone?: string;
    }) => {
      if (!user) return;
      await updateUserPharmacyProfile(user.uid, updates);
      const refreshed = await getOrCreateUserProfile({
        uid: user.uid,
        displayName: updates.displayName,
        email: user.email || '',
        photoURL: user.photoURL,
      });
      setProfile(refreshed);
    },
    [user]
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authReady,
        profileLoading,
        signingIn,
        authError,
        signInWithGoogle,
        signOutUser,
        savePharmacyProfile,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
