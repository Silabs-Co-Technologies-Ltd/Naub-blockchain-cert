import { NextResponse } from "next/server";
import { deepseekGenerate } from "@/lib/deepseek";

export async function POST(req: Request) {
  try {
    const { companyName, category, email, phone, address } = await req.json();

    if (!companyName || !category || !email || !phone || !address) {
      return NextResponse.json(
        { error: "All fields are required for review" },
        { status: 400 }
      );
    }

    let riskLevel: "low" | "medium" | "high" = "low";
    const flags: string[] = [];
    let recommendation =
      "Application looks good. Proceed with certificate issuance.";

    if (!email.includes("@") || !email.includes(".")) {
      flags.push("Email format appears invalid");
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      flags.push("Phone number appears too short");
    }
    if (address.trim().split(/\s+/).length < 3) {
      flags.push("Business address appears incomplete");
    }
    if (companyName.trim().split(/\s+/).length < 2) {
      flags.push("Company name appears incomplete — single word names are unusual for registered businesses");
    }
    if (email.split("@")[1]?.includes("gmail") || email.split("@")[1]?.includes("yahoo") || email.split("@")[1]?.includes("hotmail")) {
      flags.push("Free email provider detected — registered businesses typically use a corporate domain");
    }

    try {
      const text = await deepseekGenerate(
        `You are a risk assessment AI for NITDA (Nigeria's National Information Technology Development Agency). Review this IT service provider certificate application for potential red flags.

Application Data:
- Company Name: ${companyName}
- Service Category: ${category}
- Email: ${email}
- Phone: ${phone}
- Business Address: ${address}

Assess the following:
1. Does the company name appear legitimate for a Nigerian ${category} provider?
2. Does the email domain suggest a real business (not free email)?
3. Is the phone number in valid Nigerian format (starts with +234 or 0, 11-13 digits)?
4. Is the address sufficiently detailed for a Nigerian business location?
5. Are there any inconsistencies between the fields?

Respond in this exact format (no extra text, no markdown):
RISK: low|medium|high
FLAGS: [comma-separated specific concerns, or "none"]
RECOMMENDATION: [1-2 sentence recommendation for the admin]`,
        { temperature: 0.3, maxTokens: 200 }
      );

      if (text) {
        const riskMatch = text.match(/RISK:\s*(low|medium|high)/i);
        const flagsMatch = text.match(/FLAGS:\s*(.+)/i);
        const recMatch = text.match(/RECOMMENDATION:\s*([\s\S]+?)(?=\n[A-Z]+:|$)/i);

        if (riskMatch) {
          riskLevel = riskMatch[1].toLowerCase() as "low" | "medium" | "high";
        }
        if (flagsMatch && flagsMatch[1].trim().toLowerCase() !== "none") {
          const aiFlags = flagsMatch[1]
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
          aiFlags.forEach((f) => {
            if (!flags.includes(f)) flags.push(f);
          });
        }
        if (recMatch) {
          recommendation = recMatch[1].trim();
        }
      }
    } catch {
      if (flags.length >= 2) {
        riskLevel = "high";
        recommendation = "Multiple issues detected. Verify the application details before issuing this certificate.";
      } else if (flags.length === 1) {
        riskLevel = "medium";
        recommendation = "One issue detected. Review the flagged item before proceeding.";
      }
    }

    return NextResponse.json({ riskLevel, flags, recommendation });
  } catch (error) {
    console.error("[Review Application]", error);
    return NextResponse.json(
      { error: "Failed to review application" },
      { status: 500 }
    );
  }
}
