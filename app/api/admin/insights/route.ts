import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { deepseekGenerate } from "@/lib/deepseek";

export async function GET() {
  try {
    const certs = await database.getAllCertificates();
    const verifications = await database.getVerifications();

    const total = certs.length;
    const valid = certs.filter((c) => c.status === "valid").length;
    const expired = certs.filter((c) => c.status === "expired").length;
    const revoked = certs.filter((c) => c.status === "revoked").length;

    const categoryCount: Record<
      string,
      { valid: number; expired: number; revoked: number }
    > = {};
    certs.forEach((c) => {
      if (!categoryCount[c.category])
        categoryCount[c.category] = { valid: 0, expired: 0, revoked: 0 };
      categoryCount[c.category][c.status as "valid" | "expired" | "revoked"]++;
    });

    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const recentVerifs = verifications.filter(
      (v) => v.timestamp > weekAgo
    ).length;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const issuedThisMonth = certs.filter((c) => {
      const d = new Date(c.dateIssued);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    let insights: string[] = [];

    try {
      const categoryBreakdown = Object.entries(categoryCount)
        .map(
          ([cat, stats]) =>
            `${cat}: ${stats.valid} valid, ${stats.expired} expired, ${stats.revoked} revoked`
        )
        .join("; ");

      const text = await deepseekGenerate(
        `Analyze this NAUB certificate system data and provide exactly 4 concise, specific, data-driven insights (one per line, no bullets or numbering, no formatting characters):

Data:
- Total certificates: ${total} (${valid} valid, ${expired} expired, ${revoked} revoked)
- Issued this month: ${issuedThisMonth}
- Verifications in last 7 days: ${recentVerifs}
- Category breakdown: ${categoryBreakdown}

Each insight must reference specific numbers from the data and suggest an action where applicable.`,
        { temperature: 0.6, maxTokens: 300 }
      );

      if (text) {
        insights = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 4);
      }
    } catch {
      insights = [];
    }

    if (insights.length === 0) {
      const validPct = total > 0 ? Math.round((valid / total) * 100) : 0;
      insights = [
        `${valid} of ${total} certificates (${validPct}%) are currently active and valid.`,
        `${expired} certificate(s) have expired${expired > 0 ? " — consider initiating registry support outreach" : "."}.`,
        `${recentVerifs} verification(s) performed in the last 7 days, showing active usage of the portal.`,
        issuedThisMonth > 0
          ? `${issuedThisMonth} certificate(s) issued this month.${revoked > 0 ? ` ${revoked} revocation(s) on record.` : ""}`
          : `No new certificates issued this month.${revoked > 0 ? ` ${revoked} certificate(s) revoked overall.` : ""}`,
      ];
    }

    return NextResponse.json({
      insights,
      stats: { total, valid, expired, revoked, recentVerifs, issuedThisMonth },
    });
  } catch (error) {
    console.error("[Insights]", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
