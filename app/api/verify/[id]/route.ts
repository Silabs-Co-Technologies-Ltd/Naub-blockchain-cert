import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { blockchain } from "@/lib/blockchain";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const certificate = await database.getCertificate(id);

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Verify blockchain hash
    const blockchainRecord = await blockchain.verifyCertificateHash(
      certificate.blockchainHash
    );

    if (!blockchainRecord) {
      return NextResponse.json(
        { error: "Certificate not found on blockchain" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      certificate,
      blockchainVerified: true,
      blockchainRecord,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 }
    );
  }
}
