import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Search, FileCheck, Lock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-xl">NAUB</h1>
              <p className="text-xs text-muted-foreground">Blockchain Certificate System</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/verify">
              <Button variant="ghost">Verify Certificate</Button>
            </Link>
            <Link href="/admin">
              <Button>Admin Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-5xl font-bold text-balance leading-tight">
            Secure Digital Certificates for NAUB Graduates
          </h2>
          <p className="text-xl text-muted-foreground text-balance">
            Blockchain-powered certification system ensuring tamper-proof, instantly verifiable credentials for
            NAUB academic community
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/verify">
              <Button size="lg" className="gap-2">
                <Search className="h-5 w-5" />
                Verify Certificate
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                <Lock className="h-5 w-5" />
                Admin Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Blockchain Security</CardTitle>
              <CardDescription>
                Every certificate is secured with cryptographic hashing and recorded on the blockchain for immutable
                verification
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Search className="h-12 w-12 text-secondary mb-4" />
              <CardTitle>Instant Verification</CardTitle>
              <CardDescription>
                Verify any certificate in seconds using the certificate ID or QR code scan with real-time blockchain
                validation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileCheck className="h-12 w-12 text-chart-3 mb-4" />
              <CardTitle>Tamper-Proof Records</CardTitle>
              <CardDescription>
                Digital certificates cannot be forged or altered, ensuring complete trust and compliance with NAUB
                standards
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">Demo</div>
                <div className="text-primary-foreground/80">Prototype Issuance</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Instant</div>
                <div className="text-primary-foreground/80">Public Verification</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-primary-foreground/80">Tamper Evident</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Nigerian Army University Biu (NAUB)</p>
          <p className="mt-2">Blockchain Certificate System - Securing Academic Credential Trust</p>
        </div>
      </footer>
    </div>
  )
}
