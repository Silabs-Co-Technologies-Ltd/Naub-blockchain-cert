import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function POST(
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

    const updated = await database.updateCertificate(id, { status: "revoked" });

    return NextResponse.json({ success: true, certificate: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to revoke certificate" },
      { status: 500 }
    );
  }
}
