import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, updatedData, { merge: true });
      setUserProfile(updatedData);
    }
  }

  async function signup(email, password, name, role, accountType) {
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
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Grab pending signup extraData if available (prevents race condition)
        const extraData = pendingProfile.current ?? {};
        pendingProfile.current = null;
        await syncUserProfile(user, extraData);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
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