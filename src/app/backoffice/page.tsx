"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Organization } from "@/types/schema";
import { 
  Building2, Users, Activity, Shield, 
  Loader2, AlertCircle, ExternalLink, Calendar,
  RefreshCw, Key, CheckCircle2, XCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { impersonateUser, updateOrgStatus, updateOrgPlan } from "@/app/actions/admin";

const OWNER_EMAIL = "atomicworkos@gmail.com";

export default function BackofficePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  // Stats
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  
  // Organizations data
  const [organizations, setOrganizations] = useState<(Organization & { ownerEmail?: string; ownerId?: string })[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  // Security check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setAuthorized(false);
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      // CRITICAL: Only allow owner email
      if (currentUser.email !== OWNER_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch data when authorized
  useEffect(() => {
    if (!authorized) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch organizations
        const orgsQuery = query(
          collection(db, "organizations"),
          orderBy("createdAt", "desc")
        );
        const orgsSnapshot = await getDocs(orgsQuery);
        
        // Fetch owner emails for each organization
        const orgsDataPromises = orgsSnapshot.docs.map(async (doc) => {
          const orgData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Organization & { ownerEmail?: string; ownerId?: string };
          
          // Find owner email from users collection
          try {
            const usersQuery = query(
              collection(db, "users"),
              where("organizationId", "==", doc.id),
              where("role", "in", ["ADMIN", "MANAGER"])
            );
            const usersSnapshot = await getDocs(usersQuery);
            if (!usersSnapshot.empty) {
              const ownerDoc = usersSnapshot.docs[0];
              orgData.ownerEmail = ownerDoc.data().email || "N/A";
              orgData.ownerId = ownerDoc.id;
            } else {
              orgData.ownerEmail = "N/A";
              orgData.ownerId = undefined;
            }
          } catch (error) {
            console.error(`Error fetching owner for org ${doc.id}:`, error);
            orgData.ownerEmail = "N/A";
            orgData.ownerId = undefined;
          }
          
          return orgData;
        });
        
        const orgsData = await Promise.all(orgsDataPromises);
        setOrganizations(orgsData);
        setTotalOrganizations(orgsSnapshot.size);

        // Fetch users count
        const usersSnapshot = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnapshot.size);

        // Fetch runs count
        const runsSnapshot = await getDocs(collection(db, "active_runs"));
        setTotalRuns(runsSnapshot.size);
      } catch (error) {
        console.error("Error fetching backoffice data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [authorized]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-100"></div>
          <p className="text-sm text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message
  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h1>
          <p className="text-slate-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleRefresh = async () => {
    setLoadingData(true);
    try {
      const orgsQuery = query(
        collection(db, "organizations"),
        orderBy("createdAt", "desc")
      );
      const orgsSnapshot = await getDocs(orgsQuery);
      
      const orgsDataPromises = orgsSnapshot.docs.map(async (doc) => {
        const orgData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as Organization & { ownerEmail?: string; ownerId?: string };
        
        try {
          const usersQuery = query(
            collection(db, "users"),
            where("organizationId", "==", doc.id),
            where("role", "in", ["ADMIN", "MANAGER"])
          );
          const usersSnapshot = await getDocs(usersQuery);
          if (!usersSnapshot.empty) {
            const ownerDoc = usersSnapshot.docs[0];
            orgData.ownerEmail = ownerDoc.data().email || "N/A";
            orgData.ownerId = ownerDoc.id;
          } else {
            orgData.ownerEmail = "N/A";
            orgData.ownerId = undefined;
          }
        } catch (error) {
          console.error(`Error fetching owner for org ${doc.id}:`, error);
          orgData.ownerEmail = "N/A";
          orgData.ownerId = undefined;
        }
        
        return orgData;
      });
      
      const orgsData = await Promise.all(orgsDataPromises);
      setOrganizations(orgsData);
      setTotalOrganizations(orgsSnapshot.size);

      const usersSnapshot = await getDocs(collection(db, "users"));
      setTotalUsers(usersSnapshot.size);

      const runsSnapshot = await getDocs(collection(db, "active_runs"));
      setTotalRuns(runsSnapshot.size);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusToggle = async (orgId: string, currentStatus: string) => {
    setUpdating({ ...updating, [`status-${orgId}`]: true });
    try {
      const newStatus = currentStatus === "active" ? "canceled" : "active";
      const result = await updateOrgStatus(orgId, newStatus as "active" | "canceled" | "past_due");
      
      if (result.success) {
        setOrganizations(orgs => 
          orgs.map(org => 
            org.id === orgId 
              ? { ...org, subscriptionStatus: newStatus }
              : org
          )
        );
      } else {
        alert(`Failed to update status: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating({ ...updating, [`status-${orgId}`]: false });
    }
  };

  const handlePlanChange = async (orgId: string, newPlan: "FREE" | "PRO" | "ENTERPRISE") => {
    setUpdating({ ...updating, [`plan-${orgId}`]: true });
    try {
      const result = await updateOrgPlan(orgId, newPlan);
      
      if (result.success) {
        setOrganizations(orgs => 
          orgs.map(org => 
            org.id === orgId 
              ? { ...org, plan: newPlan }
              : org
          )
        );
        alert(`Plan updated to ${newPlan} successfully!`);
      } else {
        alert(`Failed to update plan: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update plan. Please try again.");
    } finally {
      setUpdating({ ...updating, [`plan-${orgId}`]: false });
    }
  };

  const handleImpersonate = async (org: Organization & { ownerEmail?: string; ownerId?: string }) => {
    if (!org.ownerId) {
      alert("Owner ID not found. Cannot impersonate.");
      return;
    }

    try {
      setUpdating({ ...updating, [`impersonate-${org.id}`]: true });
      
      const result = await impersonateUser(org.ownerId);
      
      if (result.success && result.token) {
        // Sign in with custom token
        const userCredential = await signInWithCustomToken(auth, result.token);
        const user = userCredential.user;
        
        // Set auth cookie
        const idToken = await user.getIdToken();
        document.cookie = `workos_token=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        
        // Store impersonation flag
        sessionStorage.setItem("isImpersonating", "true");
        sessionStorage.setItem("impersonatedOrgId", org.id);
        sessionStorage.setItem("impersonatedOrgName", org.name);
        
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        const errorMsg = result.error || "Unknown error";
        if (errorMsg.includes("FIREBASE_SERVICE_ACCOUNT_KEY")) {
          alert(
            "❌ Firebase Admin SDK Configuration Error\n\n" +
            "Please follow these steps:\n\n" +
            "1. Go to Firebase Console\n" +
            "2. Navigate to Project Settings > Service Accounts\n" +
            "3. Click Generate New Private Key\n" +
            "4. Add the key to .env.local:\n" +
            "   FIREBASE_SERVICE_ACCOUNT_KEY='{...}'\n\n" +
            "5. Restart the server\n\n" +
            "For more details, see: FIREBASE_ADMIN_SETUP.md"
          );
        } else {
          alert(`Failed to impersonate: ${errorMsg}`);
        }
        setUpdating({ ...updating, [`impersonate-${org.id}`]: false });
      }
    } catch (error: any) {
      console.error("Error impersonating:", error);
      const errorMsg = error.message || "Unknown error";
      if (errorMsg.includes("FIREBASE_SERVICE_ACCOUNT_KEY") || errorMsg.includes("credentials")) {
        alert(
          "❌ Firebase Admin SDK Configuration Error\n\n" +
          "Please follow these steps:\n\n" +
          "1. Go to Firebase Console\n" +
          "2. Navigate to Project Settings > Service Accounts\n" +
          "3. Click Generate New Private Key\n" +
          "4. Add the key to .env.local:\n" +
          "   FIREBASE_SERVICE_ACCOUNT_KEY='{...}'\n\n" +
          "5. Restart the server\n\n" +
          "For more details, see: FIREBASE_ADMIN_SETUP.md"
        );
      } else {
        alert(`Failed to impersonate: ${errorMsg}`);
      }
      setUpdating({ ...updating, [`impersonate-${org.id}`]: false });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-[1600px] px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                  Atomic Work Command Center
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Super Admin Dashboard - System Overview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/backoffice/broadcast"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Broadcast
              </Link>
              <Link
                href="/backoffice/prompts"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                AI Prompts
              </Link>
              <button
                onClick={handleRefresh}
                disabled={loadingData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Organizations</p>
                {loadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                ) : (
                  <p className="text-3xl font-bold text-white">{totalOrganizations}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Users</p>
                {loadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                ) : (
                  <p className="text-3xl font-bold text-white">{totalUsers}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Active Runs</p>
                {loadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                ) : (
                  <p className="text-3xl font-bold text-white">{totalRuns}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Organizations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">All Organizations</h2>
            <p className="text-slate-400 text-sm mt-1">
              Complete list of registered tenants
            </p>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No organizations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Organization Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Owner Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {organizations.map((org, index) => (
                    <motion.tr
                      key={org.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {org.name}
                            </p>
                            <p className="text-xs text-slate-400">{org.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          {formatDate(org.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-300">{org.ownerEmail || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={org.plan}
                          onChange={(e) => handlePlanChange(org.id, e.target.value as "FREE" | "PRO" | "ENTERPRISE")}
                          disabled={updating[`plan-${org.id}`]}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="FREE">FREE</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusToggle(org.id, org.subscriptionStatus)}
                          disabled={updating[`status-${org.id}`]}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                            org.subscriptionStatus === "active"
                              ? "bg-green-500"
                              : "bg-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              org.subscriptionStatus === "active" ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="ml-3 text-xs text-slate-400">
                          {org.subscriptionStatus === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleImpersonate(org)}
                          disabled={!org.ownerId || updating[`impersonate-${org.id}`]}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating[`impersonate-${org.id}`] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4" />
                              Login As
                            </>
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

