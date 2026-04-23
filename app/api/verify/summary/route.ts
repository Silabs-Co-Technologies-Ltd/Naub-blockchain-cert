import { NextResponse } from "next/server";
import { deepseekGenerate } from "@/lib/deepseek";

export async function POST(req: Request) {
  try {
    const { certificate } = await req.json();

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate data is required" },
        { status: 400 }
      );
    }

    const prompt = `Generate a professional verification summary for this blockchain certificate in four languages (English, Yoruba, Hausa, and Igbo):

Certificate Details:
- Company: ${certificate.companyName}
- Category: ${certificate.category}
- Issued: ${certificate.dateIssued}
- Expires: ${certificate.dateExpiry}
- Status: ${certificate.status}
- Certificate ID: ${certificate.id}
- Blockchain Verified: ${certificate.blockchainHash ? "Yes" : "No"}

Provide a complete, formal summary in this exact format (each section must be fully complete):
ENGLISH: [Complete summary in English]
YORUBA: [Complete summary in Yoruba]
HAUSA: [Complete summary in Hausa]
IGBO: [Complete summary in Igbo]

Never use asterisks or special formatting characters. Each section must clearly state whether the certificate is valid, expired, or revoked.`;

    try {
      const summary = await deepseekGenerate(prompt, {
        temperature: 0.7,
        maxTokens: 700,
        system:
          "You are a professional certificate verification system for NITDA Nigeria. Generate complete, formal summaries in English, Yoruba, Hausa, and Igbo. Be factual and professional. Never use asterisks or markdown. Respond in the exact format: ENGLISH: [text] YORUBA: [text] HAUSA: [text] IGBO: [text].",
      });

      if (
        summary &&
        summary.includes("ENGLISH:") &&
        summary.includes("YORUBA:") &&
        summary.includes("HAUSA:") &&
        summary.includes("IGBO:")
      ) {
        return NextResponse.json({ summary: summary.trim() });
      }
    } catch (err) {
      console.error("[AI Summary] DeepSeek error:", err);
    }

    return NextResponse.json({ summary: generateFallbackSummary(certificate) });
  } catch (error) {
    console.error("[AI Summary] Error:", error);
    return NextResponse.json(
      { error: "AI summary generation failed" },
      { status: 500 }
    );
  }
}

function generateFallbackSummary(certificate: any): string {
  const { companyName, category, dateIssued, dateExpiry, id: certId } = certificate;

  if (certificate.status === "valid") {
    return `ENGLISH: This certificate issued to ${companyName} for ${category} services has been verified on the blockchain. Certificate ID ${certId} was issued on ${dateIssued} and remains valid until ${dateExpiry}. No revocation or tampering has been detected.

YORUBA: Iwe-ẹri yii ti a fi fun ${companyName} fun iṣẹ ${category} ti jẹrisi lori blockchain. ID iwe-ẹri ${certId} ti fi fun ni ${dateIssued} ati pe o tun dara titi ${dateExpiry}. Ko si iyọkuro tabi iyọkuro ti a rii.

HAUSA: An tabbatar da wannan takardar shaida da aka ba wa ${companyName} don ayyukan ${category} a kan blockchain. An ba da ID takardar shaida ${certId} a ranar ${dateIssued} kuma tana da inganci har zuwa ${dateExpiry}. Ba a gano wani soke ko lalacewa ba.

IGBO: E nyere ${companyName} akwụkwọ ihe akaebe a maka ọrụ ${category} wee gosi na ọ dị mma na blockchain. Akwụkwọ ihe akaebe nwere ID ${certId} e nyere ya na ${dateIssued} na ọ ka dị mma ruo ${dateExpiry}. Achọtaghị mmegharị ọ bụla.`;
  }

  if (certificate.status === "expired") {
    return `ENGLISH: The certificate for ${companyName} (${category} services, ID: ${certId}) expired on ${dateExpiry}. It was valid from ${dateIssued} to ${dateExpiry}. This certificate is no longer current — please contact the vendor or NITDA for renewal.

YORUBA: Iwe-ẹri fun ${companyName} (iṣẹ ${category}, ID: ${certId}) ti pari ni ${dateExpiry}. O ti dara lati ${dateIssued} si ${dateExpiry}. Iwe-ẹri yii ko tun ni akoko — jọwọ kan si olutaja tabi NITDA fun imudan.

HAUSA: Takardar shaida ta ${companyName} (ayyukan ${category}, ID: ${certId}) ta ƙare a ranar ${dateExpiry}. Tana da inganci daga ${dateIssued} zuwa ${dateExpiry}. Wannan takardar shaida ba ta da inganci kuma — da fatan za a tuntuɓi mai sayarwa ko NITDA don sabuntawa.

IGBO: Akwụkwọ ihe akaebe nke ${companyName} (ọrụ ${category}, ID: ${certId}) gwụọ na ${dateExpiry}. Ọ dị mma site na ${dateIssued} ruo ${dateExpiry}. Akwụkwọ ihe akaebe a adịghị arụ ọrụ ugbu a — biko kpọtụrụ onye ahịa ma ọ bụ NITDA maka ọhụụ.`;
  }

  return `ENGLISH: The certificate for ${companyName} (${category}, ID: ${certId}) has been permanently revoked by NITDA. This certificate is no longer valid under any circumstances and has been recorded on the blockchain as revoked.

YORUBA: Iwe-ẹri fun ${companyName} (${category}, ID: ${certId}) ti yọkuro ni gbangba nipasẹ NITDA. Iwe-ẹri yii ko tun dara ni eyikeyi ipo ati pe o ti kọ lori blockchain bi ti yọkuro.

HAUSA: An soke takardar shaida ta ${companyName} (${category}, ID: ${certId}) gaba ɗaya ta NITDA. Wannan takardar shaida ba ta da inganci a kowane yanayi kuma an rubuta ta a kan blockchain a matsayin sokakke.

IGBO: NITDA kagbuola akwụkwọ ihe akaebe nke ${companyName} (${category}, ID: ${certId}) kpamkpam. Akwụkwọ ihe akaebe a adịghị arụ ọrụ n'okwu ọ bụla ma e deedere ya na blockchain dị ka akwụkwọ e kagbuola.`;
}
