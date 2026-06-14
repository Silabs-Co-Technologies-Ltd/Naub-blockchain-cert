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
      "Record looks good. Proceed with certificate issuance after confirming registry approval.";

    if (!email.includes("@") || !email.includes(".")) {
      flags.push("Email format appears invalid");
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      flags.push("Phone number appears too short");
    }
    if (address.trim().split(/\s+/).length < 3) {
      flags.push("Contact address appears incomplete");
    }
    if (companyName.trim().split(/\s+/).length < 2) {
      flags.push("Holder name appears incomplete — use the full student or graduate name");
    }
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    if (["gmail", "yahoo", "hotmail", "outlook"].some((d) => domain.includes(d))) {
      flags.push("Free email provider detected — confirm the holder against official NAUB records");
    }

    try {
      const text = await deepseekGenerate(
        `You are a registry risk assessment AI for Nigerian Army University Biu (NAUB). Review this academic certificate issuance request for possible inconsistencies.

Application Data:
- Student / Graduate Name: ${companyName}
- Programme / Department: ${category}
- Email: ${email}
- Phone: ${phone}
- Contact Address: ${address}

Assess the following:
1. Does the holder name look complete enough for an academic certificate record?
2. Does the programme/department look plausible for a university certificate?
3. Does the email format look usable, and should the registry confirm it against institutional records?
4. Is the phone number in a plausible Nigerian format?
5. Is the address detailed enough for registry contact purposes?

Respond in this exact format (no extra text, no markdown):
RISK: low|medium|high
FLAGS: [comma-separated specific concerns, or "none"]
RECOMMENDATION: [1-2 sentence recommendation for the registry admin]`,
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
        recommendation = "Multiple issues detected. Verify the holder details against official registry records before issuing this certificate.";
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
