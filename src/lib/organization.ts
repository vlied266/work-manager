import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { PlanTier } from "@/types/workos";

interface BootstrapOptions {
  name: string;
  domain: string;
  plan: PlanTier;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  defaultTeamName: string;
  inviteEmails: string[];
}

export async function bootstrapOrganization({
  name,
  domain,
  plan,
  ownerUid,
  ownerEmail,
  ownerName,
  defaultTeamName,
  inviteEmails,
}: BootstrapOptions) {
  const orgRef = doc(collection(db, "organizations"));
  await setDoc(orgRef, {
    name,
    domain,
    plan,
    createdAt: serverTimestamp(),
  });

  const teamRef = doc(collection(db, "teams"));
  await setDoc(teamRef, {
    organizationId: orgRef.id,
    name: defaultTeamName || "Operations",
    members: [ownerUid],
  });

  await setDoc(doc(db, "users", ownerUid), {
    uid: ownerUid,
    email: ownerEmail,
    displayName: ownerName,
    avatarUrl: "",
    organizationId: orgRef.id,
    teamIds: [teamRef.id],
    role: "ADMIN",
  });

  if (inviteEmails.length) {
    await Promise.all(
      inviteEmails.map((inviteEmail) =>
        addDoc(collection(db, "organizations", orgRef.id, "invites"), {
          email: inviteEmail,
          invitedBy: ownerUid,
          status: "PENDING",
          createdAt: serverTimestamp(),
        }),
      ),
    );
  }

  return { organizationId: orgRef.id, teamId: teamRef.id };
}

