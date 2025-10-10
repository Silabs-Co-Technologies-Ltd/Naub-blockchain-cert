import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { blockchain } from "@/lib/blockchain";
import { generateCertificateId } from "@/lib/certificate-utils";
import type { Certificate } from "@/lib/database";

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
    const blockchainRecord = await blockchain.writeCertificateHash(
      certificateData
    );

    // Log blockchain result for debugging
    console.log(`[API] Blockchain result:`, blockchainRecord);

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
    console.error("[v0] Error issuing certificate:", error);
    return NextResponse.json(
      { error: "Failed to issue certificate" },
      { status: 500 }
    );
  }
}
