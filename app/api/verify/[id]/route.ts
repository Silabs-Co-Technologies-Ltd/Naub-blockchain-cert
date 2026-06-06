import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { blockchain } from "@/lib/blockchain";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[Verify API] Verifying certificate: ${id}`);
    console.log(`[Verify API] Request URL: ${request.url}`);

    const normalizedHash = id.startsWith("0x") ? id : `0x${id}`;
    const certificateById = await database.getCertificate(id);
    const certificate = certificateById || (await database.getAllCertificates()).find(
      (cert) => cert.blockchainHash === id || cert.blockchainHash === normalizedHash || cert.certificateNumber === id,
    ) || null;

    if (!certificate) {
      console.log(`[Verify API] Certificate not found in database: ${id}`);
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    console.log(
      `[Verify API] Certificate found, blockchain hash: ${certificate.blockchainHash}`
    );

    // Verify blockchain hash
    const blockchainRecord = await blockchain.verifyCertificateHash(
      certificate.blockchainHash
    );

    if (!blockchainRecord) {
      console.log(
        `[Verify API] Blockchain record not found for hash: ${certificate.blockchainHash}`
      );
      return NextResponse.json(
        { error: "Certificate not found on blockchain" },
        { status: 404 }
      );
    }

    console.log(
      `[Verify API] Blockchain verification successful: ${blockchainRecord.transactionHash}`
    );

    // Prepare blockchain verification response
    const blockchainResponse: Record<string, unknown> = {
      status: "verified",
      txHash: blockchainRecord.transactionHash,
      blockNumber: blockchainRecord.blockNumber,
      certificateHash: blockchainRecord.certificateHash,
      timestamp: blockchainRecord.timestamp,
    };

    // Add revocation blockchain info if certificate is revoked
    if (certificate.status === "revoked" && certificate.revocationTxHash) {
      blockchainResponse.revocationTxHash = certificate.revocationTxHash;
      blockchainResponse.revocationBlockNumber =
        certificate.revocationBlockNumber;
      blockchainResponse.revokedAt = certificate.revokedAt;
    }

    return NextResponse.json({
      certificate,
      blockchain: blockchainResponse,
      blockchainVerified: true,
      blockchainRecord,
    });
  } catch (error) {
    console.error(`[Verify API] Error verifying certificate ${id}:`, error);
    return NextResponse.json(
      {
        error: "Failed to verify certificate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
