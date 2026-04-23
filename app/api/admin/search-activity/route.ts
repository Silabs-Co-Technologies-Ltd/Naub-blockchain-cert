import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET() {
  try {
    const [verifications, certs] = await Promise.all([
      database.getVerifications(),
      database.getAllCertificates(),
    ]);

    const certMap = new Map(certs.map((c) => [c.id, c.companyName]));

    const now = Date.now();
    const ONE_DAY = 86_400_000;
    const recent = verifications
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    // Per-certificate search counts
    const certCounts: Record<string, number> = {};
    verifications.forEach((v) => {
      certCounts[v.certificateId] = (certCounts[v.certificateId] || 0) + 1;
    });
    const topCerts = Object.entries(certCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([certificateId, count]) => ({
        certificateId,
        companyName: certMap.get(certificateId) ?? "Unknown",
        count,
      }));

    // Per-IP stats (last 24h)
    const ipData: Record<string, { count: number; certs: Set<string> }> = {};
    verifications.forEach((v) => {
      if (now - v.timestamp > ONE_DAY) return;
      if (!ipData[v.ipAddress]) ipData[v.ipAddress] = { count: 0, certs: new Set() };
      ipData[v.ipAddress].count++;
      ipData[v.ipAddress].certs.add(v.certificateId);
    });

    const localIps = new Set(["unknown", "::1", "127.0.0.1", "::ffff:127.0.0.1"]);
    const topIps = Object.entries(ipData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        uniqueCerts: data.certs.size,
        suspicious: !localIps.has(ip) && data.certs.size > 5,
      }));

    const suspiciousCount = topIps.filter((i) => i.suspicious).length;

    return NextResponse.json({
      recentActivity: recent,
      topCerts,
      topIps,
      totalSearches: verifications.length,
      uniqueIps: Object.keys(ipData).length,
      suspiciousCount,
    });
  } catch (error) {
    console.error("[Search Activity]", error);
    return NextResponse.json(
      { error: "Failed to load search activity" },
      { status: 500 }
    );
  }
}
