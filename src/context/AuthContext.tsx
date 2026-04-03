"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/clientApp";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(
    process.env.NODE_ENV === "development"
      ? ({ 
          uid: "test-user", 
          email: "test@example.com", 
          displayName: "Test User", 
          photoURL: "", 
          getIdToken: async () => "mock-token" 
        } as any)
      : null
  );
  const [loading, setLoading] = useState(process.env.NODE_ENV !== "development");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    // Handle redirect result first (for mobile sign-in)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        console.log("Redirect sign-in successful");
        try {
          const userRef = doc(db, "users", result.user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName || "",
              photoURL: result.user.photoURL || "",
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn("Firestore redirect setup:", e);
        }
      }
    }).catch((e) => {
      console.warn("Redirect result error:", e);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || "",
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn("Firestore offline or permission denied:", e);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);;

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Use redirect on mobile (popups are often blocked), popup on desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Google Sign-in failed", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
