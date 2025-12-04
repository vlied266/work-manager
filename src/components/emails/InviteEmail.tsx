import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InviteEmailProps {
  inviterName: string;
  orgName: string;
  inviteLink: string;
}

export const InviteEmail = ({
  inviterName = "Team Admin",
  orgName = "Your Organization",
  inviteLink = "https://example.com/accept-invite",
}: InviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You have been invited to join {orgName} on Atomic Work</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You&apos;re Invited!</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{orgName}</strong> on Atomic Work.
          </Text>
          <Text style={text}>
            Atomic Work helps teams streamline their workflows and collaborate more
            effectively. Click the button below to accept your invitation and
            get started.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Join Team
            </Button>
          </Section>
          <Text style={footer}>
            If you didn&apos;t expect this invitation, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InviteEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#007AFF",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  boxShadow: "0 2px 4px rgba(0,122,255,0.2)",
};

const footer = {
  color: "#8a8a8a",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "32px 0 0",
  textAlign: "center" as const,
};

