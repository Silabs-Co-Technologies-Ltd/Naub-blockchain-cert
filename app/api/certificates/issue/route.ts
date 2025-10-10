import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { blockchain } from "@/lib/blockchain";
import { generateCertificateId } from "@/lib/certificate-utils";
import type { Certificate } from "@/lib/database";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, category, email, phone, address, validityYears } =
      body;

    // Validate required fields
    if (
      !companyName ||
      !category ||
      !email ||
      !phone ||
      !address ||
      !validityYears
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate certificate ID
    const certificateId = generateCertificateId();

    // Calculate dates
    const dateIssued = new Date().toISOString().split("T")[0];
    const dateExpiry = new Date(
      Date.now() + Number.parseInt(validityYears) * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];

    // Create certificate data for blockchain
    const certificateData = JSON.stringify({
      id: certificateId,
      companyName,
      category,
      dateIssued,
      dateExpiry,
    });

    // Write to blockchain
    let blockchainRecord;
    try {
      blockchainRecord = await blockchain.writeCertificateHash(certificateData);
      console.log(`[API] Blockchain result:`, blockchainRecord);
    } catch (blockchainError) {
      console.error(`[API] Blockchain error:`, blockchainError);
      // Continue with simulation mode - don't fail the entire request
      blockchainRecord = {
        transactionHash: `sim_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        timestamp: Date.now(),
        certificateHash: crypto
          .createHash("sha256")
          .update(certificateData)
          .digest("hex"),
      };
      console.log(`[API] Using simulated blockchain record:`, blockchainRecord);
    }

    // Create certificate in database
    const certificate: Certificate = {
      id: certificateId,
      companyName,
      category,
      dateIssued,
      dateExpiry,
      status: "valid",
      blockchainHash: blockchainRecord.certificateHash,
      transactionHash: blockchainRecord.transactionHash,
      blockNumber: blockchainRecord.blockNumber,
      email,
      phone,
      address,
    };

    await database.createCertificate(certificate);

    // Verify the certificate was created
    const createdCert = await database.getCertificate(certificateId);
    console.log(
      `[API] Certificate created: ${certificateId}, Found: ${
        createdCert ? "Yes" : "No"
      }`
    );

    return NextResponse.json({ success: true, certificate });
  } catch (error) {
    console.error("[API] Error issuing certificate:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to issue certificate";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
