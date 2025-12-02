"use client";

import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { UserProfile } from "@/types/schema";
import { Camera, Save, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "OPERATOR">("OPERATOR");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const profile: UserProfile = {
            id: userDoc.id,
            uid: currentUser.uid,
            email: data.email || currentUser.email || "",
            displayName: data.displayName || currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            photoURL: data.photoURL || currentUser.photoURL || undefined,
            jobTitle: data.jobTitle || "",
            role: data.role || "OPERATOR",
            teamIds: data.teamIds || [],
            organizationId: data.organizationId || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
          
          setUserProfile(profile);
          setDisplayName(profile.displayName);
          setJobTitle(profile.jobTitle || "");
          setEmail(profile.email);
          setRole(profile.role);
          setPhotoURL(profile.photoURL || null);
        } else {
          // Fallback to auth user data
          setDisplayName(currentUser.displayName || currentUser.email?.split("@")[0] || "User");
          setEmail(currentUser.email || "");
          setPhotoURL(currentUser.photoURL || null);
        }
        
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update local state
      setPhotoURL(downloadURL);

      // Update Firebase Auth profile
      await updateProfile(user, {
        photoURL: downloadURL,
      });

      // Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
      });

      // Update local profile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          photoURL: downloadURL,
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim(),
      });

      // Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      const updateData: any = {
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        updatedAt: serverTimestamp(),
      };

      // Only update photoURL if it was changed
      if (photoURL) {
        updateData.photoURL = photoURL;
      }

      await updateDoc(userDocRef, updateData);

      // Update local profile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          displayName: displayName.trim(),
          jobTitle: jobTitle.trim() || undefined,
          photoURL: photoURL || undefined,
        });
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Avatar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile Picture</h2>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {uploadingAvatar ? (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-100">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white text-4xl font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all hover:bg-slate-800 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="h-5 w-5" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              
              <p className="text-xs text-slate-500 text-center">
                Click the camera icon to change your photo
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Account Information</h2>

            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Accountant"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Email cannot be changed
                </p>
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={role}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 cursor-not-allowed"
                  />
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    role === "ADMIN" 
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : role === "MANAGER"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {role}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Role is managed by administrators
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  disabled={saving || !displayName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

