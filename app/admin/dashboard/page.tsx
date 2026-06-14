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
  Plus,
  LogOut,
  BarChart3,
  Users,
  Activity,
  ArrowLeft,
  AlertTriangle,
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

export default function AdminDashboard() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [anomalies, setAnomalies] = useState<
    Array<{ type: string; severity: string; description: string }>
  >([]);
  const [securitySummary, setSecuritySummary] = useState<{
    totalSearches: number;
    uniqueIps: number;
    suspiciousCount: number;
  } | null>(null);

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

    loadAnomalies();
    loadSecuritySummary();
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
                <h1 className="font-bold text-xl">NAUB Admin Dashboard</h1>
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
        <div className="grid md:grid-cols-3 gap-4 mb-8">
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
                <AlertCircle className="h-4 w-4 text-red-600" />
                Revoked
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {analytics?.revokedCertificates || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Security Monitor Summary */}
        <Card
          className={`mb-8 ${(securitySummary?.suspiciousCount ?? 0) + anomalies.length > 0 ? "border-red-300" : ""}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Security Monitor
                {(securitySummary?.suspiciousCount ?? 0) + anomalies.length >
                  0 && (
                  <Badge className="bg-red-600 text-white ml-1 gap-1">
                    <Radio className="h-3 w-3" />
                    {(securitySummary?.suspiciousCount ?? 0) +
                      anomalies.length}{" "}
                    alert
                    {(securitySummary?.suspiciousCount ?? 0) +
                      anomalies.length >
                    1
                      ? "s"
                      : ""}
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
            <CardDescription>
              IP tracking, threat detection, and verification anomaly alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {securitySummary?.totalSearches ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Verifications
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {securitySummary?.uniqueIps ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique IPs (24h)
                </p>
              </div>
              <div
                className={`text-center p-3 rounded-lg ${(securitySummary?.suspiciousCount ?? 0) + anomalies.length > 0 ? "bg-red-50 border border-red-200" : "bg-muted/50"}`}
              >
                <p
                  className={`text-2xl font-bold ${(securitySummary?.suspiciousCount ?? 0) + anomalies.length > 0 ? "text-red-600" : ""}`}
                >
                  {(securitySummary?.suspiciousCount ?? 0) + anomalies.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Alerts
                </p>
              </div>
            </div>
            {(securitySummary?.suspiciousCount ?? 0) + anomalies.length > 0 ? (
              <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Suspicious activity detected — open the Security Dashboard to
                investigate.
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
                <CardDescription>
                  5 most recently issued certificates
                </CardDescription>
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
                      <th className="text-left p-4 font-medium">
                        Certificate ID
                      </th>
                      <th className="text-left p-4 font-medium">
                        Student / Graduate Name
                      </th>
                      <th className="text-left p-4 font-medium">
                        Programme / Department
                      </th>
                      <th className="text-left p-4 font-medium">Issue Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.dateIssued).getTime() -
                          new Date(a.dateIssued).getTime(),
                      )
                      .slice(0, 5)
                      .map((cert) => (
                        <tr
                          key={cert.id}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="p-4 font-mono text-sm">{cert.id}</td>
                          <td className="p-4">{cert.companyName}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {cert.category}
                          </td>
                          <td className="p-4 text-sm">
                            {formatDate(cert.dateIssued)}
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
