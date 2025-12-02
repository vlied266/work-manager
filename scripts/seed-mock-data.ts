/**
 * Seed Mock Data for WorkOS
 * Generates Teams, Users, Procedures, and ProcessGroups for testing
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getFirestore,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  Team,
  UserProfile,
  Procedure,
  ProcessGroup,
  AtomicStep,
  AtomicAction,
} from "../src/types/schema";

// Initialize Firebase
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

const ORGANIZATION_ID = "default-org";

async function seedData() {
  console.log("🌱 Starting to seed mock data...\n");

  try {
    // 1. Create Teams
    console.log("📁 Creating Teams...");
    const teams: Team[] = [
      {
        id: "",
        organizationId: ORGANIZATION_ID,
        name: "Finance",
        description: "Finance and Accounting Team",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "",
        organizationId: ORGANIZATION_ID,
        name: "HR",
        description: "Human Resources Team",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "",
        organizationId: ORGANIZATION_ID,
        name: "Legal",
        description: "Legal and Compliance Team",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "",
        organizationId: ORGANIZATION_ID,
        name: "Operations",
        description: "Operations Team",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const teamIds: string[] = [];
    for (const team of teams) {
      const { id, ...teamData } = team;
      const docRef = await addDoc(collection(db, "teams"), {
        ...teamData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      teamIds.push(docRef.id);
      console.log(`  ✓ Created team: ${team.name} (${docRef.id})`);
    }

    // 2. Create Users
    console.log("\n👥 Creating Users...");
    const users: Omit<UserProfile, "id">[] = [
      {
        email: "admin@workos.com",
        displayName: "Admin User",
        role: "ADMIN",
        teamIds: [],
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "john.finance@workos.com",
        displayName: "John Doe",
        role: "OPERATOR",
        teamIds: [teamIds[0]], // Finance
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "jane.hr@workos.com",
        displayName: "Jane Smith",
        role: "OPERATOR",
        teamIds: [teamIds[1]], // HR
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "mike.legal@workos.com",
        displayName: "Mike Johnson",
        role: "OPERATOR",
        teamIds: [teamIds[2]], // Legal
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "sarah.ops@workos.com",
        displayName: "Sarah Williams",
        role: "OPERATOR",
        teamIds: [teamIds[3]], // Operations
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const userIds: string[] = [];
    for (const user of users) {
      const docRef = await addDoc(collection(db, "users"), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      userIds.push(docRef.id);
      console.log(`  ✓ Created user: ${user.displayName} (${docRef.id})`);
    }

    // 3. Create Procedures
    console.log("\n📋 Creating Procedures...");

    // Procedure 1: Invoice Processing
    const invoiceSteps: AtomicStep[] = [
      {
        id: "step-1",
        title: "Import Invoice",
        action: "FETCH" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[0], // Finance
        config: {
          outputVariableName: "invoice_data",
          fieldLabel: "Upload Invoice File",
        },
      },
      {
        id: "step-2",
        title: "Extract Invoice Amount",
        action: "INPUT" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[0], // Finance
        config: {
          outputVariableName: "invoice_amount",
          fieldLabel: "Invoice Amount",
          inputType: "number",
          required: true,
        },
      },
      {
        id: "step-3",
        title: "Compare with Purchase Order",
        action: "COMPARE" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[0], // Finance
        config: {
          targetA: "invoice_amount",
          targetB: "po_amount",
          comparisonType: "numeric",
        },
      },
      {
        id: "step-4",
        title: "Approve Payment",
        action: "AUTHORIZE" as AtomicAction,
        assigneeType: "SPECIFIC_USER",
        assigneeId: userIds[0], // Admin
        config: {
          instructions: "Review and approve invoice payment",
          requireSignature: true,
        },
      },
    ];

    // Create Process Group first for Invoice
    const financeProcessRef = await addDoc(collection(db, "process_groups"), {
      title: "Finance Operations",
      description: "End-to-end finance and accounting processes",
      organizationId: ORGANIZATION_ID,
      procedureSequence: [],
      icon: "DollarSign",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    const invoiceProcedureRef = await addDoc(collection(db, "procedures"), {
      title: "Invoice Processing",
      description: "Process and approve vendor invoices",
      organizationId: ORGANIZATION_ID,
      processGroupId: financeProcessRef.id,
      steps: invoiceSteps,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
    
    // Update process group with procedure ID
    await updateDoc(doc(db, "process_groups", financeProcessRef.id), {
      procedureSequence: [invoiceProcedureRef.id],
    });
    
    console.log(`  ✓ Created procedure: Invoice Processing (${invoiceProcedureRef.id})`);

    // Procedure 2: New Employee Onboarding (HR Template)
    const onboardingSteps: AtomicStep[] = [
      {
        id: "step-1",
        title: "Candidate Details",
        action: "INPUT" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[1], // HR
        config: {
          outputVariableName: "candidate_details",
          fieldLabel: "Full Name, Email, Phone",
          inputType: "text",
          placeholder: "Enter candidate full name, email, and phone number",
          required: true,
        },
      },
      {
        id: "step-2",
        title: "Attach CV",
        action: "FETCH" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[1], // HR
        config: {
          outputVariableName: "resume_file",
          fieldLabel: "Upload Resume (PDF, max 5MB)",
        },
      },
      {
        id: "step-3",
        title: "Technical Assessment Score",
        action: "INPUT" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[1], // HR
        config: {
          outputVariableName: "interview_score",
          fieldLabel: "Score (0-100)",
          inputType: "number",
          placeholder: "Enter score between 0 and 100",
          required: true,
        },
      },
      {
        id: "step-4",
        title: "Qualify Candidate",
        action: "VALIDATE" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[1], // HR
        config: {
          outputVariableName: "qualification_result",
          rule: "GREATER_THAN",
          target: "interview_score",
          value: 70,
          errorMessage: "Candidate score is too low. Minimum required: 70",
        },
      },
      {
        id: "step-5",
        title: "Manager Sign-off",
        action: "AUTHORIZE" as AtomicAction,
        assigneeType: "SPECIFIC_USER",
        assigneeId: userIds[0], // Admin (Manager)
        config: {
          outputVariableName: "manager_approval",
          requireSignature: true,
          instruction: "Confirm hiring based on attached CV and Score.",
        },
      },
    ];

    // Create Process Group for HR
    const hrProcessRef = await addDoc(collection(db, "process_groups"), {
      title: "HR Workflow",
      description: "Human resources management processes",
      organizationId: ORGANIZATION_ID,
      procedureSequence: [],
      icon: "Users",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    const onboardingProcedureRef = await addDoc(collection(db, "procedures"), {
      title: "New Employee Onboarding",
      description: "Complete hiring workflow: collect candidate details, review CV, assess score, validate qualification, and get manager approval",
      organizationId: ORGANIZATION_ID,
      processGroupId: hrProcessRef.id,
      steps: onboardingSteps,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
    
    // Update process group with procedure ID
    await updateDoc(doc(db, "process_groups", hrProcessRef.id), {
      procedureSequence: [onboardingProcedureRef.id],
    });
    
    console.log(`  ✓ Created procedure: Employee Onboarding (${onboardingProcedureRef.id})`);

    // Procedure 3: Contract Review
    const contractSteps: AtomicStep[] = [
      {
        id: "step-1",
        title: "Upload Contract",
        action: "FETCH" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[2], // Legal
        config: {
          outputVariableName: "contract_file",
          fieldLabel: "Upload Contract Document",
        },
      },
      {
        id: "step-2",
        title: "Review Terms",
        action: "INPUT" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[2], // Legal
        config: {
          outputVariableName: "contract_terms",
          fieldLabel: "Key Terms Summary",
          inputType: "text",
        },
      },
      {
        id: "step-3",
        title: "Legal Approval",
        action: "AUTHORIZE" as AtomicAction,
        assigneeType: "SPECIFIC_USER",
        assigneeId: userIds[3], // Mike Legal
        config: {
          instructions: "Review contract and provide legal approval",
          requireSignature: true,
        },
      },
    ];

    // Create Process Group for Legal
    const legalProcessRef = await addDoc(collection(db, "process_groups"), {
      title: "Legal & Compliance",
      description: "Legal review and compliance processes",
      organizationId: ORGANIZATION_ID,
      procedureSequence: [],
      icon: "Scale",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    const contractProcedureRef = await addDoc(collection(db, "procedures"), {
      title: "Contract Review",
      description: "Review and approve legal contracts",
      organizationId: ORGANIZATION_ID,
      processGroupId: legalProcessRef.id,
      steps: contractSteps,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
    
    // Update process group with procedure ID
    await updateDoc(doc(db, "process_groups", legalProcessRef.id), {
      procedureSequence: [contractProcedureRef.id],
    });
    
    console.log(`  ✓ Created procedure: Contract Review (${contractProcedureRef.id})`);

    // Procedure 4: Quality Inspection
    const inspectionSteps: AtomicStep[] = [
      {
        id: "step-1",
        title: "Inspect Product",
        action: "INSPECT" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[3], // Operations
        config: {
          outputVariableName: "inspection_result",
          instructions: "Inspect the product for quality and defects",
          proofType: "photo",
        },
      },
      {
        id: "step-2",
        title: "Record Findings",
        action: "INPUT" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[3], // Operations
        config: {
          outputVariableName: "inspection_notes",
          fieldLabel: "Inspection Notes",
          inputType: "text",
        },
      },
      {
        id: "step-3",
        title: "Approve or Reject",
        action: "VALIDATE" as AtomicAction,
        assigneeType: "TEAM",
        assigneeId: teamIds[3], // Operations
        config: {
          validationRule: "Product meets quality standards",
        },
      },
    ];

    // Create Process Group for Operations
    const opsProcessRef = await addDoc(collection(db, "process_groups"), {
      title: "Operations Management",
      description: "Operations and quality control processes",
      organizationId: ORGANIZATION_ID,
      procedureSequence: [],
      icon: "Settings",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    const inspectionProcedureRef = await addDoc(collection(db, "procedures"), {
      title: "Quality Inspection",
      description: "Inspect products for quality assurance",
      organizationId: ORGANIZATION_ID,
      processGroupId: opsProcessRef.id,
      steps: inspectionSteps,
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
    
    // Update process group with procedure ID
    await updateDoc(doc(db, "process_groups", opsProcessRef.id), {
      procedureSequence: [inspectionProcedureRef.id],
    });
    
    console.log(`  ✓ Created procedure: Quality Inspection (${inspectionProcedureRef.id})`);

    const procedureIds = [
      invoiceProcedureRef.id,
      onboardingProcedureRef.id,
      contractProcedureRef.id,
      inspectionProcedureRef.id,
    ];

    // 4. Create Additional Process Groups
    console.log("\n🔄 Creating Additional Process Groups...");

    console.log(`  ✓ Process: Finance Operations (${financeProcessRef.id})`);
    console.log(`  ✓ Process: HR Workflow (${hrProcessRef.id})`);
    console.log(`  ✓ Process: Legal & Compliance (${legalProcessRef.id})`);
    console.log(`  ✓ Process: Operations Management (${opsProcessRef.id})`);

    // Process Group 5: Complete Onboarding Process (Multiple Procedures)
    const completeOnboardingRef = await addDoc(collection(db, "process_groups"), {
      title: "Complete Employee Onboarding",
      description: "Full employee onboarding workflow including HR and Finance setup",
      organizationId: ORGANIZATION_ID,
      procedureSequence: [onboardingProcedureRef.id, invoiceProcedureRef.id],
      icon: "UserPlus",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
    console.log(`  ✓ Created process: Complete Employee Onboarding (${completeOnboardingRef.id})`);

    console.log("\n✅ Mock data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - Teams: ${teams.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Procedures: ${procedureIds.length}`);
    console.log(`  - Process Groups: 5`);
    console.log("\n🎉 You can now view the processes in the dashboard!");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

// Run the seed function
seedData()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

