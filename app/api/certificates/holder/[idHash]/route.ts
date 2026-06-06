import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ idHash: string }> },
) {
  const { idHash } = await params;
  const certificates = await database.getAllCertificates();
  const holderCertificates = certificates
    .filter((certificate) => certificate.holderIdentityHash === idHash)
    .map((certificate) => ({
      id: certificate.id,
      companyName: certificate.companyName,
      category: certificate.category,
      classOfDegree: certificate.classOfDegree,
      dateOfAward: certificate.dateOfAward,
      status: certificate.status,
      blockchainHash: certificate.blockchainHash,
      ipfsCid: certificate.ipfsCid,
      certificateNumber: certificate.certificateNumber,
    }));

  return NextResponse.json({ certificates: holderCertificates });
}
