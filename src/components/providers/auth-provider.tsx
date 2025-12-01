"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { onIdTokenChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/workos";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const clearAuthCookie = () => {
  document.cookie = "workos_token=; path=/; max-age=0";
};

const setAuthCookie = (token: string) => {
  document.cookie = `workos_token=${token}; path=/; max-age=3600`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const snapshot = await getDoc(doc(db, "users", uid));
    if (snapshot.exists()) {
      setProfile(snapshot.data() as UserProfile);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        clearAuthCookie();
        setFirebaseUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      setAuthCookie(token);
      setFirebaseUser(user);
      await fetchProfile(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      await fetchProfile(firebaseUser.uid);
    }
  }, [fetchProfile, firebaseUser]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    clearAuthCookie();
    setFirebaseUser(null);
    setProfile(null);
  }, []);

  const value: AuthContextValue = {
    firebaseUser,
    profile,
    loading,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
};

