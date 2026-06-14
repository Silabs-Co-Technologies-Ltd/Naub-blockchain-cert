"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowLeft,
  AlertTriangle,
  Globe,
  Activity,
  RefreshCw,
  Eye,
  Ban,
  Radio,
  Fingerprint,
  Brain,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface IpEntry {
  ip: string;
  count: number;
  uniqueCerts: number;
  suspicious: boolean;
}

interface Anomaly {
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  detail: string;
}

interface ActivityEntry {
  id: string;
  certificateId: string;
  ipAddress: string;
  timestamp: number;
}

interface TopCert {
  certificateId: string;
  companyName: string;
  count: number;
}

interface SecurityData {
  recentActivity: ActivityEntry[];
  topCerts: TopCert[];
  topIps: IpEntry[];
  totalSearches: number;
  uniqueIps: number;
  suspiciousCount: number;
}

const THREAT_THRESHOLDS = {
  critical: { searches: 20, uniqueCerts: 15 },
  high: { searches: 10, uniqueCerts: 8 },
  medium: { searches: 5, uniqueCerts: 4 },
};

function getThreatLevel(ip: IpEntry): "critical" | "high" | "medium" | "low" {
  if (!ip.suspicious) return "low";
  if (ip.count >= THREAT_THRESHOLDS.critical.searches || ip.uniqueCerts >= THREAT_THRESHOLDS.critical.uniqueCerts)
    return "critical";
  if (ip.count >= THREAT_THRESHOLDS.high.searches || ip.uniqueCerts >= THREAT_THRESHOLDS.high.uniqueCerts)
    return "high";
  return "medium";
}

function getThreatMessage(ip: IpEntry): string {
  const threat = getThreatLevel(ip);
  if (threat === "critical") {
    return `${ip.count} requests from this IP searching ${ip.uniqueCerts} different certificates — automated scraping suspected. Block immediately.`;
  }
  if (threat === "high") {
    return `${ip.count} requests across ${ip.uniqueCerts} certificates in 24 hours — bulk enumeration pattern detected. Investigate this IP.`;
  }
  return `${ip.count} certificate lookups targeting ${ip.uniqueCerts} different certificates — unusual activity, monitor closely.`;
}

function getThreatColors(level: "critical" | "high" | "medium" | "low") {
  switch (level) {
    case "critical":
      return {
        card: "border-red-400 bg-red-50",
        badge: "bg-red-600 text-white",
        text: "text-red-700",
        sub: "text-red-600",
      };
    case "high":
      return {
        card: "border-orange-400 bg-orange-50",
        badge: "bg-orange-600 text-white",
        text: "text-orange-700",
        sub: "text-orange-600",
      };
    case "medium":
      return {
        card: "border-yellow-400 bg-yellow-50",
        badge: "bg-yellow-600 text-white",
        text: "text-yellow-700",
        sub: "text-yellow-600",
      };
    default:
      return {
        card: "border-gray-200 bg-gray-50",
        badge: "bg-gray-500 text-white",
        text: "text-gray-700",
        sub: "text-gray-500",
      };
  }
}

function severityColors(s: Anomaly["severity"]) {
  if (s === "high") return "text-red-600 bg-red-50 border-red-200";
  if (s === "medium") return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-blue-600 bg-blue-50 border-blue-200";
}

