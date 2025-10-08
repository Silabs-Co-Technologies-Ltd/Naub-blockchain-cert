// Simulated blockchain service for MVP
// In production, this would connect to Ethereum/Polygon/Hyperledger

export interface BlockchainRecord {
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  certificateHash: string;
}

export class BlockchainService {
  private static instance: BlockchainService;
  private blocks: Map<string, BlockchainRecord> = new Map();

  private constructor() {}

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  // Initialize sample blockchain records for existing certificates
  initializeSampleRecords(): void {
    console.log("[Blockchain] Initializing sample records");

    // Sample record 1
    this.blocks.set(
      "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      {
        transactionHash:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 1234567,
        timestamp: new Date("2024-01-15").getTime(),
        certificateHash:
          "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      }
    );

    // Sample record 2
    this.blocks.set(
      "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      {
        transactionHash:
          "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        blockNumber: 1234890,
        timestamp: new Date("2024-02-20").getTime(),
        certificateHash:
          "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      }
    );

    console.log(
      `[Blockchain] Sample records initialized: ${this.blocks.size} total`
    );
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

    this.blocks.set(certificateHash, record);
    console.log(`[Blockchain] Record stored with hash: ${certificateHash}`);

    // Simulate blockchain delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return record;
  }

  // Verify certificate hash exists on blockchain
  async verifyCertificateHash(
    certificateHash: string
  ): Promise<BlockchainRecord | null> {
    console.log(`[Blockchain] Verifying certificate hash: ${certificateHash}`);
    const record = this.blocks.get(certificateHash);
    console.log(`[Blockchain] Record found:`, record ? "Yes" : "No");
    return record || null;
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
