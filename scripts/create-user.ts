/**
 * Script to create a new user with email and password
 * Usage: npx tsx scripts/create-user.ts <adminEmail> <newUserEmail> <password> <role>
 * Example: npx tsx scripts/create-user.ts vlied266@gmail.com edvli@yahoo.com 123456 OPERATOR
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    // Try to use service account key from environment variable
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log("✅ Using Firebase Admin with service account key");
    } else {
      // Try to use default credentials (if running on Firebase or with gcloud auth)
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "work-flow-manager-b0e0e",
      });
      console.log("✅ Using default Firebase Admin credentials");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
    console.log("\n💡 Make sure you have:");
    console.log("   1. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local");
    console.log("   2. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local (JSON string)");
    console.log("   OR");
    console.log("   3. Authenticated with Firebase (gcloud auth application-default login)");
    process.exit(1);
  }
}

const auth = getAuth();
const db = getFirestore();

async function createUser(
  adminEmail: string,
  newUserEmail: string,
  password: string,
  role: "ADMIN" | "LEAD" | "OPERATOR" | "MANAGER"
) {
  try {
    console.log(`\n🔍 Searching for admin user: ${adminEmail}...`);
    
    // Find admin user in Firestore
    const usersRef = db.collection("users");
    const adminSnapshot = await usersRef.where("email", "==", adminEmail.toLowerCase()).get();
    
    if (adminSnapshot.empty) {
      console.error(`❌ No admin user found with email: ${adminEmail}`);
      console.log("💡 Please make sure the admin user exists in Firestore.");
      process.exit(1);
    }
    
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    const organizationId = adminData.organizationId;
    
    if (!organizationId) {
      console.error(`❌ Admin user ${adminEmail} does not have an organizationId`);
      process.exit(1);
    }
    
    console.log(`✅ Found admin user: ${adminData.displayName || adminEmail}`);
    console.log(`   Organization ID: ${organizationId}`);
    console.log(`   Admin UID: ${adminDoc.id}`);
    
    // Check if user already exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(newUserEmail.toLowerCase());
      console.log(`\n⚠️  User already exists in Firebase Auth (UID: ${userRecord.uid})`);
      console.log("   Updating password and user profile...");
      
      // Update password
      await auth.updateUser(userRecord.uid, {
        password: password,
      });
      console.log("   ✅ Password updated");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // Create new user in Firebase Auth
        console.log(`\n👤 Creating new user in Firebase Auth: ${newUserEmail}...`);
        userRecord = await auth.createUser({
          email: newUserEmail.toLowerCase(),
          password: password,
          emailVerified: false,
        });
        console.log(`   ✅ Created user in Firebase Auth (UID: ${userRecord.uid})`);
      } else {
        throw error;
      }
    }
    
    // Check if user document exists in Firestore
    const userSnapshot = await usersRef.where("email", "==", newUserEmail.toLowerCase()).get();
    
    if (!userSnapshot.empty) {
      // Update existing user document
      const existingUserDoc = userSnapshot.docs[0];
      console.log(`\n📝 Updating existing user document in Firestore...`);
      await existingUserDoc.ref.set({
        email: newUserEmail.toLowerCase(),
        displayName: existingUserDoc.data().displayName || newUserEmail.split("@")[0],
        role: role,
        organizationId: organizationId,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      console.log(`   ✅ Updated user document (Doc ID: ${existingUserDoc.id})`);
    } else {
      // Create new user document in Firestore
      console.log(`\n📝 Creating user document in Firestore...`);
      const userDocRef = usersRef.doc(userRecord.uid);
      await userDocRef.set({
        uid: userRecord.uid,
        email: newUserEmail.toLowerCase(),
        displayName: newUserEmail.split("@")[0],
        role: role,
        teamIds: [],
        organizationId: organizationId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`   ✅ Created user document (Doc ID: ${userRecord.uid})`);
    }
    
    console.log(`\n✅ Successfully created/updated user:`);
    console.log(`   Email: ${newUserEmail}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`   Organization: ${organizationId}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`\n🎉 User is ready to sign in!`);
    
  } catch (error: any) {
    console.error("\n❌ Error creating user:", error);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.message) {
      console.error(`   Error Message: ${error.message}`);
    }
    process.exit(1);
  }
}

// Get command line arguments
const adminEmail = process.argv[2];
const newUserEmail = process.argv[3];
const password = process.argv[4];
const role = process.argv[5] as "ADMIN" | "LEAD" | "OPERATOR" | "MANAGER";

if (!adminEmail || !newUserEmail || !password || !role) {
  console.error("Usage: npx tsx scripts/create-user.ts <adminEmail> <newUserEmail> <password> <role>");
  console.error("Example: npx tsx scripts/create-user.ts vlied266@gmail.com edvli@yahoo.com 123456 OPERATOR");
  console.error("Valid roles: ADMIN, LEAD, OPERATOR, MANAGER");
  process.exit(1);
}

if (!["ADMIN", "LEAD", "OPERATOR", "MANAGER"].includes(role)) {
  console.error("❌ Invalid role. Valid roles are: ADMIN, LEAD, OPERATOR, MANAGER");
  process.exit(1);
}

createUser(adminEmail, newUserEmail, password, role)
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

