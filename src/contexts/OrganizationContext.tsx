"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/schema";

interface OrganizationContextType {
  organizationId: string | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizationId: null,
  userProfile: null,
  loading: true,
  isSuperAdmin: false,
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if user is super admin (from email)
        const isSuper = user.email === "atomicworkos@gmail.com";
        setIsSuperAdmin(isSuper);

        // Listen to user profile changes in real-time
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data();
              const normalizedOrgId = data.orgId || data.organizationId || "";
              const profile: UserProfile = {
                id: userDoc.id,
                uid: user.uid,
                email: data.email || user.email || "",
                displayName: data.displayName || user.displayName || user.email?.split("@")[0] || "User",
                photoURL: data.photoURL || user.photoURL || undefined,
                jobTitle: data.jobTitle || undefined,
                role: data.role || "OPERATOR",
                teamIds: data.teamIds || [],
                organizationId: normalizedOrgId,
                orgId: data.orgId,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              };

              setUserProfile(profile);
              setOrganizationId(normalizedOrgId || null);
              setLoading(false);
            } else {
              // Fallback to auth user data
              setUserProfile({
                id: user.uid,
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || user.email?.split("@")[0] || "User",
                photoURL: user.photoURL || undefined,
                role: "OPERATOR",
                teamIds: [],
                organizationId: "",
                orgId: "",
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              setOrganizationId(null);
              setLoading(false);
            }
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setOrganizationId(null);
        setIsSuperAdmin(false);
        setLoading(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organizationId,
        userProfile,
        loading,
        isSuperAdmin,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}

