import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "work-flow-manager-b0e0e",
      });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

const auth = getAuth();
const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminEmail, newUserEmail, password, role } = body;

    if (!adminEmail || !newUserEmail || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find admin user in Firestore
    const usersRef = db.collection("users");
    const adminSnapshot = await usersRef.where("email", "==", adminEmail.toLowerCase()).get();

    if (adminSnapshot.empty) {
      return NextResponse.json(
        { error: `No admin user found with email: ${adminEmail}` },
        { status: 404 }
      );
    }

    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    const organizationId = adminData.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: `Admin user ${adminEmail} does not have an organizationId` },
        { status: 400 }
      );
    }

    // Check if user already exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(newUserEmail.toLowerCase());
      // Update password
      await auth.updateUser(userRecord.uid, {
        password: password,
      });
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // Create new user in Firebase Auth
        userRecord = await auth.createUser({
          email: newUserEmail.toLowerCase(),
          password: password,
          emailVerified: false,
        });
      } else {
        throw error;
      }
    }

    // Check if user document exists in Firestore
    const userSnapshot = await usersRef.where("email", "==", newUserEmail.toLowerCase()).get();

    if (!userSnapshot.empty) {
      // Update existing user document
      const existingUserDoc = userSnapshot.docs[0];
      await existingUserDoc.ref.set({
        email: newUserEmail.toLowerCase(),
        displayName: existingUserDoc.data().displayName || newUserEmail.split("@")[0],
        role: role,
        organizationId: organizationId,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } else {
      // Create new user document in Firestore
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
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId: userRecord.uid,
      email: newUserEmail,
      role: role,
      organizationId: organizationId,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

