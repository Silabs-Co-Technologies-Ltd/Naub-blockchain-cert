import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { deepseekGenerate } from "@/lib/deepseek";
import nodemailer from "nodemailer";

function getTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) return null;

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  });
}

async function draftEmail(cert: {
  id: string;
  companyName: string;
  category: string;
  dateExpiry: string;
  email: string;
  daysLeft: number;
}): Promise<{ subject: string; body: string }> {
  const urgency =
    cert.daysLeft <= 0
      ? `expired ${Math.abs(cert.daysLeft)} day(s) ago`
      : cert.daysLeft <= 7
        ? `expiring in ${cert.daysLeft} day(s) — URGENT`
        : `expiring in ${cert.daysLeft} day(s)`;

  const defaultSubject = `NITDA Certificate Renewal Notice — ${cert.id}`;
  const defaultBody = `Dear ${cert.companyName},

This is an official reminder from NITDA that your IT service provider certificate (ID: ${cert.id}) for ${cert.category} services is ${urgency}.

Please log in to the NITDA Vendor Portal to initiate your renewal. Prepare the following documents:
- Updated CAC registration
- Tax clearance certificate
- Evidence of continued ${cert.category} operations
- Completed renewal form signed by authorised signatory

For assistance contact support@nitda.gov.ng.

Regards,
Certificate Management Division
NITDA`;

  try {
    const text = await deepseekGenerate(
      `Draft a concise, formal certificate renewal notice email from NITDA to an IT service provider.

Details:
- Company: ${cert.companyName}
- Certificate ID: ${cert.id}
- Category: ${cert.category}
- Status: ${urgency}
- Email: ${cert.email}

Rules: Nigerian government tone, no markdown or asterisks, include category-specific renewal steps, reference support@nitda.gov.ng.

Format:
SUBJECT: [subject]
BODY:
[email body]`,
      { temperature: 0.4, maxTokens: 450 }
    );

    if (text) {
      const subjectMatch = text.match(/SUBJECT:\s*(.+)/);
      const bodyMatch = text.match(/BODY:\s*([\s\S]+)/);
      return {
        subject: subjectMatch?.[1]?.trim() || defaultSubject,
        body: bodyMatch?.[1]?.trim() || defaultBody,
      };
    }
  } catch {
    // fall through to default
  }

  return { subject: defaultSubject, body: defaultBody };
}

export async function POST() {
  try {
    const certs = await database.getAllCertificates();
    const now = Date.now();

    const targets = certs
      .filter((c) => c.status !== "revoked" && c.email)
      .map((c) => {
        const daysLeft = Math.ceil(
          (new Date(c.dateExpiry).getTime() - now) / 86_400_000
        );
        return { ...c, daysLeft };
      })
      .filter((c) => c.daysLeft <= 30);

    if (targets.length === 0) {
      return NextResponse.json({
        sent: 0,
        skipped: 0,
        results: [],
        message: "No certificates require email notifications at this time.",
      });
    }

    const transporter = getTransporter();
    const emailConfigured = transporter !== null;

    const results: Array<{
      certificateId: string;
      companyName: string;
      email: string;
      daysLeft: number;
      status: "sent" | "draft" | "failed";
      subject: string;
    }> = [];

    for (const cert of targets) {
      const { subject, body } = await draftEmail(cert);

      if (!emailConfigured) {
        results.push({
          certificateId: cert.id,
          companyName: cert.companyName,
          email: cert.email,
          daysLeft: cert.daysLeft,
          status: "draft",
          subject,
        });
        continue;
      }

      try {
        await transporter!.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: cert.email,
          subject,
          text: body,
        });
        results.push({
          certificateId: cert.id,
          companyName: cert.companyName,
          email: cert.email,
          daysLeft: cert.daysLeft,
          status: "sent",
          subject,
        });
      } catch (err) {
        console.error(`[SendEmail] Failed for ${cert.id}:`, err);
        results.push({
          certificateId: cert.id,
          companyName: cert.companyName,
          email: cert.email,
          daysLeft: cert.daysLeft,
          status: "failed",
          subject,
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const drafts = results.filter((r) => r.status === "draft").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      sent,
      drafts,
      failed,
      emailConfigured,
      results,
      message: emailConfigured
        ? `${sent} email(s) sent, ${failed} failed.`
        : `Email SMTP not configured. ${drafts} renewal notice(s) drafted — configure EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env.local to enable sending.`,
    });
  } catch (error) {
    console.error("[Send Expiry Emails]", error);
    return NextResponse.json(
      { error: "Failed to send expiry emails" },
      { status: 500 }
    );
  }
}
