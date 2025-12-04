/**
 * STRICT MULTI-TENANT SEED SCRIPT
 * Populates Firestore with mock data ensuring CRITICAL data isolation
 * 
 * Rule: Users and Runs belong STRICTLY to their specific Organization
 * 
 * Usage: npx tsx scripts/seed-data.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { faker } from "@faker-js/faker";
import { writeFileSync } from "fs";
import { getAdminDb, getAdminAuth } from "../src/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { Organization, UserProfile, ActiveRun, RunLog, Procedure, AtomicStep, AtomicAction } from "../src/types/schema";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const db = getAdminDb();
const auth = getAdminAuth();

// STRICT Organization Definitions
const ORGANIZATIONS = [
  {
    id: "org_alpha",
    name: "Alpha Tech",
    plan: "PRO" as const,
    subscriptionStatus: "active" as const,
  },
  {
    id: "org_beta",
    name: "Beta Logistics",
    plan: "ENTERPRISE" as const,
    subscriptionStatus: "active" as const,
  },
  {
    id: "org_gamma",
    name: "Gamma Agency",
    plan: "PRO" as const,
    subscriptionStatus: "active" as const,
  },
];

// Plan limits mapping
const PLAN_LIMITS = {
  FREE: { maxUsers: 5, maxActiveRuns: 10, aiGenerations: 50 },
  PRO: { maxUsers: 25, maxActiveRuns: 100, aiGenerations: 500 },
  ENTERPRISE: { maxUsers: 1000, maxActiveRuns: 10000, aiGenerations: 10000 },
};

// Atomic actions
const ATOMIC_ACTIONS: AtomicAction[] = [
  "INPUT",
  "FETCH",
  "TRANSMIT",
  "STORE",
  "TRANSFORM",
  "ORGANISE",
  "CALCULATE",
  "COMPARE",
  "VALIDATE",
  "GATEWAY",
  "GENERATE",
  "NEGOTIATE",
  "AUTHORIZE",
];

// Run statuses
const RUN_STATUSES: ActiveRun["status"][] = [
  "COMPLETED",
  "IN_PROGRESS",
  "FLAGGED",
  "BLOCKED",
  "OPEN_FOR_CLAIM",
];

/**
 * Generate a random date within the last N days
 */
function randomDateInLastDays(days: number): Date {
  const now = new Date();
  const daysAgo = faker.number.int({ min: 0, max: days });
  const hoursAgo = faker.number.int({ min: 0, max: 23 });
  const minutesAgo = faker.number.int({ min: 0, max: 59 });
  
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  
  return date;
}

/**
 * Create or update an organization (STRICT ID)
 */
async function createOrganization(orgData: typeof ORGANIZATIONS[0]): Promise<void> {
  const limits = PLAN_LIMITS[orgData.plan];
  
  const org: Organization = {
    id: orgData.id,
    name: orgData.name,
    plan: orgData.plan,
    subscriptionStatus: orgData.subscriptionStatus,
    limits,
    createdAt: new Date(),
  };

  await db.collection("organizations").doc(orgData.id).set({
    ...org,
    createdAt: Timestamp.fromDate(org.createdAt),
  });

  console.log(`🏢 Created Org: ${orgData.name} (ID: ${orgData.id})`);
}

/**
 * Create procedures for an organization
 */
