import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    console.log(`[API] Fetching certificate: ${id}`);

    // Get all certificates to debug
    const allCerts = await database.getAllCertificates();
    console.log(`[API] Total certificates in database: ${allCerts.length}`);
    console.log(
      `[API] Certificate IDs: ${allCerts.map((c) => c.id).join(", ")}`
    );

    const certificate = await database.getCertificate(id);

    if (!certificate) {
      console.log(`[API] Certificate ${id} not found in database`);
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(certificate);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch certificate" },
      { status: 500 }
    );
  }
}
