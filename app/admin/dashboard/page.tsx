"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  FileCheck,
  AlertCircle,
  Clock,
  Search,
  Plus,
  LogOut,
  BarChart3,
  Users,
  Activity,
  ArrowLeft,
  Brain,
  Sparkles,
  AlertTriangle,
  Bot,
  RefreshCw,
  Mail,
  Zap,
  Globe,
  Send,
  CheckCircle,
  Radio,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Certificate } from "@/lib/database";
import { formatDate, getCertificateStatusColor } from "@/lib/certificate-utils";

interface Analytics {
  totalCertificates: number;
  validCertificates: number;
  expiredCertificates: number;
  revokedCertificates: number;
  totalVerifications: number;
  recentVerifications: Array<{
    id: string;
    certificateId: string;
    timestamp: number;
  }>;
}

interface ExpiryAlert extends Certificate {
  daysLeft: number;
}

interface ExpiryData {
  critical: ExpiryAlert[];
  warning: ExpiryAlert[];
  expired: ExpiryAlert[];
  aiSummary: string;
}

interface Anomaly {
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  detail: string;
}

interface SecuritySummary {
  totalSearches: number;
  uniqueIps: number;
  suspiciousCount: number;
}

interface EmailResult {
  sent: number;
  drafts: number;
  failed: number;
  emailConfigured: boolean;
  results: Array<{
    certificateId: string;
    companyName: string;
    email: string;
    daysLeft: number;
    status: "sent" | "draft" | "failed";
    subject: string;
  }>;
  message: string;
}