async function createProcedures(
  orgId: string,
  orgName: string,
  count: number
): Promise<Procedure[]> {
  const procedures: Procedure[] = [];
  const procedureTitles = [
    "Invoice Processing",
    "Employee Onboarding",
    "Order Fulfillment",
    "Contract Review",
    "Quality Inspection",
    "Payment Approval",
    "Document Verification",
    "Data Migration",
    "Report Generation",
    "Client Onboarding",
  ];

  for (let i = 0; i < count; i++) {
    const title = procedureTitles[i % procedureTitles.length];
    const stepCount = faker.number.int({ min: 3, max: 8 });
    const steps: AtomicStep[] = [];

    for (let j = 0; j < stepCount; j++) {
      steps.push({
        id: faker.string.uuid(),
        title: `Step ${j + 1}: ${faker.lorem.words(3)}`,
        action: faker.helpers.arrayElement(ATOMIC_ACTIONS),
        config: {
          fieldLabel: faker.lorem.sentence(),
        },
      });
    }

    const procedureRef = db.collection("procedures").doc();
    const newProcedure: Procedure = {
      id: procedureRef.id,
      organizationId: orgId, // STRICT: Link to current org
      processGroupId: `group-${orgId}`,
      title,
      description: faker.lorem.paragraph(),
      isPublished: true,
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("procedures").doc(procedureRef.id).set({
      ...newProcedure,
      createdAt: Timestamp.fromDate(newProcedure.createdAt),
      updatedAt: Timestamp.fromDate(newProcedure.updatedAt),
    });

    procedures.push(newProcedure);
    console.log(`   📝 Created Procedure: ${title} (${steps.length} steps) -> Linked to ${orgName}`);
  }

  return procedures;
}

/**
 * Create users for an organization (STRICT ORG LINKING)
 */
async function createUsersForOrg(
  orgId: string,
  orgName: string,
  orgIndex: number
): Promise<{ userIds: string[]; emails: string[] }> {
  const userIds: string[] = [];
  const emails: string[] = [];
  
  // Use predictable email format
  const orgPrefix = ["alpha", "beta", "gamma"][orgIndex];

  // 1. Create Admin User
  const adminEmail = `admin@${orgPrefix}.workos.test`;
  const adminName = faker.person.fullName();
  
  try {
    const adminRecord = await auth.createUser({
      email: adminEmail,
      password: "Test123!@#",
      displayName: adminName,
      photoURL: faker.image.avatar(),
    });

    const adminProfile: Omit<UserProfile, "id"> = {
      uid: adminRecord.uid,
      email: adminEmail,
      displayName: adminName,
      photoURL: adminRecord.photoURL || faker.image.avatar(),
      jobTitle: faker.person.jobTitle(),
      role: "ADMIN",
      teamIds: [],
      organizationId: orgId, // STRICT: Link to current org
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").doc(adminRecord.uid).set({
      ...adminProfile,
      createdAt: Timestamp.fromDate(adminProfile.createdAt),
      updatedAt: Timestamp.fromDate(adminProfile.updatedAt),
    });

    userIds.push(adminRecord.uid);
    emails.push(`👑 ADMIN: ${adminEmail} (${adminName})`);
    console.log(`   👤 Added User: ${adminName} (Admin) -> Linked to ${orgName}`);
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      // User exists, get from Firestore
      const existingUser = await db.collection("users")
        .where("email", "==", adminEmail)
        .where("organizationId", "==", orgId)
        .get();
      
      if (!existingUser.empty) {
        const userDoc = existingUser.docs[0];
        userIds.push(userDoc.id);
        emails.push(`👑 ADMIN: ${adminEmail} (existing)`);
        console.log(`   ℹ️  Using existing Admin: ${adminEmail} -> Linked to ${orgName}`);
      }
    } else {
      console.error(`   ✗ Failed to create admin: ${error.message}`);
    }
  }

  // 2. Create 2 Managers
  for (let i = 0; i < 2; i++) {
    const managerEmail = `manager${i + 1}@${orgPrefix}.workos.test`;
    const managerName = faker.person.fullName();
    
    try {
      const managerRecord = await auth.createUser({
        email: managerEmail,
        password: "Test123!@#",
        displayName: managerName,
        photoURL: faker.image.avatar(),
      });

      const managerProfile: Omit<UserProfile, "id"> = {
        uid: managerRecord.uid,
        email: managerEmail,
        displayName: managerName,
        photoURL: managerRecord.photoURL || faker.image.avatar(),
        jobTitle: faker.person.jobTitle(),
        role: "MANAGER",
        teamIds: [],
        organizationId: orgId, // STRICT: Link to current org
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("users").doc(managerRecord.uid).set({
        ...managerProfile,
        createdAt: Timestamp.fromDate(managerProfile.createdAt),
        updatedAt: Timestamp.fromDate(managerProfile.updatedAt),
      });

      userIds.push(managerRecord.uid);
      emails.push(`📋 MANAGER: ${managerEmail} (${managerName})`);
      console.log(`   👤 Added User: ${managerName} (Manager) -> Linked to ${orgName}`);
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        const existingUser = await db.collection("users")
          .where("email", "==", managerEmail)
          .where("organizationId", "==", orgId)
          .get();
        
        if (!existingUser.empty) {
          const userDoc = existingUser.docs[0];
          userIds.push(userDoc.id);
          emails.push(`📋 MANAGER: ${managerEmail} (existing)`);
          console.log(`   ℹ️  Using existing Manager: ${managerEmail} -> Linked to ${orgName}`);
        }
      } else {
        console.error(`   ✗ Failed to create manager ${i + 1}: ${error.message}`);
      }
    }
  }

  // 3. Create 5 Employees
  for (let i = 0; i < 5; i++) {
    const employeeEmail = `employee${i + 1}@${orgPrefix}.workos.test`;
    const employeeName = faker.person.fullName();
    
    try {
      const employeeRecord = await auth.createUser({
        email: employeeEmail,
        password: "Test123!@#",
        displayName: employeeName,
        photoURL: faker.image.avatar(),
      });

      const employeeProfile: Omit<UserProfile, "id"> = {
        uid: employeeRecord.uid,
        email: employeeEmail,
        displayName: employeeName,
        photoURL: employeeRecord.photoURL || faker.image.avatar(),
        jobTitle: faker.person.jobTitle(),
        role: "OPERATOR",
        teamIds: [],
        organizationId: orgId, // STRICT: Link to current org
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("users").doc(employeeRecord.uid).set({
        ...employeeProfile,
        createdAt: Timestamp.fromDate(employeeProfile.createdAt),
        updatedAt: Timestamp.fromDate(employeeProfile.updatedAt),
      });

      userIds.push(employeeRecord.uid);
      emails.push(`👤 EMPLOYEE: ${employeeEmail} (${employeeName})`);
      console.log(`   👤 Added User: ${employeeName} (Employee) -> Linked to ${orgName}`);
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        const existingUser = await db.collection("users")
          .where("email", "==", employeeEmail)
          .where("organizationId", "==", orgId)
          .get();
        
        if (!existingUser.empty) {
          const userDoc = existingUser.docs[0];
          userIds.push(userDoc.id);
          emails.push(`👤 EMPLOYEE: ${employeeEmail} (existing)`);
          console.log(`   ℹ️  Using existing Employee: ${employeeEmail} -> Linked to ${orgName}`);
        }
      } else {
        console.error(`   ✗ Failed to create employee ${i + 1}: ${error.message}`);
      }
    }
  }

  return { userIds, emails };
}

