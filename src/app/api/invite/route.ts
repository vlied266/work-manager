import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { render } from "@react-email/render";
import InviteEmail from "@/components/emails/InviteEmail";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, teamId, orgId, inviterName } = body;

    // Validate required fields
    if (!email || !orgId || !role || !inviterName) {
      return NextResponse.json(
        { error: "Missing required fields: email, orgId, role, inviterName" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists in the organization
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email),
      where("organizationId", "==", orgId)
    );
    const existingUsers = await getDocs(usersQuery);
    
    if (!existingUsers.empty) {
      return NextResponse.json(
        { error: "User with this email already exists in the organization" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email and org
    const invitationsQuery = query(
      collection(db, "invitations"),
      where("email", "==", email),
      where("orgId", "==", orgId),
      where("status", "==", "pending")
    );
    const existingInvitations = await getDocs(invitationsQuery);
    
    if (!existingInvitations.empty) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Get organization name
    const orgDoc = await import("firebase/firestore").then((m) =>
      m.getDoc(m.doc(db, "organizations", orgId))
    );
    const orgName = orgDoc.exists() ? orgDoc.data().name : "Your Organization";

    // Save invitation to Firestore
    const invitationRef = await addDoc(collection(db, "invitations"), {
      email,
      orgId,
      role,
      teamId: teamId || null,
      token,
      status: "pending",
      inviterName,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // Construct invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/accept-invite?token=${token}`;

    // Render email template
    const emailHtml = await render(
      InviteEmail({
        inviterName,
        orgName,
        inviteLink,
      })
    );

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Atomic Team <info@theatomicwork.com>",
      to: email,
      subject: `Join ${orgName} on Atomic Work`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send invitation email", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        invitationId: invitationRef.id,
        emailId: data?.id,
        message: "Invitation sent successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

