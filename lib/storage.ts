// Simple file-based storage for development
// In production, this would be replaced with a real database

import fs from "fs";
import path from "path";
import type { Certificate, Verification } from "./database";

const DATA_DIR = path.join(process.cwd(), ".data");
const CERTIFICATES_FILE = path.join(DATA_DIR, "certificates.json");
const VERIFICATIONS_FILE = path.join(DATA_DIR, "verifications.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class FileStorage {
  private static instance: FileStorage;

  private constructor() {}

  static getInstance(): FileStorage {
    if (!FileStorage.instance) {
      FileStorage.instance = new FileStorage();
    }
    return FileStorage.instance;
  }

  // Certificate operations
  async createCertificate(cert: Certificate): Promise<Certificate> {
    console.log(`[FileStorage] Creating certificate: ${cert.id}`);
    const certificates = await this.getCertificates();
    certificates[cert.id] = cert;
    await this.saveCertificates(certificates);
    console.log(`[FileStorage] Certificate saved: ${cert.id}`);
    return cert;
  }

  async getCertificate(id: string): Promise<Certificate | null> {
    console.log(`[FileStorage] Getting certificate: ${id}`);
    const certificates = await this.getCertificates();
    const cert = certificates[id] || null;
    console.log(`[FileStorage] Found certificate: ${cert ? "Yes" : "No"}`);
    return cert;
  }

  async getAllCertificates(): Promise<Certificate[]> {
    const certificates = await this.getCertificates();
    const certs = Object.values(certificates);
    console.log(
      `[FileStorage] Getting all certificates: ${certs.length} total`
    );
    return certs;
  }

  async updateCertificate(
    id: string,
    updates: Partial<Certificate>
  ): Promise<Certificate | null> {
    const certificates = await this.getCertificates();
    const cert = certificates[id];
    if (!cert) return null;

    const updated = { ...cert, ...updates };
    certificates[id] = updated;
    await this.saveCertificates(certificates);
    return updated;
  }

  async deleteCertificate(id: string): Promise<boolean> {
    const certificates = await this.getCertificates();
    if (!certificates[id]) return false;

    delete certificates[id];
    await this.saveCertificates(certificates);
    return true;
  }

  // Verification operations
  async logVerification(verification: Verification): Promise<void> {
    const verifications = await this.getVerificationsData();
    verifications.push(verification);
    await this.saveVerifications(verifications);
  }

  async getVerifications(): Promise<Verification[]> {
    return await this.getVerificationsData();
  }

  // Private helper methods
  private async getCertificates(): Promise<Record<string, Certificate>> {
    try {
      if (!fs.existsSync(CERTIFICATES_FILE)) {
        return {};
      }
      const data = fs.readFileSync(CERTIFICATES_FILE, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("[FileStorage] Error reading certificates:", error);
      return {};
    }
  }

  private async saveCertificates(
    certificates: Record<string, Certificate>
  ): Promise<void> {
    try {
      fs.writeFileSync(
        CERTIFICATES_FILE,
        JSON.stringify(certificates, null, 2)
      );
    } catch (error) {
      console.error("[FileStorage] Error saving certificates:", error);
    }
  }

  private async getVerificationsData(): Promise<Verification[]> {
    try {
      if (!fs.existsSync(VERIFICATIONS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(VERIFICATIONS_FILE, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("[FileStorage] Error reading verifications:", error);
      return [];
    }
  }

  private async saveVerifications(
    verifications: Verification[]
  ): Promise<void> {
    try {
      fs.writeFileSync(
        VERIFICATIONS_FILE,
        JSON.stringify(verifications, null, 2)
      );
    } catch (error) {
      console.error("[FileStorage] Error saving verifications:", error);
    }
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    const sampleCerts: Certificate[] = [
      {
        id: "NITDA-2024-001",
        companyName: "TechVision Solutions Ltd",
        category: "Software Development",
        dateIssued: "2024-01-15",
        dateExpiry: "2025-01-15",
        status: "valid",
        blockchainHash:
          "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
        transactionHash:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 1234567,
        email: "info@techvision.ng",
        phone: "+234-801-234-5678",
        address: "Lagos, Nigeria",
      },
      {
        id: "NITDA-2024-002",
        companyName: "DataSecure Systems",
        category: "Cybersecurity",
        dateIssued: "2024-02-20",
        dateExpiry: "2025-02-20",
        status: "valid",
        blockchainHash:
          "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        transactionHash:
          "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        blockNumber: 1234890,
        email: "contact@datasecure.ng",
        phone: "+234-802-345-6789",
        address: "Abuja, Nigeria",
      },
    ];

    const existingCerts = await this.getCertificates();
    const hasSampleData = Object.keys(existingCerts).length > 0;

    if (!hasSampleData) {
      console.log("[FileStorage] Initializing sample data");
      for (const cert of sampleCerts) {
        await this.createCertificate(cert);
      }
    }
  }
}

export const fileStorage = FileStorage.getInstance();
