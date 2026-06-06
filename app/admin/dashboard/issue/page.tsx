"use client";

import type React from "react";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Shield,
  Loader2,
  Brain,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { certificateCategories } from "@/lib/certificate-utils";
import { Badge } from "@/components/ui/badge";

interface ReviewResult {
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  recommendation: string;
}

export default function IssueCertificatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    category: "",
    email: "",
    phone: "",
    address: "",
    validityYears: "1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Certificate Issued Successfully",
          description: `Certificate ID: ${data.certificate.id}`,
        });
        setTimeout(() => {
          router.push(`/admin/dashboard/certificate/${data.certificate.id}`);
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to issue certificate",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while issuing the certificate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear review result when form changes
    if (reviewResult) setReviewResult(null);
  };

  const handleReview = async () => {
    if (
      !formData.companyName ||
      !formData.category ||
      !formData.email ||
      !formData.phone ||
      !formData.address
    ) {
      toast({
        title: "Incomplete Form",
        description: "Fill in all fields before running the AI review.",
        variant: "destructive",
      });
      return;
    }

    setIsReviewing(true);
    setReviewResult(null);

    try {
      const res = await fetch("/api/ai/review-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setReviewResult(data);
      } else {
        toast({
          title: "Review Failed",
          description: "Could not complete AI review. You can still proceed.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Review Error",
        description: "AI review service unavailable. You can still proceed.",
        variant: "destructive",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const riskConfig = {
    low: {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      color: "bg-green-50 border-green-200 text-green-800",
      badge: "bg-green-600",
      label: "Low Risk",
    },
    medium: {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      badge: "bg-yellow-600",
      label: "Medium Risk",
    },
    high: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      color: "bg-red-50 border-red-200 text-red-800",
      badge: "bg-red-600",
      label: "High Risk",
    },
  };

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
              <h1 className="font-bold text-xl">Issue New Certificate</h1>
              <p className="text-xs text-muted-foreground">
                Issue and anchor a NAUB academic certificate
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Details</CardTitle>
            <CardDescription>
              Enter the certificate holder information to generate a blockchain-secured
              certificate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student / Graduate Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Student / Graduate Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Student / Graduate Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Amina Yusuf"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleChange("companyName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Programme / Department <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a programme or department" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificateCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student.name@naub.edu.ng"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+234-XXX-XXX-XXXX"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Contact Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter student or alumni contact address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    required
                    rows={3}
                  />
                </div>
              </div>

              {/* Certificate Validity */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Certificate Validity</h3>

                <div className="space-y-2">
                  <Label htmlFor="validityYears">
                    Validity Period <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.validityYears}
                    onValueChange={(value) =>
                      handleChange("validityYears", value)
                    }
                    required
                  >
                    <SelectTrigger id="validityYears">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Year</SelectItem>
                      <SelectItem value="2">2 Years</SelectItem>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Review Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Application Review
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Gemini
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReview}
                  disabled={isReviewing}
                  className="w-full gap-2"
                >
                  {isReviewing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reviewing application...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Review Application with AI
                    </>
                  )}
                </Button>

                {reviewResult && (
                  <div
                    className={`p-4 rounded-lg border ${riskConfig[reviewResult.riskLevel].color}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {riskConfig[reviewResult.riskLevel].icon}
                      <span className="font-semibold">
                        {riskConfig[reviewResult.riskLevel].label}
                      </span>
                      <Badge
                        className={`${riskConfig[reviewResult.riskLevel].badge} text-white text-xs ml-auto`}
                      >
                        {reviewResult.riskLevel.toUpperCase()}
                      </Badge>
                    </div>

                    {reviewResult.flags.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">
                          Flags detected:
                        </p>
                        <ul className="text-sm space-y-1">
                          {reviewResult.flags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="mt-1">•</span>
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-sm">
                      <span className="font-medium">Recommendation:</span>{" "}
                      {reviewResult.recommendation}
                    </p>
                  </div>
                )}
              </div>

              {/* Blockchain Notice */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Upon submission, this certificate will
                  be cryptographically hashed and recorded on the blockchain.
                  This process ensures the certificate is tamper-proof and
                  permanently verifiable.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Issuing Certificate...
                    </>
                  ) : (
                    "Issue Certificate"
                  )}
                </Button>
                <Link href="/admin/dashboard" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
