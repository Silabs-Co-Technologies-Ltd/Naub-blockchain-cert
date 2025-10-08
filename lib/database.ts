// Database service that uses file storage for persistence
// In production, this would use PostgreSQL/MongoDB

export interface Certificate {
  id: string;
  companyName: string;
  category: string;
  dateIssued: string;
  dateExpiry: string;
  status: "valid" | "expired" | "revoked";
  blockchainHash: string;
  transactionHash: string;
  blockNumber: number;
  email: string;
  phone: string;
  address: string;
}

export interface Verification {
  id: string;
  certificateId: string;
  timestamp: number;
  ipAddress: string;
}

class DatabaseService {
  private static instance: DatabaseService;
  private fileStorage: any;
  private adminCredentials = {
    username: "admin@nitda.gov.ng",
    password: "admin123", // In production, use proper hashing
  };

  private constructor() {
    // Initialize file storage
    this.initializeStorage();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async initializeStorage() {
    const { fileStorage } = await import("./storage");
    this.fileStorage = fileStorage;
    await this.fileStorage.initializeSampleData();
  }

  // Certificate operations
  async createCertificate(cert: Certificate): Promise<Certificate> {
    console.log(`[Database] Creating certificate: ${cert.id}`);
    return await this.fileStorage.createCertificate(cert);
  }

  async getCertificate(id: string): Promise<Certificate | null> {
    console.log(`[Database] Getting certificate: ${id}`);
    return await this.fileStorage.getCertificate(id);
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return await this.fileStorage.getAllCertificates();
  }

  async updateCertificate(
    id: string,
    updates: Partial<Certificate>
  ): Promise<Certificate | null> {
    return await this.fileStorage.updateCertificate(id, updates);
  }

  async deleteCertificate(id: string): Promise<boolean> {
    return await this.fileStorage.deleteCertificate(id);
  }

  // Verification operations
  async logVerification(verification: Verification): Promise<void> {
    return await this.fileStorage.logVerification(verification);
  }

  async getVerifications(): Promise<Verification[]> {
    return await this.fileStorage.getVerifications();
  }

  // Admin authentication
  async verifyAdmin(username: string, password: string): Promise<boolean> {
    return (
      username === this.adminCredentials.username &&
      password === this.adminCredentials.password
    );
  }

  // Analytics
  async getAnalytics() {
    const certs = await this.getAllCertificates();
    const verifications = await this.getVerifications();
    return {
      totalCertificates: certs.length,
      validCertificates: certs.filter((c) => c.status === "valid").length,
      expiredCertificates: certs.filter((c) => c.status === "expired").length,
      revokedCertificates: certs.filter((c) => c.status === "revoked").length,
      totalVerifications: verifications.length,
      recentVerifications: verifications.slice(-10).reverse(),
    };
  }
}

export const database = DatabaseService.getInstance();
