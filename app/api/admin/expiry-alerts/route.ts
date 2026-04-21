import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  try {
    const certs = await database.getAllCertificates();
    const now = Date.now();

    const critical: Array<(typeof certs)[0] & { daysLeft: number }> = [];
    const warning: Array<(typeof certs)[0] & { daysLeft: number }> = [];
    const alreadyExpired: Array<(typeof certs)[0] & { daysLeft: number }> = [];

    for (const cert of certs) {
      if (cert.status === "revoked") continue;
      const expiry = new Date(cert.dateExpiry).getTime();
      const daysLeft = Math.ceil((expiry - now) / 86400000);

      if (daysLeft <= 0) {
        alreadyExpired.push({ ...cert, daysLeft });
      } else if (daysLeft <= 7) {
        critical.push({ ...cert, daysLeft });
      } else if (daysLeft <= 30) {
        warning.push({ ...cert, daysLeft });
      }
    }

    const sortByExpiry = (
      a: { dateExpiry: string },
      b: { dateExpiry: string }
    ) =>
      new Date(a.dateExpiry).getTime() - new Date(b.dateExpiry).getTime();
    critical.sort(sortByExpiry);
    warning.sort(sortByExpiry);
    alreadyExpired.sort(sortByExpiry);

    const categoryCount: Record<string, number> = {};
    [...critical, ...warning, ...alreadyExpired].forEach((c) => {
      categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, count]) => `${cat} (${count})`)
      .join(", ");

    let aiSummary: string | null = null;
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are the NITDA certificate management AI. Write a concise executive summary (3-4 sentences) for the admin about the current certificate expiry situation:
- ${critical.length} certificate(s) expiring within 7 days (CRITICAL)
- ${warning.length} certificate(s) expiring within 8-30 days (WARNING)
- ${alreadyExpired.length} certificate(s) already expired and awaiting renewal
- Most affected categories: ${topCategories || "None"}

End with 1-2 specific, actionable recommendations. Be direct and professional. No asterisks or special characters.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: prompt,
          config: {
            temperature: 0.5,
            maxOutputTokens: 200,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        aiSummary = response.text?.trim() || null;
      } catch {
        aiSummary = null;
      }
    }

    if (!aiSummary) {
      const total = critical.length + warning.length + alreadyExpired.length;
      aiSummary =
        total === 0
          ? "All certificates are in good standing. No expiry actions required at this time."
          : `${critical.length} certificate(s) require immediate attention (expiring within 7 days). ${warning.length} certificate(s) are expiring within 30 days. ${alreadyExpired.length} certificate(s) have already expired and need renewal. Most affected categories: ${topCategories || "None"}.`;
    }

    return NextResponse.json({
      critical,
      warning,
      expired: alreadyExpired,
      aiSummary,
    });
  } catch (error) {
    console.error("[Expiry Alerts]", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry alerts" },
      { status: 500 }
    );
  }
}
