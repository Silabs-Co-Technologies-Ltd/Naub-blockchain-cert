import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { blockchain } from "@/lib/blockchain";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[Revoke API] Revoking certificate: ${id}`);

    const certificate = await database.getCertificate(id);

    if (!certificate) {
      console.log(`[Revoke API] Certificate not found: ${id}`);
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Create revocation data for blockchain
    const revocationData = JSON.stringify({
      action: "REVOKE",
      certificateId: id,
      originalHash: certificate.blockchainHash,
      revokedAt: new Date().toISOString(),
      reason: "Certificate revoked by NAUB",
    });

    console.log(`[Revoke API] Recording revocation on blockchain for: ${id}`);

    // Record revocation on blockchain
    const blockchainRecord = await blockchain.writeCertificateHash(
      revocationData
    );

    console.log(
      `[Revoke API] Blockchain revocation recorded: ${blockchainRecord.transactionHash}`
    );

    // Update certificate status and add revocation blockchain record
    const updated = await database.updateCertificate(id, {
      status: "revoked",
      revocationTxHash: blockchainRecord.transactionHash,
      revocationBlockNumber: blockchainRecord.blockNumber,
      revokedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      certificate: updated,
      blockchain: {
        revocationTxHash: blockchainRecord.transactionHash,
        revocationBlockNumber: blockchainRecord.blockNumber,
      },
    });
  } catch (error) {
    console.error(`[Revoke API] Error revoking certificate ${id}:`, error);
    return NextResponse.json(
      {
        error: "Failed to revoke certificate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
