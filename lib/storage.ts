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
  private inMemoryStorage: {
    certificates: Record<string, Certificate>;
    verifications: Verification[];
  } = {
    certificates: {},
    verifications: [],
  };

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
        return this.inMemoryStorage.certificates;
      }
      const data = fs.readFileSync(CERTIFICATES_FILE, "utf8");
      const fileData = JSON.parse(data);
      // Merge with in-memory storage (in-memory takes precedence)
      return { ...fileData, ...this.inMemoryStorage.certificates };
    } catch (error) {
      console.error(
        "[FileStorage] Error reading certificates, using in-memory:",
        error
      );
      return this.inMemoryStorage.certificates;
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
      console.log("[FileStorage] Certificates saved to file successfully");
    } catch (error) {
      console.error("[FileStorage] Error saving certificates to file:", error);
      console.log("[FileStorage] Saving to in-memory storage instead");
    }
    // Always update in-memory storage as backup
    this.inMemoryStorage.certificates = { ...certificates };
  }

  private async getVerificationsData(): Promise<Verification[]> {
    try {
      if (!fs.existsSync(VERIFICATIONS_FILE)) {
        return this.inMemoryStorage.verifications;
      }
      const data = fs.readFileSync(VERIFICATIONS_FILE, "utf8");
      const fileData = JSON.parse(data);
      // Merge with in-memory storage (in-memory takes precedence)
      return [...fileData, ...this.inMemoryStorage.verifications];
    } catch (error) {
      console.error(
        "[FileStorage] Error reading verifications, using in-memory:",
        error
      );
      return this.inMemoryStorage.verifications;
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
      console.log("[FileStorage] Verifications saved to file successfully");
    } catch (error) {
      console.error("[FileStorage] Error saving verifications to file:", error);
      console.log("[FileStorage] Saving to in-memory storage instead");
    }
    // Always update in-memory storage as backup
    this.inMemoryStorage.verifications = [...verifications];
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    const sampleCerts: Certificate[] = [
      {
        id: "NAUB-2024-001",
        companyName: "Amina Yusuf",
        category: "Computer Science",
        dateIssued: "2024-01-15",
        dateExpiry: "2025-01-15",
        status: "valid",
        blockchainHash:
          "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
        transactionHash:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 1234567,
        email: "amina.yusuf@naub.edu.ng",
        phone: "+234-801-234-5678",
        address: "Biu, Borno State, Nigeria",
      },
      {
        id: "NAUB-2024-002",
        companyName: "Ibrahim Musa",
        category: "Cyber Security",
        dateIssued: "2024-02-20",
        dateExpiry: "2025-02-20",
        status: "valid",
        blockchainHash:
          "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        transactionHash:
          "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        blockNumber: 1234890,
        email: "ibrahim.musa@naub.edu.ng",
        phone: "+234-802-345-6789",
        address: "Maiduguri, Borno State, Nigeria",
      },
    ];

    const existingCerts = await this.getCertificates();
    const hasSampleData = Object.keys(existingCerts).length > 0;

    if (!hasSampleData) {
      console.log("[FileStorage] Initializing sample data");
      // Initialize in-memory storage with sample data
      for (const cert of sampleCerts) {
        this.inMemoryStorage.certificates[cert.id] = cert;
      }
      // Try to save to file, but don't fail if it doesn't work
      try {
        await this.saveCertificates(this.inMemoryStorage.certificates);
      } catch (error) {
        console.log("[FileStorage] Sample data initialized in memory only");
      }
    }
  }
}

export const fileStorage = FileStorage.getInstance();
