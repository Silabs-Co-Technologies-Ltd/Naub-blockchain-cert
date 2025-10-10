"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  QrCode,
} from "lucide-react";
import { formatDate, getCertificateStatusColor } from "@/lib/certificate-utils";
import type { Certificate } from "@/lib/database";
import { QRScanner } from "@/components/qr-scanner";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [certificateId, setCertificateId] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setCertificateId(id);
      verifyById(id);
    }
  }, [searchParams]);

  const verifyById = async (id: string) => {
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setCertificate(null);
    setBlockchainInfo(null);

    try {
      const response = await fetch(`/api/verify/${id}`);

      if (response.ok) {
        const data = await response.json();
        setCertificate(data.certificate);
        setBlockchainInfo(data.blockchain);

        // Log verification
        await fetch("/api/verify/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certificateId: id }),
        });
      } else {
        const data = await response.json();
        setError(data.error || "Certificate not found");
      }
    } catch (err) {
      setError("An error occurred while verifying the certificate");
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyById(certificateId);
  };

  const handleQRScan = (data: string) => {
    setShowScanner(false);
    // Extract certificate ID from URL or use data directly
    try {
      const url = new URL(data);
      const id = url.searchParams.get("id");
      if (id) {
        setCertificateId(id);
        verifyById(id);
      }
    } catch {
      // If not a URL, treat as certificate ID
      setCertificateId(data);
      verifyById(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-xl">NITDA</h1>
              <p className="text-xs text-muted-foreground">
                Certificate Verification
              </p>
            </div>
          </Link>
          <Link href="/admin">
            <Button variant="ghost">Admin Login</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Search Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-balance">
            Verify Certificate
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            Enter a certificate ID to verify its authenticity on the blockchain
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Certificate ID (e.g., NITDA-2024-001)"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={isSearching} className="gap-2">
                  <Search className="h-4 w-4" />
                  {isSearching ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="gap-2 bg-transparent"
                >
                  <QrCode className="h-4 w-4" />
                  Scan QR Code
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && !isSearching && (
          <>
            {certificate ? (
              <div className="space-y-6">
                {/* Status Banner */}
                {certificate.status === "valid" && (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 flex items-start gap-4">
                    <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-900 mb-2">
                        Certificate is Valid
                      </h3>
                      <p className="text-green-700">
                        This certificate has been verified on the blockchain and
                        is currently active.
                      </p>
                    </div>
                  </div>
                )}

                {certificate.status === "expired" && (
                  <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6 flex items-start gap-4">
                    <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-yellow-900 mb-2">
                        Certificate Expired
                      </h3>
                      <p className="text-yellow-700">
                        This certificate was valid but has now expired. Please
                        contact the vendor for renewal.
                      </p>
                    </div>
                  </div>
                )}

                {certificate.status === "revoked" && (
                  <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 flex items-start gap-4">
                    <XCircle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-red-900 mb-2">
                        Certificate Revoked
                      </h3>
                      <p className="text-red-700">
                        This certificate has been revoked by NITDA and is no
                        longer valid. Do not trust this certificate.
                      </p>
                    </div>
                  </div>
                )}

                {/* Certificate Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vendor Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Company Name
                        </p>
                        <p className="font-semibold text-lg">
                          {certificate.companyName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Service Category
                        </p>
                        <p className="font-semibold">{certificate.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Location
                        </p>
                        <p className="font-semibold">{certificate.address}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Certificate Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Certificate ID
                        </p>
                        <p className="font-mono font-semibold">
                          {certificate.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          className={getCertificateStatusColor(
                            certificate.status
                          )}
                        >
                          {certificate.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Issue Date
                        </p>
                        <p className="font-semibold">
                          {formatDate(certificate.dateIssued)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Expiry Date
                        </p>
                        <p className="font-semibold">
                          {formatDate(certificate.dateExpiry)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Blockchain Verification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Blockchain Verification
                    </CardTitle>
                    <CardDescription>
                      Cryptographic proof of authenticity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Certificate Hash
                      </p>
                      <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                        {certificate.blockchainHash}
                      </div>
                    </div>

                    {/* Original Certificate Transaction */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Issuance Transaction
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted p-3 rounded font-mono text-sm break-all flex-1">
                          {certificate.transactionHash}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          title="View on blockchain explorer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Block: {certificate.blockNumber}
                      </p>
                    </div>

                    {/* Revocation Transaction (if revoked) */}
                    {certificate.status === "revoked" &&
                      certificate.revocationTxHash && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Revocation Transaction
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="bg-red-50 p-3 rounded font-mono text-sm break-all flex-1 border border-red-200 dark:border-red-800">
                              {certificate.revocationTxHash}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              title="View revocation on blockchain explorer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Block: {certificate.revocationBlockNumber}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Revoked:{" "}
                            {new Date(certificate.revokedAt!).toLocaleString()}
                          </p>
                        </div>
                      )}

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                      <p className="text-sm text-primary">
                        <strong>Verified:</strong> This certificate's hash has
                        been verified on the blockchain and matches the official
                        NITDA records.
                        {certificate.status === "revoked" && (
                          <span className="block mt-2 text-red-600 dark:text-red-400">
                            <strong>Revoked:</strong> This certificate has been
                            permanently revoked and recorded on the blockchain.
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : error ? (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">
                      Certificate Not Found
                    </h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <p className="text-sm text-muted-foreground">
                      Please check the certificate ID and try again. If you
                      believe this is an error, contact NITDA.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        {/* Info Section */}
        {!hasSearched && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Blockchain Secured</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every certificate is cryptographically secured and recorded on
                  the blockchain for permanent verification.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle className="text-lg">Instant Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Verify any certificate in seconds with real-time blockchain
                  validation and status checking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <AlertCircle className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Tamper-Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Certificates cannot be forged or altered, ensuring complete
                  trust in vendor credentials.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            © 2025 National Information Technology Development Agency (NITDA)
          </p>
          <p className="mt-2">
            For support or inquiries, contact support@nitda.gov.ng
          </p>
        </div>
      </footer>
    </div>
  );
}
