"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Settings,
  Monitor,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  CreditCard,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserProfile } from "@/types/schema";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Studio", href: "/studio", icon: Sparkles },
  { name: "Monitor", href: "/monitor", icon: Monitor },
  { name: "History", href: "/history", icon: Clock },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get current user from Firebase Auth and listen to profile changes
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setLoading(true);
        
        // Listen to user profile changes in real-time
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Get photoURL from Firestore first, then fallback to Auth
            const photoURL = (data.photoURL && data.photoURL.trim() !== "") 
              ? data.photoURL 
              : (user.photoURL && user.photoURL.trim() !== "") 
                ? user.photoURL 
                : undefined;
            
            const profile: UserProfile = {
              id: userDoc.id,
              uid: user.uid,
              email: data.email || user.email || "",
              displayName: data.displayName || user.displayName || user.email?.split("@")[0] || "User",
              photoURL: photoURL,
              jobTitle: data.jobTitle || undefined,
              role: data.role || "OPERATOR",
              teamIds: data.teamIds || [],
              organizationId: data.organizationId || "",
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            };
            
            console.log("User Profile loaded in sidebar:", { 
              photoURL: profile.photoURL, 
              displayName: profile.displayName,
              hasPhotoURL: !!profile.photoURL 
            });
            
            setUserProfile(profile);
          } else {
            // Fallback to auth user data if profile doesn't exist
            setUserProfile({
              id: user.uid,
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || user.email?.split("@")[0] || "User",
              photoURL: user.photoURL || undefined,
              role: "OPERATOR",
              teamIds: [],
              organizationId: "",
              createdAt: new Date(),
              updatedAt: new Date(),
            } as UserProfile);
          }
          setLoading(false);
        });
      } else {
        setUserId(null);
        setUserProfile(null);
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
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-xl"
          >
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
                <Link href="/" className="flex items-center gap-3 group">
                  <Logo size="small" />
                  <div>
                    <span className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors block">
                      WorkOS
                    </span>
                    <div className="text-[9px] text-slate-500 font-medium tracking-wider uppercase">
                      Atomic Engine
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* User Profile */}
              <div className="border-t border-slate-200 p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 animate-pulse" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                      <div className="h-2.5 w-32 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                ) : userProfile ? (
                  <>
                    <Link href="/profile" className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-1 -m-1 transition-colors">
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        {userProfile.photoURL && userProfile.photoURL.trim() !== "" ? (
                          <img
                            src={userProfile.photoURL}
                            alt={userProfile.displayName}
                            className="h-8 w-8 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                              // Hide image and show fallback
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.avatar-fallback')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'avatar-fallback flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold shadow-sm';
                                fallback.textContent = userProfile.displayName.charAt(0).toUpperCase();
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : null}
                        {(!userProfile.photoURL || userProfile.photoURL.trim() === "") && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold shadow-sm">
                            {userProfile.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Name and Email */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {userProfile.displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {userProfile.email}
                        </p>
                      </div>
                    </Link>
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                      ?
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">Not signed in</p>
                      <p className="text-xs text-slate-500 truncate">Please sign in</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-6">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1" />
          {userId && <NotificationBell userId={userId} />}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

