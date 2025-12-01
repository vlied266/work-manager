/**
 * Mock reminder generator. In a real deployment, run this script via cron or Cloud Functions
 * to scan for overdue steps and insert notifications.
 *
 * Usage (local dev):
 * 1. Ensure FIREBASE_CONFIG env vars are set.
 * 2. Run with: ts-node scripts/mockReminder.ts
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const run = async () => {
  initializeApp({
    credential: applicationDefault(),
  });

  const db = getFirestore();
  const snapshot = await db.collection("active_runs").limit(1).get();
  if (snapshot.empty) {
    console.log("No runs available to mock reminders.");
    return;
  }

  const runDoc = snapshot.docs[0];
  const runData = runDoc.data();
  const skeleton = {
    userId: runData.startedBy || "mock-user",
    title: "Daily reminder",
    body: `Review run ${runDoc.id} for pending tasks.`,
    createdAt: Timestamp.now(),
    read: false,
    actionLink: `/run/${runDoc.id}`,
  };

  await db.collection("notifications").add(skeleton);
  console.log("Mock notification created.");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

