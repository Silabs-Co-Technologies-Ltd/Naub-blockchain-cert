"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
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
  ArrowLeft,
  Shield,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  QrCode,
} from "lucide-react";
import { formatDate, getCertificateStatusColor } from "@/lib/certificate-utils";
import type { Certificate } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { CertificateDownload } from "@/components/certificate-download";

export default function CertificateDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (params.id) {
      loadCertificate();
    }
  }, [params.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        setQrCodeDataUrl(canvas.toDataURL("image/png"));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [certificate]);

  const loadCertificate = async () => {
    try {
      const response = await fetch(`/api/certificates/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCertificate(data);
      } else {
        console.error(
          "[v0] Failed to load certificate:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("[v0] Error loading certificate:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (
      !confirm(
        "Are you sure you want to revoke this certificate? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsRevoking(true);
    try {
      const response = await fetch(`/api/certificates/${params.id}/revoke`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Certificate Revoked",
          description: "The certificate has been successfully revoked",
        });
        loadCertificate();
      } else {
        toast({
          title: "Error",
          description: "Failed to revoke certificate",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${certificate?.id}-qr-code.png`;
      link.href = url;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Certificate Not Found</CardTitle>
            <CardDescription>
              The requested certificate could not be found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verificationUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/verify?id=${certificate.id}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-xl">Certificate Details</h1>
              <p className="text-xs text-muted-foreground">{certificate.id}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Banner */}
        <div className="mb-6">
          {certificate.status === "valid" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  Certificate is Valid
                </p>
                <p className="text-sm text-green-700">
                  This certificate is active and verified on the blockchain
                </p>
              </div>
            </div>
          )}
          {certificate.status === "expired" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">
                  Certificate Expired
                </p>
                <p className="text-sm text-yellow-700">
                  This certificate has passed its expiry date
                </p>
              </div>
            </div>
          )}
          {certificate.status === "revoked" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">
                  Certificate Revoked
                </p>
                <p className="text-sm text-red-700">
                  This certificate has been revoked and is no longer valid
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-semibold">{certificate.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Service Category
                </p>
                <p className="font-semibold">{certificate.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{certificate.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{certificate.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-semibold">{certificate.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Information */}
          <Card>
            <CardHeader>
              <CardTitle>Certificate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Certificate ID</p>
                <p className="font-mono font-semibold">{certificate.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={getCertificateStatusColor(certificate.status)}
                >
                  {certificate.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date Issued</p>
                <p className="font-semibold">
                  {formatDate(certificate.dateIssued)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-semibold">
                  {formatDate(certificate.dateExpiry)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Blockchain Verification</CardTitle>
              <CardDescription>
                Immutable record on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Certificate Hash
                </p>
                <p className="font-mono text-sm break-all bg-muted p-2 rounded">
                  {certificate.blockchainHash}
                </p>
              </div>

              {/* Original Certificate Transaction */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Issuance Transaction
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all bg-muted p-2 rounded flex-1">
                    {certificate.transactionHash}
                  </p>
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
                    <p className="text-sm text-muted-foreground">
                      Revocation Transaction
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm break-all bg-red-50 dark:bg-red-950 p-2 rounded flex-1 border border-red-200 dark:border-red-800">
                        {certificate.revocationTxHash}
                      </p>
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
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Verification
              </CardTitle>
              <CardDescription>
                Scan this QR code to instantly verify the certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-4 rounded-lg border-2">
                  <QRCodeGenerator value={verificationUrl} size={200} />
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This QR code links directly to the verification page for
                    this certificate. Anyone can scan it to instantly verify the
                    certificate's authenticity on the blockchain.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadQR}
                      className="gap-2 bg-transparent"
                    >
                      <Download className="h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <CertificateDownload
            certificate={certificate}
            qrCodeDataUrl={qrCodeDataUrl}
          />
          {certificate.status === "valid" && (
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking ? "Revoking..." : "Revoke Certificate"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
