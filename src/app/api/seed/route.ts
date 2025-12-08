import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { AtomicStep, AtomicAction } from "@/types/schema";

/**
 * Seed Demo Data API
 * 
 * Generates comprehensive demo data:
 * - 5 Users
 * - 2 Teams
 * - 5 Procedures (with steps)
 * - 30 Runs (with proper assignments)
 * - Notifications for inbox
 * 
 * Security: Requires ?secret=atomic_demo query parameter
 * 
 * Usage: GET /api/seed?secret=atomic_demo&orgId=YOUR_ORG_ID
 */
export async function GET(req: NextRequest) {
  try {
    // Security check
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const orgId = searchParams.get("orgId");

    if (secret !== "atomic_demo") {
      return NextResponse.json(
        { error: "Forbidden: Invalid secret" },
        { status: 403 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing required parameter: orgId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Verify organization exists and ensure it has a plan
    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Ensure organization has a plan (default to ENTERPRISE for demo)
    const orgData = orgDoc.data();
    if (!orgData?.plan) {
      await db.collection("organizations").doc(orgId).update({
        plan: "ENTERPRISE",
        updatedAt: Timestamp.now(),
      });
      console.log("✅ Set organization plan to ENTERPRISE");
    }

    const batch = db.batch();
    const now = new Date();

    // ============================================
    // 1. CREATE USERS (with avatars)
    // ============================================
    const usersData = [
      {
        email: "jack@company.com",
        displayName: "Jack Smith",
        role: "ADMIN",
        jobTitle: "Operations Manager",
        photoURL: "/avatar/men/uifaces-human-avatar (10).jpg", // Real person photo
      },
      {
        email: "sara@company.com",
        displayName: "Sara Johnson",
        role: "LEAD",
        jobTitle: "Team Lead",
        photoURL: "/avatar/women/uifaces-human-avatar (1).jpg", // Real person photo
      },
      {
        email: "mike@company.com",
        displayName: "Mike Davis",
        role: "OPERATOR",
        jobTitle: "Operations Specialist",
        photoURL: "/avatar/men/uifaces-human-avatar (11).jpg", // Real person photo
      },
      {
        email: "emily@company.com",
        displayName: "Emily Wilson",
        role: "OPERATOR",
        jobTitle: "Support Agent",
        photoURL: "/avatar/women/uifaces-human-avatar (3).jpg", // Real person photo
      },
      {
        email: "david@company.com",
        displayName: "David Brown",
        role: "OPERATOR",
        jobTitle: "Analyst",
        photoURL: "/avatar/men/uifaces-human-avatar (12).jpg", // Real person photo
      },
    ];

    const userIds: string[] = [];
    for (const userData of usersData) {
      const userRef = db.collection("users").doc();
      userIds.push(userRef.id);
      batch.set(userRef, {
        ...userData,
        uid: userRef.id,
        organizationId: orgId,
        orgId: orgId, // Legacy field
        teamIds: [],
        photoURL: userData.photoURL, // Include avatar
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // ============================================
    // 2. CREATE TEAMS
    // ============================================
    const teamsData = [
      {
        name: "Operations Team",
        description: "Handles daily operations and workflows",
      },
      {
        name: "Support Team",
        description: "Customer support and helpdesk",
      },
    ];

    const teamIds: string[] = [];
    for (const teamData of teamsData) {
      const teamRef = db.collection("teams").doc();
      teamIds.push(teamRef.id);
      batch.set(teamRef, {
        ...teamData,
        organizationId: orgId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // Assign users to teams
    // Jack and Sara to Operations Team
    const jackUserRef = db.collection("users").doc(userIds[0]);
    const saraUserRef = db.collection("users").doc(userIds[1]);
    batch.update(jackUserRef, { teamIds: [teamIds[0]] });
    batch.update(saraUserRef, { teamIds: [teamIds[0]] });

    // Emily and David to Support Team
    const emilyUserRef = db.collection("users").doc(userIds[3]);
    const davidUserRef = db.collection("users").doc(userIds[4]);
    batch.update(emilyUserRef, { teamIds: [teamIds[1]] });
    batch.update(davidUserRef, { teamIds: [teamIds[1]] });

    // ============================================
    // 3. CREATE PROCESS GROUP (for procedures)
    // ============================================
    const processGroupRef = db.collection("process_groups").doc();
    const processGroupId = processGroupRef.id;
    batch.set(processGroupRef, {
      organizationId: orgId,
      title: "Demo Workflows",
      description: "Demo process group for seeded procedures",
      icon: "FolderOpen",
      procedureSequence: [], // Will be populated after procedures are created
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // ============================================
    // 4. CREATE PROCEDURES (with steps)
    // ============================================
    const procedureTitles = [
      "Employee Onboarding",
      "Purchase Request",
      "IT Helpdesk",
      "Contract Review",
      "Legal Approval",
    ];

    const procedureIds: string[] = [];
    for (let i = 0; i < procedureTitles.length; i++) {
      const procedureRef = db.collection("procedures").doc();
      procedureIds.push(procedureRef.id);

      // Create meaningful step names based on procedure type
      const stepTemplates = [
        // Employee Onboarding
        {
          steps: [
            {
              id: "step_1",
              title: "Collect Employee Details",
              action: "INPUT" as AtomicAction,
              description: "Gather new employee information",
              config: {
                inputType: "text",
                fields: [
                  { name: "name", label: "Full Name", type: "text", required: true },
                  { name: "email", label: "Email", type: "email", required: true },
                  { name: "department", label: "Department", type: "text", required: true },
                ],
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[0], // Jack
              },
            },
            {
              id: "step_2",
              title: "Manager Approval",
              action: "AUTHORIZE" as AtomicAction,
              description: "Get approval from hiring manager",
              config: {
                approverId: userIds[1], // Sara
                requireSignature: true,
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[1], // Sara
              },
            },
            {
              id: "step_3",
              title: "IT Setup Request",
              action: "TRANSMIT" as AtomicAction,
              description: "Send IT setup request",
              config: {
                service: "slack",
                channel: "#it-support",
                message: "New employee onboarding: {{step_1.output.name}}",
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[2], // Emily
              },
            },
          ],
        },
        // Purchase Request
        {
          steps: [
            {
              id: "step_1",
              title: "Purchase Request Form",
              action: "INPUT" as AtomicAction,
              description: "Collect purchase details",
              config: {
                inputType: "text",
                fields: [
                  { name: "item", label: "Item Name", type: "text", required: true },
                  { name: "amount", label: "Amount", type: "number", required: true },
                  { name: "vendor", label: "Vendor", type: "text", required: true },
                ],
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[2], // Emily
              },
            },
            {
              id: "step_2",
              title: "Finance Review",
              action: "AUTHORIZE" as AtomicAction,
              description: "Finance team approval",
              config: {
                approverId: userIds[3], // David
                requireSignature: true,
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[3], // David
              },
            },
            {
              id: "step_3",
              title: "Process Payment",
              action: "STORE" as AtomicAction,
              description: "Record payment in system",
              config: {
                storageType: "database",
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[4], // Mike
              },
            },
          ],
        },
        // IT Helpdesk
        {
          steps: [
            {
              id: "step_1",
              title: "Ticket Details",
              action: "INPUT" as AtomicAction,
              description: "Collect support ticket information",
              config: {
                inputType: "text",
                fields: [
                  { name: "issue", label: "Issue Description", type: "text", required: true },
                  { name: "priority", label: "Priority", type: "select", required: true },
                ],
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[3], // David
              },
            },
            {
              id: "step_2",
              title: "Technical Review",
              action: "VALIDATE" as AtomicAction,
              description: "Review and validate ticket",
              config: {
                rule: "CONTAINS",
                target: "step_1_output_issue",
                value: "",
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[2], // Emily
              },
            },
            {
              id: "step_3",
              title: "Resolution",
              action: "STORE" as AtomicAction,
              description: "Mark ticket as resolved",
              config: {
                storageType: "database",
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[3], // David
              },
            },
          ],
        },
        // Contract Review
        {
          steps: [
            {
              id: "step_1",
              title: "Contract Upload",
              action: "INPUT" as AtomicAction,
              description: "Upload contract document",
              config: {
                inputType: "file",
                fields: [
                  { name: "contract", label: "Contract File", type: "file", required: true },
                ],
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[1], // Sara
              },
            },
            {
              id: "step_2",
              title: "Legal Review",
              action: "AUTHORIZE" as AtomicAction,
              description: "Legal team review and approval",
              config: {
                approverId: userIds[0], // Jack
                requireSignature: true,
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[0], // Jack
              },
            },
            {
              id: "step_3",
              title: "Archive Contract",
              action: "STORE" as AtomicAction,
              description: "Store approved contract",
              config: {
                storageType: "database",
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[4], // Mike
              },
            },
          ],
        },
        // Legal Approval
        {
          steps: [
            {
              id: "step_1",
              title: "Document Submission",
              action: "INPUT" as AtomicAction,
              description: "Submit legal documents",
              config: {
                inputType: "file",
                fields: [
                  { name: "document", label: "Legal Document", type: "file", required: true },
                ],
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[4], // Mike
              },
            },
            {
              id: "step_2",
              title: "Compliance Check",
              action: "VALIDATE" as AtomicAction,
              description: "Verify compliance requirements",
              config: {
                rule: "EQUAL",
                target: "step_1_output_status",
                value: "compliant",
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[0], // Jack
              },
            },
            {
              id: "step_3",
              title: "Final Approval",
              action: "AUTHORIZE" as AtomicAction,
              description: "Get final legal approval",
              config: {
                approverId: userIds[1], // Sara
                requireSignature: true,
              },
              assignment: {
                type: "SPECIFIC_USER",
                assigneeId: userIds[1], // Sara
              },
            },
          ],
        },
      ];
      
      const steps: AtomicStep[] = stepTemplates[i % stepTemplates.length].steps;

      batch.set(procedureRef, {
        title: procedureTitles[i],
        description: `Standard procedure for ${procedureTitles[i]}`,
        organizationId: orgId,
        processGroupId: processGroupId,
        steps,
        isPublished: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // Update process group with procedure sequence
    batch.update(processGroupRef, {
      procedureSequence: procedureIds,
    });

    // Commit users, teams, process group, and procedures first
    await batch.commit();

    // ============================================
    // 5. CREATE RUNS (with proper assignments)
    // ============================================
    const batch2 = db.batch();
    const runIds: string[] = [];

    // Fetch procedures to get their steps
    const procedureDocs = await Promise.all(
      procedureIds.map((id) => db.collection("procedures").doc(id).get())
    );
    const proceduresMap = new Map<string, any>();
    procedureDocs.forEach((doc) => {
      if (doc.exists) {
        proceduresMap.set(doc.id, doc.data());
      }
    });

    // Status distribution: 70% COMPLETED, 20% IN_PROGRESS, 10% FLAGGED
    const statusDistribution = [
      ...Array(21).fill("COMPLETED"),
      ...Array(6).fill("IN_PROGRESS"),
      ...Array(3).fill("FLAGGED"),
    ];

    // Shuffle status distribution
    for (let i = statusDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [statusDistribution[i], statusDistribution[j]] = [
        statusDistribution[j],
        statusDistribution[i],
      ];
    }

    for (let i = 0; i < 30; i++) {
      const status = statusDistribution[i] as "COMPLETED" | "IN_PROGRESS" | "FLAGGED";
      
      // Random procedure
      const procedureIndex = Math.floor(Math.random() * procedureIds.length);
      const procedureId = procedureIds[procedureIndex];
      const procedureTitle = procedureTitles[procedureIndex];
      const procedureData = proceduresMap.get(procedureId);
      const procedureSteps = procedureData?.steps || [];

      // Ensure we have valid steps
      if (procedureSteps.length === 0) {
        console.warn(`Procedure ${procedureId} has no steps, skipping run ${i}`);
        continue;
      }

      // Determine current step index based on status
      let currentStepIndex: number;
      if (status === "COMPLETED") {
        currentStepIndex = procedureSteps.length - 1; // Last step (all completed)
      } else {
        currentStepIndex = Math.min(
          Math.floor(Math.random() * procedureSteps.length),
          procedureSteps.length - 1
        );
      }

      const currentStep = procedureSteps[currentStepIndex];
      if (!currentStep) {
        console.warn(`No step at index ${currentStepIndex} for procedure ${procedureId}`);
        continue;
      }

      // Get assignee from step assignment, or use step's assignee, or random user
      let assigneeId: string;
      let assigneeEmail: string;
      let assigneeName: string;
      
      if (currentStep.assignment?.type === "SPECIFIC_USER" && currentStep.assignment.assigneeId) {
        // Use step's assigned user
        const assignedUserIndex = userIds.findIndex((id) => id === currentStep.assignment.assigneeId);
        if (assignedUserIndex >= 0) {
          assigneeId = userIds[assignedUserIndex];
          assigneeEmail = usersData[assignedUserIndex].email;
          assigneeName = usersData[assignedUserIndex].displayName;
        } else {
          // Fallback to random user
          const randomIndex = Math.floor(Math.random() * userIds.length);
          assigneeId = userIds[randomIndex];
          assigneeEmail = usersData[randomIndex].email;
          assigneeName = usersData[randomIndex].displayName;
        }
      } else {
        // Random assignee
        const assigneeIndex = Math.floor(Math.random() * userIds.length);
        assigneeId = userIds[assigneeIndex];
        assigneeEmail = usersData[assigneeIndex].email;
        assigneeName = usersData[assigneeIndex].displayName;
      }

      // Random startedAt within last 30 days
      const randomDaysAgo = Math.random() * 30;
      const startedAt = new Date(
        now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000
      );
      const startedAtTimestamp = Timestamp.fromDate(startedAt);

      // Calculate completedAt if status is COMPLETED
      let completedAt: Timestamp | null = null;
      if (status === "COMPLETED") {
        const durationHours = 2 + Math.random() * (5 * 24 - 2);
        const completedAtDate = new Date(
          startedAt.getTime() + durationHours * 60 * 60 * 1000
        );
        completedAt = Timestamp.fromDate(completedAtDate);
      }

      // Build logs based on completed steps
      const logs: any[] = [];
      if (status === "COMPLETED") {
        // All steps completed
        procedureSteps.forEach((step: AtomicStep, idx: number) => {
          const stepTimestamp = Timestamp.fromDate(
            new Date(startedAt.getTime() + idx * 2 * 60 * 60 * 1000)
          );
          logs.push({
            stepId: step.id,
            stepTitle: step.title,
            action: step.action,
            outcome: "SUCCESS" as const,
            timestamp: stepTimestamp,
            output: idx === 0 
              ? { name: "Demo User", email: "demo@example.com" }
              : idx === 1
              ? { approved: true }
              : { completed: true },
          });
        });
      } else if (status === "FLAGGED") {
        // Only first step completed, then flagged
        logs.push({
          stepId: procedureSteps[0].id,
          stepTitle: procedureSteps[0].title,
          action: procedureSteps[0].action,
          outcome: "FLAGGED" as const,
          timestamp: startedAtTimestamp,
          output: null,
        });
      } else {
        // IN_PROGRESS: Some steps completed
        for (let idx = 0; idx < currentStepIndex; idx++) {
          const step = procedureSteps[idx];
          const stepTimestamp = Timestamp.fromDate(
            new Date(startedAt.getTime() + idx * 2 * 60 * 60 * 1000)
          );
          logs.push({
            stepId: step.id,
            stepTitle: step.title,
            action: step.action,
            outcome: "SUCCESS" as const,
            timestamp: stepTimestamp,
            output: idx === 0 
              ? { name: "Demo User", email: "demo@example.com" }
              : { completed: true },
          });
        }
      }
      
      const runRef = db.collection("active_runs").doc();
      runIds.push(runRef.id);

      const runData = {
        procedureId,
        procedureTitle,
        title: procedureTitle,
        organizationId: orgId,
        status,
        currentStepIndex,
        currentStepId: currentStep.id,
        startedAt: startedAtTimestamp,
        startedBy: assigneeId,
        completedAt: completedAt || null,
        logs,
        currentAssigneeId: assigneeId,
        currentAssignee: assigneeEmail,
        assigneeType: "USER" as const,
        assigneeId: assigneeId,
        steps: procedureSteps, // Include steps for proper display
        updatedAt: completedAt || startedAtTimestamp,
        errorDetail: status === "FLAGGED" ? "Demo error: System task failed" : undefined,
      };

      batch2.set(runRef, runData);
    }

    await batch2.commit();

    // ============================================
    // 6. CREATE NOTIFICATIONS (for inbox)
    // ============================================
    const batch3 = db.batch();
    const notificationCount = 15; // Create 15 notifications

    for (let i = 0; i < notificationCount; i++) {
      // Random recipient
      const recipientIndex = Math.floor(Math.random() * userIds.length);
      const recipientId = userIds[recipientIndex];

      // Random trigger (different from recipient)
      let triggerIndex = Math.floor(Math.random() * userIds.length);
      while (triggerIndex === recipientIndex && userIds.length > 1) {
        triggerIndex = Math.floor(Math.random() * userIds.length);
      }
      const triggerUser = usersData[triggerIndex];

      // Random run
      const runIndex = Math.floor(Math.random() * runIds.length);
      const runId = runIds[runIndex];

      // Random notification type
      const types: Array<"ASSIGNMENT" | "COMMENT" | "COMPLETION" | "FLAG"> = [
        "ASSIGNMENT",
        "COMMENT",
        "COMPLETION",
        "FLAG",
      ];
      const type = types[Math.floor(Math.random() * types.length)];

      // Create notification based on type
      const titles = {
        ASSIGNMENT: "New Task Assigned",
        COMMENT: "New Comment on Task",
        COMPLETION: "Task Completed",
        FLAG: "Task Flagged",
      };

      const messages = {
        ASSIGNMENT: `${triggerUser.displayName} assigned you a new task`,
        COMMENT: `${triggerUser.displayName} commented on your task`,
        COMPLETION: `${triggerUser.displayName} completed a task`,
        FLAG: `A task was flagged and requires attention`,
      };

      const notificationRef = db.collection("notifications").doc();
      const notificationData: any = {
        recipientId,
        triggerBy: {
          userId: userIds[triggerIndex],
          name: triggerUser.displayName,
        },
        type,
        title: titles[type],
        message: messages[type],
        link: `/run/${runId}`,
        isRead: Math.random() > 0.5, // 50% read, 50% unread
        createdAt: Timestamp.fromDate(
          new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
        ),
        runId,
        stepId: `step_${Math.floor(Math.random() * 3) + 1}`,
      };

      batch3.set(notificationRef, notificationData);
    }

    await batch3.commit();

    return NextResponse.json({
      success: true,
      message: "Seeded demo data successfully",
      details: {
        organizationId: orgId,
        usersCreated: usersData.length,
        teamsCreated: teamsData.length,
        processGroupsCreated: 1,
        proceduresCreated: procedureTitles.length,
        runsCreated: 30,
        notificationsCreated: notificationCount,
        statusDistribution: {
          COMPLETED: statusDistribution.filter((s) => s === "COMPLETED").length,
          IN_PROGRESS: statusDistribution.filter((s) => s === "IN_PROGRESS").length,
          FLAGGED: statusDistribution.filter((s) => s === "FLAGGED").length,
        },
      },
    });
  } catch (error: any) {
    console.error("Error seeding demo data:", error);
    return NextResponse.json(
      {
        error: "Failed to seed demo data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
