'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password) => {
    // Firebase Auth me user create karo
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = cred.user;

    // Firestore me users collection me document banao
    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      email: newUser.email,
      provider: newUser.providerId || 'password',
      createdAt: serverTimestamp(),
    });

    return cred;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setUser(null);
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const gUser = cred.user;

    // Agar pehli baar login kar raha hai to Firestore me user store karo / update karo
    await setDoc(
      doc(db, 'users', gUser.uid),
      {
        uid: gUser.uid,
        email: gUser.email,
        displayName: gUser.displayName || null,
        photoURL: gUser.photoURL || null,
        provider: 'google',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return cred;
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = (displayName, photoURL) => {
    return updateProfile(auth.currentUser, { displayName, photoURL });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      loginWithGoogle,
      resetPassword,
      updateUserProfile
    }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};


