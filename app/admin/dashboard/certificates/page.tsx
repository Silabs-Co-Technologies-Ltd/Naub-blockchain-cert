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
  Plus,
  Search,
  Brain,
  Bot,
  Sparkles,
  RefreshCw,
  FileCheck,
  LogOut,
} from "lucide-react";
import { formatDate, getCertificateStatusColor } from "@/lib/certificate-utils";
import type { Certificate } from "@/lib/database";
import { useRouter } from "next/navigation";

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNLSearch, setIsNLSearch] = useState(false);
  const [nlResults, setNlResults] = useState<Certificate[] | null>(null);
  const [nlExplanation, setNlExplanation] = useState("");
  const [isNLSearching, setIsNLSearching] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/certificates");
      if (res.ok) setCertificates(await res.json());
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
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

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayed = isNLSearch && nlResults !== null ? nlResults : filteredCertificates;

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
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-bold text-xl">Certificate Management</h1>
                <p className="text-xs text-muted-foreground">All Issued Certificates</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard/issue">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Issue Certificate
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>All Certificates</CardTitle>
                <CardDescription>
                  {certificates.length} total · {certificates.filter((c) => c.status === "valid").length} valid ·{" "}
                  {certificates.filter((c) => c.status === "expired").length} expired ·{" "}
                  {certificates.filter((c) => c.status === "revoked").length} revoked
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={loadCertificates} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search bar with NL toggle */}
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
                          : "Search by ID, company name, or category..."
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
                  <span className="text-muted-foreground">— {nlResults?.length ?? 0} result(s)</span>
                </div>
              )}
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-medium">Certificate ID</th>
                        <th className="text-left p-4 font-medium">Company Name</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-left p-4 font-medium">Issue Date</th>
                        <th className="text-left p-4 font-medium">Expiry Date</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((cert) => (
                        <tr key={cert.id} className="border-t hover:bg-muted/50">
                          <td className="p-4 font-mono text-sm">{cert.id}</td>
                          <td className="p-4">{cert.companyName}</td>
                          <td className="p-4 text-sm text-muted-foreground">{cert.category}</td>
                          <td className="p-4 text-sm">{formatDate(cert.dateIssued)}</td>
                          <td className="p-4 text-sm">{formatDate(cert.dateExpiry)}</td>
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
            )}

            {!isLoading && displayed.length === 0 && (
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
