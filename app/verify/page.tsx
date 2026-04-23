"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
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
  Bot,
  Send,
  X,
  MessageSquare,
  Loader2,
  Globe,
} from "lucide-react";
import { formatDate, getCertificateStatusColor } from "@/lib/certificate-utils";
import type { Certificate } from "@/lib/database";
import { QRScanner } from "@/components/qr-scanner";

type Language = "english" | "yoruba" | "hausa" | "igbo";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const LANGUAGE_LABELS: { key: Language; label: string }[] = [
  { key: "english", label: "English" },
  { key: "yoruba", label: "Yoruba" },
  { key: "hausa", label: "Hausa" },
  { key: "igbo", label: "Igbo" },
];

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [certificateId, setCertificateId] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>("english");

  // Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setCertificateId(id);
      verifyById(id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const verifyById = async (id: string) => {
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setCertificate(null);
    setBlockchainInfo(null);
    setShowChatbot(false);
    setChatMessages([]);
    setAiSummary(null);
    setSelectedLang("english");

    try {
      const response = await fetch(`/api/verify/${id}`);

      if (response.ok) {
        const data = await response.json();
        setCertificate(data.certificate);
        setBlockchainInfo(data.blockchain);

        generateAISummary(data.certificate);

        await fetch("/api/verify/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certificateId: id }),
        });
      } else {
        const data = await response.json();
        setError(data.error || "Certificate not found");
      }
    } catch {
      setError("An error occurred while verifying the certificate");
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyById(certificateId);
  };

  const generateAISummary = async (cert: Certificate) => {
    setIsGeneratingSummary(true);
    setAiSummary(null);

    try {
      const response = await fetch("/api/verify/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate: cert }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      }
    } catch {
      // silently fail
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const parsedSummary = (summary: string): Record<Language, string> => {
    const extract = (tag: string, nextTag: string | null) => {
      const regex = nextTag
        ? new RegExp(`${tag}:\\s*([\\s\\S]*?)(?=${nextTag}:|$)`)
        : new RegExp(`${tag}:\\s*([\\s\\S]*?)$`);
      return summary.match(regex)?.[1]?.trim() || "";
    };

    return {
      english: extract("ENGLISH", "YORUBA"),
      yoruba: extract("YORUBA", "HAUSA"),
      hausa: extract("HAUSA", "IGBO"),
      igbo: extract("IGBO", null),
    };
  };

  const handleQRScan = (data: string) => {
    setShowScanner(false);
    try {
      const url = new URL(data);
      const id = url.searchParams.get("id");
      if (id) {
        setCertificateId(id);
        verifyById(id);
      }
    } catch {
      setCertificateId(data);
      verifyById(data);
    }
  };

  const handleOpenChatbot = () => {
    setShowChatbot(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: "assistant",
          content: `Hi! I'm NITDA's renewal assistant. I can help you understand how to renew the certificate for ${certificate?.companyName}. What would you like to know?`,
        },
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !certificate || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/ai/renewal-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          certificate,
          history: chatMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages([
          ...newMessages,
          { role: "assistant", content: "Sorry, I encountered an issue. Please contact support@nitda.gov.ng for renewal assistance." },
        ]);
      }
    } catch {
      setChatMessages([
        ...newMessages,
        { role: "assistant", content: "Service temporarily unavailable. Please contact support@nitda.gov.ng." },
      ]);
    } finally {
      setIsChatLoading(false);
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
              <p className="text-xs text-muted-foreground">Certificate Verification</p>
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
          <h2 className="text-4xl font-bold mb-4 text-balance">Verify Certificate</h2>
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
                {/* 1. Certificate Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vendor Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Company Name</p>
                        <p className="font-semibold text-lg">{certificate.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Service Category</p>
                        <p className="font-semibold">{certificate.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
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
                        <p className="text-sm text-muted-foreground">Certificate ID</p>
                        <p className="font-mono font-semibold">{certificate.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getCertificateStatusColor(certificate.status)}>
                          {certificate.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-semibold">{formatDate(certificate.dateIssued)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                        <p className="font-semibold">{formatDate(certificate.dateExpiry)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 2. Blockchain Verification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Blockchain Verification
                    </CardTitle>
                    <CardDescription>Cryptographic proof of authenticity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Certificate Hash</p>
                      <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                        {certificate.blockchainHash}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Issuance Transaction</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted p-3 rounded font-mono text-sm break-all flex-1">
                          {certificate.transactionHash}
                        </div>
                        <Button variant="outline" size="icon" title="View on blockchain explorer">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Block: {certificate.blockNumber}</p>
                    </div>

                    {certificate.status === "revoked" && certificate.revocationTxHash && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">Revocation Transaction</p>
                        <div className="flex items-center gap-2">
                          <div className="bg-red-50 p-3 rounded font-mono text-sm break-all flex-1 border border-red-200">
                            {certificate.revocationTxHash}
                          </div>
                          <Button variant="outline" size="icon" title="View revocation on blockchain explorer">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Block: {certificate.revocationBlockNumber}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Revoked: {new Date(certificate.revokedAt!).toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                      <p className="text-sm text-primary">
                        <strong>Verified:</strong> This certificate's hash has been verified on the blockchain and matches the official NITDA records.
                        {certificate.status === "revoked" && (
                          <span className="block mt-2 text-red-600">
                            <strong>Revoked:</strong> This certificate has been permanently revoked and recorded on the blockchain.
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Renewal Chatbot (expired or revoked only) */}
                {(certificate.status === "expired" || certificate.status === "revoked") && (
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        Renewal Assistance
                      </CardTitle>
                      <CardDescription>
                        {certificate.status === "expired"
                          ? "This certificate has expired. Chat with our AI assistant to learn how to renew it."
                          : "This certificate has been revoked. Chat with our AI assistant for guidance."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!showChatbot ? (
                        <Button onClick={handleOpenChatbot} className="gap-2 w-full" variant="outline">
                          <MessageSquare className="h-4 w-4" />
                          Chat with Renewal Assistant
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="h-72 overflow-y-auto border rounded-lg p-4 space-y-3 bg-muted/30">
                            {chatMessages.map((msg, i) => (
                              <div
                                key={i}
                                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                              >
                                {msg.role === "assistant" && (
                                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                    <Bot className="h-4 w-4 text-primary" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                                    msg.role === "user"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-card border"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {isChatLoading && (
                              <div className="flex gap-2 justify-start">
                                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="bg-card border rounded-lg px-3 py-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>

                          <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                              placeholder="Ask about renewal requirements, timelines, fees..."
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              disabled={isChatLoading}
                              className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={isChatLoading || !chatInput.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setShowChatbot(false)}
                              title="Close chat"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </form>

                          <p className="text-xs text-muted-foreground">
                            For official guidance, contact{" "}
                            <a href="mailto:support@nitda.gov.ng" className="underline">
                              support@nitda.gov.ng
                            </a>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 4. AI Multilingual Summary — last section, with language tabs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      AI Verification Summary
                    </CardTitle>
                    <CardDescription>
                      Automated certificate analysis — available in 4 languages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Language tab buttons */}
                    <div className="flex gap-1 mb-4 flex-wrap">
                      {LANGUAGE_LABELS.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setSelectedLang(key)}
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            selectedLang === key
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Content */}
                    {isGeneratingSummary ? (
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        <p className="text-muted-foreground">Generating multilingual summary...</p>
                      </div>
                    ) : aiSummary ? (
                      <div
                        className={`p-4 rounded-lg border ${
                          certificate.status === "valid"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : certificate.status === "expired"
                              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                              : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">
                          {parsedSummary(aiSummary)[selectedLang] ||
                            "Translation not available. Please select another language."}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Summary unavailable.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : error ? (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Certificate Not Found</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <p className="text-sm text-muted-foreground">
                      Please check the certificate ID and try again. If you believe this is an error, contact NITDA.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        {/* Info Section (shown before any search) */}
        {!hasSearched && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Blockchain Secured</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every certificate is cryptographically secured and recorded on the blockchain for permanent verification.
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
                  Verify any certificate in seconds with real-time blockchain validation and status checking.
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
                  Certificates cannot be forged or altered, ensuring complete trust in vendor credentials.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}

      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 National Information Technology Development Agency (NITDA)</p>
          <p className="mt-2">For support or inquiries, contact support@nitda.gov.ng</p>
        </div>
      </footer>
    </div>
  );
}
