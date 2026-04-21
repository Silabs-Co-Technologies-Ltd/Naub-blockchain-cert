import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export interface Anomaly {
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  detail: string;
}

export async function GET() {
  try {
    const verifications = await database.getVerifications();
    const now = Date.now();
    const TWELVE_HOURS = 43_200_000;
    const ONE_DAY = 86_400_000;

    const anomalies: Anomaly[] = [];

    const recentByCert: Record<string, number> = {};
    const recentByIp: Record<string, Set<string>> = {};

    verifications.forEach((v) => {
      if (now - v.timestamp < TWELVE_HOURS) {
        recentByCert[v.certificateId] =
          (recentByCert[v.certificateId] || 0) + 1;
        if (!recentByIp[v.ipAddress]) recentByIp[v.ipAddress] = new Set();
        recentByIp[v.ipAddress].add(v.certificateId);
      }
    });

    // Flag certificates verified more than 15 times in the last 12 hours
    Object.entries(recentByCert).forEach(([certId, count]) => {
      if (count > 15) {
        anomalies.push({
          type: "High-Frequency Lookup",
          severity: count > 30 ? "high" : "medium",
          description: `Certificate ${certId} was verified ${count} times in the last 12 hours.`,
          detail:
            "This may indicate a shared or forged certificate being actively presented to third parties.",
        });
      }
    });

    // Flag IPs scanning more than 7 different certificates in the last 12 hours
    const localIps = new Set(["unknown", "::1", "127.0.0.1", "::ffff:127.0.0.1"]);
    Object.entries(recentByIp).forEach(([ip, certs]) => {
      if (certs.size > 7 && !localIps.has(ip)) {
        anomalies.push({
          type: "Bulk Certificate Scanning",
          severity: certs.size > 20 ? "high" : "medium",
          description: `IP ${ip} checked ${certs.size} different certificates in the last 12 hours.`,
          detail:
            "Automated scanning pattern detected. Could indicate certificate enumeration or fraud investigation.",
        });
      }
    });

    // Flag unusually high overall verification volume in last 24 hours
    const dayVerifs = verifications.filter((v) => now - v.timestamp < ONE_DAY);
    const uniqueDay = new Set(dayVerifs.map((v) => v.certificateId)).size;
    if (uniqueDay > 15 && dayVerifs.length > uniqueDay * 4) {
      anomalies.push({
        type: "Elevated Verification Volume",
        severity: "low",
        description: `${dayVerifs.length} verifications across ${uniqueDay} unique certificates in the last 24 hours.`,
        detail:
          "Verification volume is unusually high. This may be normal peak usage or warrant further review.",
      });
    }

    return NextResponse.json({
      anomalies,
      totalVerificationsChecked: verifications.length,
      scannedWindow: "1 hour / 24 hours",
    });
  } catch (error) {
    console.error("[Anomalies]", error);
    return NextResponse.json(
      { error: "Failed to analyze anomalies" },
      { status: 500 }
    );
  }
}