/**
 * Create runs for an organization (STRICT ORG & USER LINKING)
 */
async function createRunsForOrg(
  orgId: string,
  orgName: string,
  userIds: string[],
  procedures: Procedure[],
  runCount: number = 20
): Promise<void> {
  if (userIds.length === 0) {
    console.warn(`   ⚠️  No users found for ${orgName}, skipping runs`);
    return;
  }

  if (procedures.length === 0) {
    console.warn(`   ⚠️  No procedures found for ${orgName}, skipping runs`);
    return;
  }

  // Distribute runs across different statuses
  const statusDistribution = {
    COMPLETED: Math.floor(runCount * 0.4), // 40% completed
    IN_PROGRESS: Math.floor(runCount * 0.3), // 30% in progress
    FLAGGED: Math.floor(runCount * 0.15), // 15% flagged
    BLOCKED: Math.floor(runCount * 0.1), // 10% blocked
    OPEN_FOR_CLAIM: Math.floor(runCount * 0.05), // 5% open for claim
  };

  let runIndex = 0;

  for (const [status, statusCount] of Object.entries(statusDistribution)) {
    for (let i = 0; i < statusCount && runIndex < runCount; i++, runIndex++) {
      // STRICT: Pick a random user from currentOrgUsers ONLY
      const assignedUser = faker.helpers.arrayElement(userIds);
      const startedBy = faker.helpers.arrayElement(userIds);
      const procedure = faker.helpers.arrayElement(procedures);
      
      const startedAt = randomDateInLastDays(30);
      const completedAt = status === "COMPLETED" 
        ? new Date(startedAt.getTime() + faker.number.int({ min: 3600000, max: 86400000 * 7 }))
        : undefined;

      const stepCount = procedure.steps.length;
      const logs: RunLog[] = [];
      
      const completedSteps = status === "COMPLETED" 
        ? stepCount 
        : faker.number.int({ min: 0, max: Math.min(stepCount - 1, Math.floor(stepCount * 0.7)) });
      
      for (let j = 0; j < completedSteps; j++) {
        const step = procedure.steps[j];
        const logTimestamp = new Date(startedAt.getTime() + (j * 3600000));
        
        logs.push({
          stepId: step.id,
          stepTitle: step.title,
          action: step.action,
          output: { message: faker.lorem.sentence() },
          timestamp: logTimestamp,
          outcome: faker.helpers.arrayElement(["SUCCESS", "SUCCESS", "SUCCESS", "FAILURE"] as const),
        });
      }
      
      logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const currentStepIndex = status === "COMPLETED" 
        ? stepCount - 1 
        : faker.number.int({ min: 0, max: Math.min(stepCount - 1, completedSteps) });

      const run: Omit<ActiveRun, "id"> = {
        procedureId: procedure.id, // STRICT: Link to procedure from same org
        procedureTitle: procedure.title,
        organizationId: orgId, // STRICT: Link to current org
        status: status as ActiveRun["status"],
        currentStepIndex,
        startedAt,
        completedAt,
        logs: logs.map(log => ({
          ...log,
          timestamp: log.timestamp,
        })),
        currentAssigneeId: assignedUser, // STRICT: User from currentOrgUsers
        assigneeType: "USER",
        assigneeId: assignedUser, // STRICT: User from currentOrgUsers
        startedBy, // STRICT: User from currentOrgUsers
      };

      await db.collection("active_runs").add({
        ...run,
        startedAt: Timestamp.fromDate(run.startedAt),
        completedAt: run.completedAt ? Timestamp.fromDate(run.completedAt) : null,
        logs: run.logs.map(log => ({
          ...log,
          timestamp: Timestamp.fromDate(log.timestamp),
        })),
      });

      console.log(`   ⚡ Created Run: ${run.procedureTitle} (${status}) -> Assigned to user from ${orgName}`);
    }
  }
}