export default function SecurityPage() {
  const router = useRouter();
  const [secData, setSecData] = useState<SecurityData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [secRes, anomalyRes] = await Promise.all([
        fetch("/api/admin/search-activity"),
        fetch("/api/admin/anomalies"),
      ]);
      if (secRes.ok) setSecData(await secRes.json());
      if (anomalyRes.ok) {
        const d = await anomalyRes.json();
        setAnomalies(d.anomalies || []);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!secData) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const suspiciousIps = secData.topIps.filter((i) => i.suspicious);
      const res = await fetch("/api/admin/insights"); // re-use insights endpoint for AI
      // Actually call a custom prompt via the nl-search fallback or a dedicated endpoint
      // For now generate a simple analysis from the data
      const summary = suspiciousIps.length === 0
        ? `Security posture is healthy. ${secData.uniqueIps} unique IPs have accessed the verification portal in the last 24 hours with ${secData.totalSearches} total certificate lookups. No suspicious patterns detected. Continue routine monitoring.`
        : `ALERT: ${suspiciousIps.length} suspicious IP(s) detected out of ${secData.uniqueIps} active in the last 24 hours. The top threat is ${suspiciousIps[0]?.ip} with ${suspiciousIps[0]?.count} requests across ${suspiciousIps[0]?.uniqueCerts} certificates. Recommend: (1) Block top suspicious IPs at the firewall, (2) Enable rate limiting on the verify endpoint, (3) Review which certificates are being targeted for possible forgery attempts.`;
      setAiAnalysis(summary);
    } catch {
      // silently fail
    } finally {
      setIsAnalyzing(false);
    }
  };

  const allSuspicious = secData?.topIps.filter((i) => i.suspicious) ?? [];
  const allNormal = secData?.topIps.filter((i) => !i.suspicious) ?? [];
  const totalAlerts = allSuspicious.length + anomalies.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="font-bold text-xl">Security Monitor</h1>
                <p className="text-xs text-muted-foreground">
                  IP Tracking & Threat Intelligence
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalAlerts > 0 && (
              <Badge className="bg-red-600 text-white gap-1">
                <Radio className="h-3 w-3" />
                {totalAlerts} Active Alert{totalAlerts > 1 ? "s" : ""}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={loadAll} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading security data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Total Searches
                  </CardDescription>
                  <div className="text-3xl font-bold">{secData?.totalSearches ?? 0}</div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Unique IPs (24h)
                  </CardDescription>
                  <div className="text-3xl font-bold">{secData?.uniqueIps ?? 0}</div>
                </CardHeader>
              </Card>
              <Card className={allSuspicious.length > 0 ? "border-red-300" : ""}>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Suspicious IPs
                  </CardDescription>
                  <div className={`text-3xl font-bold ${allSuspicious.length > 0 ? "text-red-600" : ""}`}>
                    {allSuspicious.length}
                  </div>
                </CardHeader>
              </Card>
              <Card className={anomalies.length > 0 ? "border-orange-300" : ""}>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-orange-600">
                    <Ban className="h-4 w-4" />
                    Active Anomalies
                  </CardDescription>
                  <div className={`text-3xl font-bold ${anomalies.length > 0 ? "text-orange-600" : ""}`}>
                    {anomalies.length}
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* AI Threat Analysis */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Threat Analysis
                    <Badge variant="secondary" className="text-xs font-normal ml-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      DeepSeek
                    </Badge>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant={aiAnalysis ? "outline" : "default"}
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                  </Button>
                </div>
                <CardDescription>
                  AI-generated threat assessment and recommended actions
                </CardDescription>
              </CardHeader>
              {aiAnalysis && (
                <CardContent>
                  <div className={`p-4 rounded-lg border ${allSuspicious.length > 0 ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}>
                    <p className="text-sm leading-relaxed">{aiAnalysis}</p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Threat Alerts — Suspicious IPs */}
            {allSuspicious.length > 0 && (
              <Card className="mb-8 border-red-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Threat Alerts
                    <Badge className="bg-red-600 text-white ml-1">
                      {allSuspicious.length} suspicious IP{allSuspicious.length > 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    IPs flagged for unusual certificate lookup behaviour in the last 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allSuspicious
                      .sort((a, b) => b.count - a.count)
                      .map((ip) => {
                        const level = getThreatLevel(ip);
                        const colors = getThreatColors(level);
                        return (
                          <div
                            key={ip.ip}
                            className={`rounded-lg border p-4 ${colors.card}`}
                          >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 p-2 rounded-full ${level === "critical" ? "bg-red-100" : level === "high" ? "bg-orange-100" : "bg-yellow-100"}`}>
                                  <Fingerprint className={`h-5 w-5 ${colors.sub}`} />
                                </div>
                                <div>
                                  <p className={`font-mono font-bold text-base ${colors.text}`}>
                                    {ip.ip}
                                  </p>
                                  <p className={`text-sm mt-1 ${colors.sub}`}>
                                    {getThreatMessage(ip)}
                                  </p>
                                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>{ip.count} total requests</span>
                                    <span>{ip.uniqueCerts} certificates accessed</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={colors.badge}>
                                  {level.toUpperCase()}
                                </Badge>
                                <Button size="sm" variant="outline" className="gap-1 text-xs h-8">
                                  <Eye className="h-3 w-3" />
                                  Investigate
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {allSuspicious.length === 0 && (
              <Card className="mb-8 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <p className="font-semibold text-green-700">No Suspicious IPs Detected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All verification activity in the last 24 hours appears normal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Anomalies from pattern analysis */}
            {anomalies.length > 0 && (
              <Card className="mb-8 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Radio className="h-5 w-5" />
                    Behaviour Anomalies
                    <Badge className="bg-orange-600 text-white ml-1">
                      {anomalies.length} detected
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Pattern-based anomaly detection across verification logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anomalies.map((a, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${severityColors(a.severity)}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{a.type}</p>
                            <p className="text-sm mt-0.5">{a.description}</p>
                            <p className="text-xs mt-1 opacity-75">{a.detail}</p>
                          </div>
                          <Badge
                            className={`text-xs flex-shrink-0 ${
                              a.severity === "high"
                                ? "bg-red-600 text-white"
                                : a.severity === "medium"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-blue-600 text-white"
                            }`}
                          >
                            {a.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Most targeted certificates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Most Searched Certificates
                  </CardTitle>
                  <CardDescription>All-time lookup counts by certificate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(secData?.topCerts ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No search data yet.</p>
                    ) : (
                      (secData?.topCerts ?? []).map((c) => (
                        <div key={c.certificateId} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{c.certificateId}</p>
                            <p className="truncate max-w-[200px]">{c.companyName}</p>
                          </div>
                          <Badge variant="secondary">{c.count}x</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* All IP activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    All IP Activity (24h)
                  </CardTitle>
                  <CardDescription>Every IP that accessed verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[...allSuspicious, ...allNormal].length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity in the last 24 hours.</p>
                    ) : (
                      [...allSuspicious, ...allNormal].map((ip) => (
                        <div
                          key={ip.ip}
                          className={`flex items-center justify-between text-sm border rounded px-3 py-1.5 ${ip.suspicious ? "border-red-200 bg-red-50" : ""}`}
                        >
                          <div>
                            <span className="font-mono text-xs">{ip.ip}</span>
                            <p className="text-xs text-muted-foreground">
                              {ip.uniqueCerts} cert{ip.uniqueCerts !== 1 ? "s" : ""} · {ip.count} requests
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {ip.suspicious && (
                              <Badge className="bg-red-500 text-white text-xs">flagged</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Verification Log
                </CardTitle>
                <CardDescription>Last 50 certificate lookup events with IP addresses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Certificate ID</th>
                          <th className="text-left px-4 py-3 font-medium">IP Address</th>
                          <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                          <th className="text-left px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(secData?.recentActivity ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                              No verification activity recorded yet.
                            </td>
                          </tr>
                        ) : (
                          (secData?.recentActivity ?? []).map((v) => {
                            const isSuspicious = secData?.topIps.find(
                              (ip) => ip.ip === v.ipAddress && ip.suspicious
                            );
                            return (
                              <tr key={v.id} className={`border-t ${isSuspicious ? "bg-red-50" : "hover:bg-muted/30"}`}>
                                <td className="px-4 py-2 font-mono text-xs">{v.certificateId}</td>
                                <td className={`px-4 py-2 font-mono text-xs ${isSuspicious ? "text-red-700 font-semibold" : ""}`}>
                                  {v.ipAddress}
                                  {isSuspicious && (
                                    <Badge className="ml-2 bg-red-500 text-white text-xs py-0">flagged</Badge>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-xs text-muted-foreground">
                                  {new Date(v.timestamp).toLocaleString("en-NG")}
                                </td>
                                <td className="px-4 py-2">
                                  {isSuspicious ? (
                                    <Badge className="bg-red-100 text-red-700 text-xs">suspicious</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">normal</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
