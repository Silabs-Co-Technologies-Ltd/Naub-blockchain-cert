// File-based blockchain service for MVP
// In production, this would connect to Ethereum/Polygon/Hyperledger

import fs from "fs";
import path from "path";

export interface BlockchainRecord {
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  certificateHash: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const BLOCKCHAIN_FILE = path.join(DATA_DIR, "blockchain.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class BlockchainService {
  private static instance: BlockchainService;

  private constructor() {}

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  // Initialize sample blockchain records for existing certificates
  initializeSampleRecords(): void {
    const existingRecords = this.getBlockchainRecords();

    // Always ensure we have the sample records and existing certificate records
    let needsUpdate = false;

    // Sample record 1
    if (
      !existingRecords[
        "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"
      ]
    ) {
      existingRecords[
        "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"
      ] = {
        transactionHash:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 1234567,
        timestamp: new Date("2024-01-15").getTime(),
        certificateHash:
          "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      };
      needsUpdate = true;
    }

    // Sample record 2
    if (
      !existingRecords[
        "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab"
      ]
    ) {
      existingRecords[
        "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab"
      ] = {
        transactionHash:
          "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        blockNumber: 1234890,
        timestamp: new Date("2024-02-20").getTime(),
        certificateHash:
          "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      };
      needsUpdate = true;
    }

    // Add missing records for existing certificates
    if (
      !existingRecords[
        "0x000000000000000000000000000000000000000000000000000000006f044ead"
      ]
    ) {
      existingRecords[
        "0x000000000000000000000000000000000000000000000000000000006f044ead"
      ] = {
        transactionHash:
          "0x69b6ebfbd7d532e8476df31e06e72798f9f4d5c5ed94729d0e80205118a2cf0c",
        blockNumber: 1207735,
        timestamp: new Date("2025-10-08").getTime(),
        certificateHash:
          "0x000000000000000000000000000000000000000000000000000000006f044ead",
      };
      needsUpdate = true;
    }

    if (
      !existingRecords[
        "0x000000000000000000000000000000000000000000000000000000000151b7ac"
      ]
    ) {
      existingRecords[
        "0x000000000000000000000000000000000000000000000000000000000151b7ac"
      ] = {
        transactionHash:
          "0x8dd339f06272c911edda77257d73ad83902b325f3f44704551a2aab390254901",
        blockNumber: 1054922,
        timestamp: new Date("2025-10-09").getTime(),
        certificateHash:
          "0x000000000000000000000000000000000000000000000000000000000151b7ac",
      };
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.saveBlockchainRecords(existingRecords);
      console.log(
        `[Blockchain] Records updated: ${
          Object.keys(existingRecords).length
        } total`
      );
    } else {
      console.log(
        `[Blockchain] Records already exist, preserving ${
          Object.keys(existingRecords).length
        } records`
      );
    }
  }

  // Simulate writing certificate hash to blockchain
  async writeCertificateHash(
    certificateData: string
  ): Promise<BlockchainRecord> {
    console.log(
      `[Blockchain] Writing certificate hash for data: ${certificateData.substring(
        0,
        100
      )}...`
    );
    const certificateHash = this.generateHash(certificateData);
    const transactionHash = this.generateTransactionHash();

    const record: BlockchainRecord = {
      transactionHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      timestamp: Date.now(),
      certificateHash,
    };

    // Get existing records and add new one
    const existingRecords = this.getBlockchainRecords();
    console.log(
      `[Blockchain] Existing records before adding: ${
        Object.keys(existingRecords).length
      }`
    );
    existingRecords[certificateHash] = record;
    this.saveBlockchainRecords(existingRecords);

    // Verify the record was saved
    const savedRecords = this.getBlockchainRecords();
    console.log(`[Blockchain] Record stored with hash: ${certificateHash}`);
    console.log(
      `[Blockchain] Total records now: ${Object.keys(savedRecords).length}`
    );
    console.log(
      `[Blockchain] Record saved successfully: ${
        savedRecords[certificateHash] ? "Yes" : "No"
      }`
    );

    // Simulate blockchain delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return record;
  }

  // Verify certificate hash exists on blockchain
  async verifyCertificateHash(
    certificateHash: string
  ): Promise<BlockchainRecord | null> {
    console.log(`[Blockchain] Verifying certificate hash: ${certificateHash}`);
    const records = this.getBlockchainRecords();
    console.log(
      `[Blockchain] Total records available: ${Object.keys(records).length}`
    );
    const record = records[certificateHash] || null;
    console.log(`[Blockchain] Record found:`, record ? "Yes" : "No");
    if (!record) {
      console.log(`[Blockchain] Available hashes:`, Object.keys(records));
    }
    return record;
  }

  // File operations for blockchain records
  private getBlockchainRecords(): Record<string, BlockchainRecord> {
    try {
      if (!fs.existsSync(BLOCKCHAIN_FILE)) {
        return {};
      }
      const data = fs.readFileSync(BLOCKCHAIN_FILE, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("[Blockchain] Error reading blockchain records:", error);
      return {};
    }
  }

  private saveBlockchainRecords(
    records: Record<string, BlockchainRecord>
  ): void {
    try {
      fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(records, null, 2));
    } catch (error) {
      console.error("[Blockchain] Error saving blockchain records:", error);
    }
  }

  // Generate SHA-256-like hash (simplified for MVP)
  private generateHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return "0x" + Math.abs(hash).toString(16).padStart(64, "0");
  }

  private generateTransactionHash(): string {
    return (
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")
    );
  }
}

export const blockchain = BlockchainService.getInstance();
