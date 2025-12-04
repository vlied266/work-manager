"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ImpersonationContextType {
  impersonatedOrgId: string | null;
  setImpersonatedOrgId: (orgId: string | null) => void;
  clearImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedOrgId, setImpersonatedOrgIdState] = useState<string | null>(null);

  useEffect(() => {
    // Check for impersonation cookie on mount
    const cookies = document.cookie.split(";");
    const impersonateCookie = cookies.find((c) => c.trim().startsWith("impersonate_org="));
    if (impersonateCookie) {
      const orgId = impersonateCookie.split("=")[1];
      setImpersonatedOrgIdState(orgId);
    }
  }, []);

  const setImpersonatedOrgId = (orgId: string | null) => {
    setImpersonatedOrgIdState(orgId);
    if (orgId) {
      document.cookie = `impersonate_org=${orgId}; path=/; max-age=${60 * 60}; SameSite=Lax`;
    } else {
      document.cookie = "impersonate_org=; path=/; max-age=0; SameSite=Lax";
    }
  };

  const clearImpersonation = async () => {
    try {
      await fetch("/api/admin/impersonate", {
        method: "DELETE",
      });
      setImpersonatedOrgIdState(null);
      document.cookie = "impersonate_org=; path=/; max-age=0; SameSite=Lax";
      window.location.href = "/backoffice";
    } catch (error) {
      console.error("Error clearing impersonation:", error);
    }
  };

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedOrgId,
        setImpersonatedOrgId,
        clearImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}

