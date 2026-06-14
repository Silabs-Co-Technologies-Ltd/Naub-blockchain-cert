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

    let subject = `NAUB Certificate Revalidation Required – ${certificate.id}`;
    let body = `Dear ${certificate.companyName},

This is an official notice from the Nigerian Army University Biu (NAUB) regarding your NAUB graduate certificate.

Your NAUB certificate (ID: ${certificate.id}) for the ${certificate.category} programme has ${expiryStatus}. As a registered NAUB graduate, you are required to maintain a valid certificate to continue presenting this credential for verification.

To request revalidation or registry support for your certificate, please take the following steps:
1. Log in to the NAUB Certificate Registry Portal
2. Complete the registry support request form
3. Submit the following documents:
   - Updated student identity confirmation
   - Updated academic record evidence in the ${certificate.category} sector
   - Any required university clearance evidence
   - Completed registry request form
4. Pay any approved transcript or certificate processing fee, if applicable

Please complete this renewal at your earliest convenience to keep your academic credential record current.

For assistance, contact us at support@naub.edu.ng or call our helpdesk.

Regards,
Certificate Management Division
Nigerian Army University Biu (NAUB)`;

    try {
      const text = await deepseekGenerate(
        `Draft a professional, formal certificate lifecycle notice email from NAUB (Nigerian Army University Biu of Nigeria) to an NAUB graduate.

Certificate Details:
- Holder: ${certificate.companyName}
- Programme / Department: ${certificate.category}
- Certificate ID: ${certificate.id}
- Status: ${expiryStatus}
- Contact Email: ${certificate.email}
- Address: ${certificate.address}

Requirements:
- Official and formal university registry tone
- Specific to the ${certificate.category} programme in Nigeria
- Include realistic required documents for this category
- Include clear registry support steps
- Reference support@naub.edu.ng
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
    console.error("[Draft Certificate Lifecycle Notice]", error);
    return NextResponse.json(
      { error: "Failed to draft certificate lifecycle notice" },
      { status: 500 }
    );
  }
}
