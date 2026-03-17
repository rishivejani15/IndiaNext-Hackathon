import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext();

function isProfileComplete(profile) {
  if (!profile) return false;

  const accountType = String(profile.accountType || '').toLowerCase();
  if (accountType === 'individual') {
    return Boolean(String(profile.profession || '').trim());
  }

  if (accountType === 'organization') {
    const hasOrgName = Boolean(String(profile.organizationName || '').trim());
    const hasOrgCode = Boolean(String(profile.organizationCode || '').trim());
    const hasOrgMode = profile.organizationMode === 'create' || profile.organizationMode === 'join';
    return hasOrgName && hasOrgCode && hasOrgMode;
  }

  return false;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubRef = useRef(null);

  // Holds extraData (name, role, accountType) during signup so
  // onAuthStateChanged picks up the correct role — prevents race condition.
  const pendingProfile = useRef(null);

  async function syncUserProfile(user, extraData = {}) {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Brand-new user — write the full profile with correct role/accountType
      const newData = {
        uid: user.uid,
        name: user.displayName || extraData.name || 'Operative',
        email: user.email,
        role: extraData.role || 'member',
        accountType: extraData.accountType || 'individual',
        profession: extraData.profession || '',
        organizationMode: extraData.organizationMode || null,
        organizationName: extraData.organizationName || '',
        organizationCode: extraData.organizationCode || '',
        onboardingCompleted: false,
        provider: user.providerData?.[0]?.providerId ?? 'email',
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newData);
      setUserProfile(newData);
    } else {
      // Returning user — only update timestamps & email, preserve role/accountType
      const existingData = userDoc.data();
      const updatedData = {
        ...existingData,
        email: user.email,
        emailVerified: user.emailVerified,
        onboardingCompleted: isProfileComplete(existingData),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, updatedData, { merge: true });
      setUserProfile(updatedData);
    }
  }

  async function signup(email, password, name, role = 'member', accountType = 'individual') {
    // Store pending profile data BEFORE creating user so onAuthStateChanged
    // picks it up immediately on the first fire — no race condition.
    pendingProfile.current = { name, role, accountType };
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });
    // onAuthStateChanged will have already called syncUserProfile by now,
    // but if not, force it here as a safety net.
    if (pendingProfile.current !== null) {
      const pd = pendingProfile.current;
      pendingProfile.current = null;
      await syncUserProfile(user, pd);
    }
    return user;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserProfile(result.user);
    return result;
  }

  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  async function googleLogin() {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // COOP (Cross-Origin-Opener-Policy) errors: the popup closes and
      // Firebase throws, but the user IS authenticated if Google auth completed.
      // auth.currentUser will be set in that case — let onAuthStateChanged route them.
      if (auth.currentUser) return;
      throw err;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      if (user) {
        // Grab pending signup extraData if available (prevents race condition)
        const extraData = pendingProfile.current ?? {};
        pendingProfile.current = null;
        await syncUserProfile(user, extraData);

        // Keep profile reactive so onboarding completion reflects immediately.
        profileUnsubRef.current = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data());
          }
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    needsOnboarding:
      !loading &&
      currentUser &&
      (
        userProfile?.provider === 'google.com' ||
        currentUser?.providerData?.some((provider) => provider.providerId === 'google.com')
      ) &&
      !isProfileComplete(userProfile),
    loading,
    signup,
    login,
    logout,
    googleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}