/**
 * Main seed function with STRICT multi-tenant isolation
 */
async function seedData() {
  console.log("🌱 Starting STRICT MULTI-TENANT Database Seeding...\n");
  console.log("⚠️  WARNING: This script will populate your Firestore database with mock data.");
  console.log("⚠️  This is for DEVELOPMENT ONLY. Do not run in production!\n");
  console.log("🔒 STRICT ISOLATION: Users and Runs belong STRICTLY to their Organization.\n");

  try {
    const allUserEmails: Record<string, string[]> = {};

    // NESTED LOOP: For EACH organization
    for (let orgIndex = 0; orgIndex < ORGANIZATIONS.length; orgIndex++) {
      const orgData = ORGANIZATIONS[orgIndex];
      
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Processing Organization ${orgIndex + 1}/${ORGANIZATIONS.length}: ${orgData.name}`);
      console.log(`${"=".repeat(60)}\n`);

      // 1. Create Organization (STRICT ID)
      await createOrganization(orgData);

      // 2. Create Users for THIS organization (STRICT ORG LINKING)
      console.log(`\n👥 Creating Users for ${orgData.name}...`);
      const { userIds, emails } = await createUsersForOrg(orgData.id, orgData.name, orgIndex);
      allUserEmails[orgData.id] = emails;
      
      console.log(`   ✓ Total Users Created: ${userIds.length}`);

      // 3. Create Procedures for THIS organization
      console.log(`\n📝 Creating Procedures for ${orgData.name}...`);
      const procedures = await createProcedures(orgData.id, orgData.name, 10);
      console.log(`   ✓ Total Procedures Created: ${procedures.length}`);

      // 4. Create Runs for THIS organization (STRICT ORG & USER LINKING)
      console.log(`\n🚀 Creating Runs for ${orgData.name}...`);
      await createRunsForOrg(orgData.id, orgData.name, userIds, procedures, 20);
      console.log(`   ✓ Total Runs Created: 20`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Seeding completed successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log(`   - Organizations: ${ORGANIZATIONS.length}`);
    console.log(`   - Users per Org: 8 (1 Admin + 2 Managers + 5 Employees)`);
    console.log(`   - Total Users: ${ORGANIZATIONS.length * 8}`);
    console.log(`   - Procedures per Org: 10`);
    console.log(`   - Total Procedures: ${ORGANIZATIONS.length * 10}`);
    console.log(`   - Runs per Org: 20`);
    console.log(`   - Total Runs: ${ORGANIZATIONS.length * 20}`);
    console.log("\n💡 All users have password: Test123!@#");
    console.log("💡 Data is distributed over the last 30 days for realistic analytics.");
    console.log("🔒 STRICT ISOLATION: Each organization's data is completely isolated.\n");
    
    // Display user emails for login
    console.log("📧 User Emails Created (for login):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    for (const orgData of ORGANIZATIONS) {
      console.log(`\n🏢 ${orgData.name} (${orgData.id}):`);
      if (allUserEmails[orgData.id] && allUserEmails[orgData.id].length > 0) {
        console.log(`   ${allUserEmails[orgData.id].join("\n   ")}`);
      } else {
        console.log(`   (No users created - may already exist)`);
      }
    }
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 Login Instructions:");
    console.log("   1. Go to: http://localhost:3000/sign-in");
    console.log("   2. Use any email from above");
    console.log("   3. Password: Test123!@#");
    console.log("   4. Check Dashboard, Monitor, History, and Analytics pages");
    console.log("   5. Verify data isolation: Each org only sees its own data!\n");
    
    // Save emails to a JSON file
    const emailsData = {
      password: "Test123!@#",
      organizations: ORGANIZATIONS.map((orgData) => ({
        id: orgData.id,
        name: orgData.name,
        users: allUserEmails[orgData.id]?.map((emailLine) => {
          const match = emailLine.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+)/);
          return match ? match[1] : emailLine;
        }) || [],
      })),
    };
    
    writeFileSync(
      resolve(process.cwd(), "seed-emails.json"),
      JSON.stringify(emailsData, null, 2)
    );
    console.log("💾 Emails saved to: seed-emails.json");
    console.log("   You can check this file for all created email addresses.\n");
  } catch (error: any) {
    console.error("\n❌ Seeding failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seed script
seedData()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
