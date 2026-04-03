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

async function ensureUserInFirestore(firebaseUser: User) {
  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        createdAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn("Firestore user setup:", e);
  }
}

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

    let mounted = true;

    const initAuth = async () => {
      // Step 1: Process any pending redirect result FIRST
      // This ensures the auth state is fully resolved before we check it
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect sign-in successful for:", result.user.email);
          await ensureUserInFirestore(result.user);
        }
      } catch (e) {
        console.warn("Redirect result error:", e);
      }

      // Step 2: NOW subscribe to auth state changes
      // At this point, redirect auth is fully resolved
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!mounted) return;
        if (currentUser) {
          await ensureUserInFirestore(currentUser);
        }
        setUser(currentUser);
        setLoading(false);
      });

      return unsubscribe;
    };

    let cleanup: (() => void) | undefined;
    initAuth().then((unsub) => { cleanup = unsub; });

    // Safety: don't show spinner forever if something goes wrong
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      cleanup?.();
      clearTimeout(safetyTimer);
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Try popup first (works on most browsers)
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // If popup blocked or closed, fall back to redirect
      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
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
