import { NextResponse } from "next/server";
import { deepseekGenerate } from "@/lib/deepseek";

export async function POST(req: Request) {
  try {
    const { certificate } = await req.json();

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate data required" },
        { status: 400 }
      );
    }

    const expiryDate = new Date(certificate.dateExpiry);
    const daysExpired = Math.ceil(
      (Date.now() - expiryDate.getTime()) / 86400000
    );
    const expiryStatus =
      daysExpired > 0
        ? `expired ${daysExpired} day(s) ago`
        : `expiring on ${expiryDate.toLocaleDateString("en-NG")}`;

    let subject = `NITDA Certificate Renewal Required – ${certificate.id}`;
    let body = `Dear ${certificate.companyName},

This is an official notice from the National Information Technology Development Agency (NITDA) regarding your IT service provider certificate.

Your NITDA certificate (ID: ${certificate.id}) for ${certificate.category} services has ${expiryStatus}. As a registered IT service provider, you are required to maintain a valid certificate to continue operating in this category.

To renew your certificate, please take the following steps:
1. Log in to the NITDA Vendor Portal
2. Complete the renewal application form
3. Submit the following documents:
   - Updated Corporate Affairs Commission (CAC) registration
   - Evidence of continued operations in the ${certificate.category} sector
   - Most recent tax clearance certificate
   - Completed renewal form signed by authorized signatory
4. Pay the applicable renewal fee

Please complete this renewal at your earliest convenience to avoid disruption to your services.

For assistance, contact us at support@nitda.gov.ng or call our helpdesk.

Regards,
Certificate Management Division
National Information Technology Development Agency (NITDA)`;

    try {
      const text = await deepseekGenerate(
        `Draft a professional, formal certificate renewal notice email from NITDA (National Information Technology Development Agency of Nigeria) to an IT service provider.

Certificate Details:
- Company: ${certificate.companyName}
- Service Category: ${certificate.category}
- Certificate ID: ${certificate.id}
- Status: ${expiryStatus}
- Contact Email: ${certificate.email}
- Address: ${certificate.address}

Requirements:
- Official and formal government agency tone
- Specific to ${certificate.category} services in Nigeria
- Include realistic required documents for this category
- Include clear renewal steps
- Reference support@nitda.gov.ng
- No asterisks or markdown formatting

Format your response exactly as:
SUBJECT: [subject line]
BODY:
[full email body]`,
        { temperature: 0.4, maxTokens: 500 }
      );

      if (text) {
        const subjectMatch = text.match(/SUBJECT:\s*(.+)/);
        const bodyMatch = text.match(/BODY:\s*([\s\S]+)/);
        if (subjectMatch) subject = subjectMatch[1].trim();
        if (bodyMatch) body = bodyMatch[1].trim();
      }
    } catch {
      // use fallback template
    }

    return NextResponse.json({ subject, body });
  } catch (error) {
    console.error("[Draft Renewal Notice]", error);
    return NextResponse.json(
      { error: "Failed to draft renewal notice" },
      { status: 500 }
    );
  }
}
