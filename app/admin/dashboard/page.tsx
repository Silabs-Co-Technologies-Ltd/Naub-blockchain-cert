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

export default function AdminDashboard() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // AI state
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [expiryData, setExpiryData] = useState<ExpiryData | null>(null);
  const [isLoadingExpiry, setIsLoadingExpiry] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isNLSearch, setIsNLSearch] = useState(false);
  const [nlResults, setNlResults] = useState<Certificate[] | null>(null);
  const [nlExplanation, setNlExplanation] = useState("");
  const [isNLSearching, setIsNLSearching] = useState(false);

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

  const handleNLSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsNLSearching(true);
    try {
      const res = await fetch("/api/admin/nl-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setNlResults(data.results || []);
        setNlExplanation(data.explanation || "");
      }
    } catch {
      // silently fail
    } finally {
      setIsNLSearching(false);
    }
  };

  const handleLogout = () => {
    router.push("/admin");
  };

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCertificates =
    isNLSearch && nlResults !== null ? nlResults : filteredCertificates;

  const severityColor = (severity: Anomaly["severity"]) => {
    if (severity === "high") return "text-red-600 bg-red-50 border-red-200";
    if (severity === "medium")
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
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
                  Gemini
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Certificate Renewal Queue
                {totalExpiryAlerts > 0 && (
                  <Badge className="bg-yellow-600 text-white ml-1">
                    {totalExpiryAlerts} need action
                  </Badge>
                )}
              </CardTitle>
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
            </div>
            <CardDescription>
              AI-monitored expiry tracking with renewal recommendations
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

        {/* Security Anomalies */}
        {anomalies.length > 0 && (
          <Card className="mb-8 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                Security Monitoring
                <Badge className="bg-orange-600 text-white ml-1">
                  {anomalies.length} alert{anomalies.length > 1 ? "s" : ""}
                </Badge>
              </CardTitle>
              <CardDescription>
                AI-detected suspicious verification patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anomalies.map((anomaly, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${severityColor(anomaly.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{anomaly.type}</p>
                        <p className="text-sm mt-0.5">{anomaly.description}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {anomaly.detail}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs flex-shrink-0 ${
                          anomaly.severity === "high"
                            ? "bg-red-600 text-white"
                            : anomaly.severity === "medium"
                              ? "bg-yellow-600 text-white"
                              : "bg-blue-600 text-white"
                        }`}
                      >
                        {anomaly.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Certificate Management</CardTitle>
                <CardDescription>
                  View and manage all issued certificates
                </CardDescription>
              </div>
              <Link href="/admin/dashboard/issue">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Issue Certificate
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search with NL Toggle */}
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {isNLSearch ? (
                    <Bot className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <form onSubmit={isNLSearch ? handleNLSearch : (e) => e.preventDefault()}>
                    <input
                      type="text"
                      placeholder={
                        isNLSearch
                          ? 'e.g. "expired cybersecurity certs" or "valid ISP providers"'
                          : "Search by certificate ID or company name..."
                      }
                      className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!isNLSearch) setNlResults(null);
                      }}
                    />
                  </form>
                </div>
                <Button
                  type="button"
                  variant={isNLSearch ? "default" : "outline"}
                  className="gap-2 shrink-0"
                  onClick={() => {
                    setIsNLSearch(!isNLSearch);
                    setNlResults(null);
                    setNlExplanation("");
                    setSearchQuery("");
                  }}
                  title="Toggle AI natural language search"
                >
                  <Brain className="h-4 w-4" />
                  AI Search
                </Button>
                {isNLSearch && (
                  <Button
                    type="button"
                    onClick={handleNLSearch}
                    disabled={isNLSearching || !searchQuery.trim()}
                    className="gap-2 shrink-0"
                  >
                    {isNLSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                )}
              </div>
              {isNLSearch && nlExplanation && (
                <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>{nlExplanation}</span>
                  <span className="text-muted-foreground">
                    — {nlResults?.length ?? 0} result(s)
                  </span>
                </div>
              )}
            </div>

            {/* Certificates Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">
                        Certificate ID
                      </th>
                      <th className="text-left p-4 font-medium">
                        Company Name
                      </th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Issue Date</th>
                      <th className="text-left p-4 font-medium">Expiry Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCertificates.map((cert) => (
                      <tr key={cert.id} className="border-t hover:bg-muted/50">
                        <td className="p-4 font-mono text-sm">{cert.id}</td>
                        <td className="p-4">{cert.companyName}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {cert.category}
                        </td>
                        <td className="p-4 text-sm">
                          {formatDate(cert.dateIssued)}
                        </td>
                        <td className="p-4 text-sm">
                          {formatDate(cert.dateExpiry)}
                        </td>
                        <td className="p-4">
                          <Badge
                            className={getCertificateStatusColor(cert.status)}
                          >
                            {cert.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/dashboard/certificate/${cert.id}`}
                          >
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {displayedCertificates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {isNLSearch && nlResults !== null
                    ? "No certificates match your AI search query"
                    : "No certificates found"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
