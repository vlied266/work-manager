/**
 * Script to update user role in Firestore
 * Usage: npx tsx scripts/update-user-role.ts <email> <role>
 * Example: npx tsx scripts/update-user-role.ts vlied266@gmail.com ADMIN
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

// Firebase config - using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateUserRole(email: string, role: "ADMIN" | "LEAD" | "OPERATOR") {
  try {
    console.log(`Searching for user with email: ${email}...`);
    
    // Query users collection by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }
    
    if (querySnapshot.size > 1) {
      console.warn(`⚠️  Warning: Multiple users found with email: ${email}`);
    }
    
    // Update all matching users (should be only one)
    const updates = querySnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      console.log(`Found user: ${userData.displayName || userData.email} (UID: ${userDoc.id})`);
      console.log(`Current role: ${userData.role || "Not set"}`);
      
      await updateDoc(doc(db, "users", userDoc.id), {
        role: role,
      });
      
      console.log(`✅ Successfully updated role to: ${role}`);
      return userDoc.id;
    });
    
    await Promise.all(updates);
    console.log(`\n✅ All updates completed!`);
    
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const role = process.argv[3] as "ADMIN" | "LEAD" | "OPERATOR";

if (!email || !role) {
  console.error("Usage: npx tsx scripts/update-user-role.ts <email> <role>");
  console.error("Example: npx tsx scripts/update-user-role.ts vlied266@gmail.com ADMIN");
  console.error("Valid roles: ADMIN, LEAD, OPERATOR");
  process.exit(1);
}

if (!["ADMIN", "LEAD", "OPERATOR"].includes(role)) {
  console.error("❌ Invalid role. Valid roles are: ADMIN, LEAD, OPERATOR");
  process.exit(1);
}

updateUserRole(email, role)
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