export default function AdminDashboard() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // AI state
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [expiryData, setExpiryData] = useState<ExpiryData | null>(null);
  const [isLoadingExpiry, setIsLoadingExpiry] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [certsResponse, analyticsResponse] = await Promise.all([
        fetch("/api/certificates"),
        fetch("/api/admin/analytics"),
      ]);

      if (certsResponse.ok) {
        const certsData = await certsResponse.json();
        setCertificates(certsData);
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("[Dashboard] Error loading data:", error);
    } finally {
      setIsLoading(false);
    }

    // Load AI features in parallel, non-blocking
    loadInsights();
    loadExpiryAlerts();
    loadAnomalies();
    loadSecuritySummary();
  };

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch("/api/admin/insights");
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const loadExpiryAlerts = async () => {
    setIsLoadingExpiry(true);
    try {
      const res = await fetch("/api/admin/expiry-alerts");
      if (res.ok) {
        const data = await res.json();
        setExpiryData(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingExpiry(false);
    }
  };

  const loadAnomalies = async () => {
    try {
      const res = await fetch("/api/admin/anomalies");
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      }
    } catch {
      // silently fail
    }
  };

  const loadSecuritySummary = async () => {
    try {
      const res = await fetch("/api/admin/search-activity");
      if (res.ok) {
        const data = await res.json();
        setSecuritySummary({
          totalSearches: data.totalSearches,
          uniqueIps: data.uniqueIps,
          suspiciousCount: data.suspiciousCount,
        });
      }
    } catch {
      // silently fail
    }
  };

  const handleSendExpiryEmails = async () => {
    setIsSendingEmails(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/admin/send-expiry-emails", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEmailResult(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleLogout = () => {
    router.push("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalExpiryAlerts =
    (expiryData?.critical.length ?? 0) +
    (expiryData?.warning.length ?? 0) +
    (expiryData?.expired.length ?? 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-bold text-xl">NITDA Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  Certificate Management System
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Total Certificates
              </CardDescription>
              <CardTitle className="text-3xl">
                {analytics?.totalCertificates || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Valid
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {analytics?.validCertificates || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Expired
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {analytics?.expiredCertificates || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Revoked
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {analytics?.revokedCertificates || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Dashboard Insights
                <Badge
                  variant="secondary"
                  className="text-xs font-normal ml-1"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  DeepSeek
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadInsights}
                disabled={isLoadingInsights}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingInsights ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <CardDescription>
              AI-generated analysis of your certificate portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-5 bg-muted rounded animate-pulse"
                    style={{ width: `${75 + i * 5}%` }}
                  />
                ))}
              </div>
            ) : insights.length > 0 ? (
              <ul className="space-y-3">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No insights available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Total Verifications
              </CardTitle>
              <div className="text-2xl font-bold">
                {analytics?.totalVerifications || 0}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Active Vendors
              </CardTitle>
              <div className="text-2xl font-bold">
                {analytics?.validCertificates || 0}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                System Status
              </CardTitle>
              <div className="text-2xl font-bold text-green-600">
                Operational
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Expiry Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Certificate Renewal Queue
                {totalExpiryAlerts > 0 && (
                  <Badge className="bg-yellow-600 text-white ml-1">
                    {totalExpiryAlerts} need action
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadExpiryAlerts}
                  disabled={isLoadingExpiry}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoadingExpiry ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendExpiryEmails}
                  disabled={isSendingEmails}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSendingEmails ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSendingEmails ? "Sending..." : "Send Renewal Emails"}
                </Button>
              </div>
            </div>
            <CardDescription>
              AI-monitored expiry tracking with renewal recommendations. Use DeepSeek AI to auto-send renewal notices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingExpiry ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ) : expiryData ? (
              <div className="space-y-6">
                {/* AI Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {expiryData.aiSummary}
                    </p>
                  </div>
                </div>

                {totalExpiryAlerts === 0 ? (
                  <p className="text-sm text-green-600 font-medium text-center py-4">
                    All certificates are well within their validity periods. No
                    action required.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Critical */}
                    <div>
                      <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Critical — ≤7 days ({expiryData.critical.length})
                      </h4>
                      <div className="space-y-2">
                        {expiryData.critical.length === 0 ? (
                          <p className="text-xs text-muted-foreground">None</p>
                        ) : (
                          expiryData.critical.map((cert) => (
                            <Link
                              key={cert.id}
                              href={`/admin/dashboard/certificate/${cert.id}`}
                            >
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm hover:bg-red-100 transition-colors cursor-pointer">
                                <p className="font-medium text-red-900 truncate">
                                  {cert.companyName}
                                </p>
                                <p className="text-xs text-red-600">
                                  {cert.daysLeft === 0
                                    ? "Expires today"
                                    : `${cert.daysLeft}d left`}{" "}
                                  · {cert.category}
                                </p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Warning */}
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Warning — ≤30 days ({expiryData.warning.length})
                      </h4>
                      <div className="space-y-2">
                        {expiryData.warning.length === 0 ? (
                          <p className="text-xs text-muted-foreground">None</p>
                        ) : (
                          expiryData.warning.map((cert) => (
                            <Link
                              key={cert.id}
                              href={`/admin/dashboard/certificate/${cert.id}`}
                            >
                              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm hover:bg-yellow-100 transition-colors cursor-pointer">
                                <p className="font-medium text-yellow-900 truncate">
                                  {cert.companyName}
                                </p>
                                <p className="text-xs text-yellow-600">
                                  {cert.daysLeft}d left · {cert.category}
                                </p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Expired */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <FileCheck className="h-4 w-4" />
                        Expired ({expiryData.expired.length})
                      </h4>
                      <div className="space-y-2">
                        {expiryData.expired.length === 0 ? (
                          <p className="text-xs text-muted-foreground">None</p>
                        ) : (
                          expiryData.expired.map((cert) => (
                            <Link
                              key={cert.id}
                              href={`/admin/dashboard/certificate/${cert.id}`}
                            >
                              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm hover:bg-gray-100 transition-colors cursor-pointer">
                                <p className="font-medium text-gray-900 truncate">
                                  {cert.companyName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {Math.abs(cert.daysLeft)}d ago ·{" "}
                                  {cert.category}
                                </p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not load expiry data.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Send Result */}
        {emailResult && (
          <Card className={`mb-8 border-${emailResult.emailConfigured ? (emailResult.failed > 0 ? "red" : "green") : "blue"}-200`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                {emailResult.emailConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Mail className="h-5 w-5 text-blue-600" />
                )}
                {emailResult.message}
              </CardTitle>
            </CardHeader>
            {emailResult.results.length > 0 && (
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {emailResult.results.map((r) => (
                    <div key={r.certificateId} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                      <div>
                        <span className="font-medium">{r.companyName}</span>
                        <span className="text-muted-foreground ml-2">→ {r.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {r.daysLeft <= 0 ? `${Math.abs(r.daysLeft)}d expired` : `${r.daysLeft}d left`}
                        </span>
                        <Badge className={
                          r.status === "sent" ? "bg-green-600 text-white" :
                          r.status === "draft" ? "bg-blue-600 text-white" :
                          "bg-red-600 text-white"
                        }>
                          {r.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {!emailResult.emailConfigured && (
                  <p className="text-xs text-muted-foreground mt-3">
                    To enable actual sending, configure EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in your .env.local file.
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Security Monitor Summary */}
        <Card className={`mb-8 ${((securitySummary?.suspiciousCount ?? 0) + anomalies.length) > 0 ? "border-red-300" : ""}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Security Monitor
                {((securitySummary?.suspiciousCount ?? 0) + anomalies.length) > 0 && (
                  <Badge className="bg-red-600 text-white ml-1 gap-1">
                    <Radio className="h-3 w-3" />
                    {(securitySummary?.suspiciousCount ?? 0) + anomalies.length} alert{((securitySummary?.suspiciousCount ?? 0) + anomalies.length) > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <Link href="/admin/dashboard/security">
                <Button variant="outline" size="sm" className="gap-2">
                  Full Security Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardDescription>IP tracking, threat detection, and verification anomaly alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{securitySummary?.totalSearches ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Verifications</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{securitySummary?.uniqueIps ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique IPs (24h)</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${((securitySummary?.suspiciousCount ?? 0) + anomalies.length) > 0 ? "bg-red-50 border border-red-200" : "bg-muted/50"}`}>
                <p className={`text-2xl font-bold ${((securitySummary?.suspiciousCount ?? 0) + anomalies.length) > 0 ? "text-red-600" : ""}`}>
                  {(securitySummary?.suspiciousCount ?? 0) + anomalies.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Active Alerts</p>
              </div>
            </div>
            {((securitySummary?.suspiciousCount ?? 0) + anomalies.length) > 0 ? (
              <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Suspicious activity detected — open the Security Dashboard to investigate.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                No suspicious activity detected in the last 24 hours.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Certificates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Recent Certificates</CardTitle>
                <CardDescription>5 most recently issued certificates</CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href="/admin/dashboard/issue">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Issue Certificate
                  </Button>
                </Link>
                <Link href="/admin/dashboard/certificates">
                  <Button variant="outline" className="gap-2">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">Certificate ID</th>
                      <th className="text-left p-4 font-medium">Company Name</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Issue Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates
                      .slice()
                      .sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime())
                      .slice(0, 5)
                      .map((cert) => (
                        <tr key={cert.id} className="border-t hover:bg-muted/50">
                          <td className="p-4 font-mono text-sm">{cert.id}</td>
                          <td className="p-4">{cert.companyName}</td>
                          <td className="p-4 text-sm text-muted-foreground">{cert.category}</td>
                          <td className="p-4 text-sm">{formatDate(cert.dateIssued)}</td>
                          <td className="p-4">
                            <Badge className={getCertificateStatusColor(cert.status)}>
                              {cert.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Link href={`/admin/dashboard/certificate/${cert.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {certificates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No certificates issued yet.</p>
              </div>
            )}

            {certificates.length > 5 && (
              <div className="mt-4 text-center">
                <Link href="/admin/dashboard/certificates">
                  <Button variant="outline" className="gap-2">
                    View all {certificates.length} certificates
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
