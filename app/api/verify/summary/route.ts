import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { certificate } = await req.json();

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate data is required" },
        { status: 400 }
      );
    }

    // Build context for the AI prompt
    const prompt = `Generate a professional verification summary for this blockchain certificate in three languages (English, Yoruba, and Hausa):

Certificate Details:
- Company: ${certificate.companyName}
- Category: ${certificate.category}
- Issued: ${certificate.dateIssued}
- Expires: ${certificate.dateExpiry}
- Status: ${certificate.status}
- Certificate ID: ${certificate.id}
- Blockchain Verified: ${certificate.blockchainHash ? "Yes" : "No"}

Please provide a complete, formal summary in the following format:
ENGLISH: [Complete summary in English]
YORUBA: [Complete summary in Yoruba]
HAUSA: [Complete summary in Hausa]

IMPORTANT: Each language section must be complete and fully finished. Do not truncate any response. Make sure each summary confirms the certificate's validity and authenticity without using any asterisks or special formatting characters.`;

    console.log(
      "[AI Summary] Generating summary for certificate:",
      certificate.id
    );

    // Check if Google Gemini API key is available
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.log(
        "[AI Summary] No Google Gemini API key, generating enhanced template summary"
      );
      const enhancedSummary = generateEnhancedSummary(certificate);
      return NextResponse.json({ summary: enhancedSummary });
    }

    try {
      console.log("[AI Summary] Using Google Gemini API");

      // Initialize Google Gemini AI
      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      // Generate content using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a professional certificate verification system. Generate complete, formal summaries in English, Yoruba, and Hausa that clearly communicate certificate status and authenticity. Always be factual and professional in tone. Never use asterisks (*) or any special formatting characters. Always respond in the exact format: ENGLISH: [complete text] YORUBA: [complete text] HAUSA: [complete text]. CRITICAL: Never truncate or cut off any response - each language section must be fully complete.",
          temperature: 0.7,
          maxOutputTokens: 500,
          thinkingConfig: {
            thinkingBudget: 0, // Disable thinking for faster response
          },
        },
      });

      const summary = response.text;

      if (summary && summary.trim()) {
        // Check if all three languages are present and complete
        const hasEnglish = summary.includes("ENGLISH:");
        const hasYoruba = summary.includes("YORUBA:");
        const hasHausa = summary.includes("HAUSA:");

        // Check if response seems truncated (ends abruptly)
        const isComplete =
          !summary.trim().endsWith("...") &&
          !summary.trim().endsWith("...") &&
          summary.trim().length > 100; // Minimum expected length

        if (hasEnglish && hasYoruba && hasHausa && isComplete) {
          console.log(
            "[AI Summary] Generated complete multilingual summary using Gemini:",
            summary
          );
          return NextResponse.json({ summary: summary.trim() });
        } else {
          console.warn(
            "[AI Summary] Gemini response appears incomplete, falling back to templates"
          );
          throw new Error("Gemini response incomplete");
        }
      } else {
        throw new Error("Gemini returned empty response");
      }
    } catch (apiError) {
      console.error("[AI Summary] Gemini API error:", apiError);
      console.log("[AI Summary] Falling back to enhanced template summary");
      const enhancedSummary = generateEnhancedSummary(certificate);
      return NextResponse.json({ summary: enhancedSummary });
    }
  } catch (error) {
    console.error("[AI Summary] Error generating summary:", error);
    return NextResponse.json(
      { error: "AI summary generation failed" },
      { status: 500 }
    );
  }
}

function generateEnhancedSummary(certificate: any): string {
  const companyName = certificate.companyName;
  const category = certificate.category;
  const dateIssued = certificate.dateIssued;
  const dateExpiry = certificate.dateExpiry;
  const blockchainVerified = certificate.blockchainHash
    ? "blockchain-verified"
    : "database-stored";
  const certificateId = certificate.id;

  const validSummaries = [
    `ENGLISH: This certificate, issued to ${companyName} under the ${category} category, has been validated successfully on the blockchain. It remains valid until ${dateExpiry} and shows no signs of revocation or tampering. The certificate was issued on ${dateIssued} and is currently active with Certificate ID ${certificateId}.

YORUBA: Iwe-ẹri yii, ti a fi fun ${companyName} labẹ ẹka ${category}, ti jẹrisi ni aaye lori blockchain. O tun dara titi ${dateExpiry} ati pe ko fi ami ti iyọkuro tabi iyọkuro han. Iwe-ẹri naa ti fi fun ni ${dateIssued} ati pe o wa ni aaye lọwọlọwọ pẹlu ID iwe-ẹri ${certificateId}.

HAUSA: Wannan takardar shaida, wacce aka ba wa ${companyName} a ƙarƙashin rukunin ${category}, an tabbatar da ita a kan blockchain. Tana da inganci har zuwa ${dateExpiry} kuma ba ta nuna alamun soke ko lalata ba. An ba da takardar shaida a ranar ${dateIssued} kuma tana aiki a halin yanzu tare da ID na takardar shaida ${certificateId}.`,

    `ENGLISH: Certificate verification successful: ${companyName} has been certified for ${category} services. This ${blockchainVerified} certificate (${certificateId}) was issued on ${dateIssued} and remains valid until ${dateExpiry}. No security issues detected.

YORUBA: Iwadii iwe-ẹri ti aṣeyọri: ${companyName} ti gba iwe-ẹri fun iṣẹ ${category}. Iwe-ẹri ${blockchainVerified} yii (${certificateId}) ti fi fun ni ${dateIssued} ati pe o tun dara titi ${dateExpiry}. Ko si awọn iṣoro aabo ti a rii.

HAUSA: Tabbatar da takardar shaida nasara: ${companyName} an ba da takardar shaida don ayyukan ${category}. Wannan takardar shaida ta ${blockchainVerified} (${certificateId}) an ba da ita a ranar ${dateIssued} kuma tana da inganci har zuwa ${dateExpiry}. Ba a gano wasu matsalolin tsaro ba.`,

    `ENGLISH: Verified authentic certificate for ${companyName} in the ${category} domain. Issued ${dateIssued}, valid through ${dateExpiry}. Blockchain verification confirms authenticity with no tampering detected. Certificate ID: ${certificateId}.

YORUBA: Iwe-ẹri otitọ ti a jẹrisi fun ${companyName} ni agbegbe ${category}. Ti fi fun ni ${dateIssued}, o dara titi ${dateExpiry}. Iwadii blockchain ṣe jẹrisi otitọ pẹlu ko si iyọkuro ti a rii. ID Iwe-ẹri: ${certificateId}.

HAUSA: Takardar shaida ta gaskiya wacce aka tabbatar da ita don ${companyName} a cikin yankin ${category}. An ba da ita a ranar ${dateIssued}, tana da inganci har zuwa ${dateExpiry}. Tabbatar da blockchain ya tabbatar da sahihancin ta ba tare da gano wasu lalacewa ba. ID Takardar shaida: ${certificateId}.`,
  ];

  const expiredSummaries = [
    `ENGLISH: This certificate, issued to ${companyName} under the ${category} category, was previously valid but has now expired as of ${dateExpiry}. While the certificate was verified on the blockchain during its active period, it is no longer current and should not be trusted for new transactions. Please contact the vendor for renewal.

YORUBA: Iwe-ẹri yii, ti a fi fun ${companyName} labẹ ẹka ${category}, ti dara ṣugbọn ti o ti pari ni ${dateExpiry}. Botilẹjẹpe iwe-ẹri naa ti jẹrisi lori blockchain nigba akoko rẹ ti o dara, ko tun ni akoko lọwọlọwọ ati ki a ma se gbẹkẹle fun awọn iṣowo tuntun. Jọwọ kan si olutaja fun imudan.

HAUSA: Wannan takardar shaida, wacce aka ba wa ${companyName} a ƙarƙashin rukunin ${category}, ta kasance da inganci a baya amma yanzu ta ƙare a ranar ${dateExpiry}. Duk da yake an tabbatar da takardar shaida a kan blockchain a lokacin da take aiki, ba ta da inganci a halin yanzu kuma kada a amince da ita don sabbin ma'amaloli. Da fatan za a tuntuɓi mai sayarwa don sabuntawa.`,

    `ENGLISH: Certificate expired: ${companyName}'s ${category} certification (${certificateId}) was valid from ${dateIssued} to ${dateExpiry} but has now expired. The certificate was ${blockchainVerified} during its active period. Contact the vendor for renewal.

YORUBA: Iwe-ẹri ti pari: Iwe-ẹri ${category} ti ${companyName} (${certificateId}) ti dara lati ${dateIssued} si ${dateExpiry} ṣugbọn ti o ti pari. Iwe-ẹri naa ti jẹ ${blockchainVerified} nigba akoko rẹ ti o dara. Kan si olutaja fun imudan.

HAUSA: Takardar shaida ta ƙare: Takardar shaida ta ${category} ta ${companyName} (${certificateId}) tana da inganci daga ${dateIssued} zuwa ${dateExpiry} amma yanzu ta ƙare. Takardar shaida ta kasance ${blockchainVerified} a lokacin da take aiki. Tuntuɓi mai sayarwa don sabuntawa.`,

    `ENGLISH: Expired certification detected for ${companyName} in ${category} services. Original validity period: ${dateIssued} to ${dateExpiry}. Certificate ID ${certificateId} is no longer active. Please request updated certification.

YORUBA: Iwe-ẹri ti pari ti a rii fun ${companyName} ni iṣẹ ${category}. Akoko ti o dara ti akọkọ: ${dateIssued} si ${dateExpiry}. ID Iwe-ẹri ${certificateId} ko tun ni aaye. Jọwọ beere fun iwe-ẹri imudan.

HAUSA: An gano takardar shaida ta ƙare don ${companyName} a cikin ayyukan ${category}. Lokacin inganci na asali: ${dateIssued} zuwa ${dateExpiry}. ID Takardar shaida ${certificateId} ba ta da aiki kuma. Da fatan za a nemi sabuwar takardar shaida.`,
  ];

  const revokedSummaries = [
    `ENGLISH: This certificate, issued to ${companyName} under the ${category} category, has been permanently revoked by NITDA. The revocation has been recorded on the blockchain and this certificate is no longer valid. Do not trust this certificate for any purpose as it has been officially invalidated. Certificate ID ${certificateId} was issued on ${dateIssued} but is now permanently revoked.

YORUBA: Iwe-ẹri yii, ti a fi fun ${companyName} labẹ ẹka ${category}, ti yọkuro ni gbangba nipasẹ NITDA. Iyọkuro naa ti kọ lori blockchain ati pe iwe-ẹri yii ko tun dara. Ma se gbẹkẹle iwe-ẹri yii fun eyikeyi idi bi o ti yọkuro ni ofin. ID iwe-ẹri ${certificateId} ti fi fun ni ${dateIssued} ṣugbọn o ti yọkuro ni gbangba lọwọlọwọ.

HAUSA: Wannan takardar shaida, wacce aka ba wa ${companyName} a ƙarƙashin rukunin ${category}, an soke ta gaba ɗaya ta NITDA. An rubuta sokewar a kan blockchain kuma wannan takardar shaida ba ta da inganci kuma. Kada ku amince da wannan takardar shaida don kowane dalili kamar yadda aka soke ta a hukumance. ID na takardar shaida ${certificateId} an ba da ita a ranar ${dateIssued} amma yanzu an soke ta gaba ɗaya.`,

    `ENGLISH: SECURITY ALERT: Certificate ${certificateId} for ${companyName} has been permanently revoked by NITDA. This ${category} certification is no longer valid and has been recorded as invalidated on the blockchain. Do not proceed with any transactions.

YORUBA: IKILO AABO: Iwe-ẹri ${certificateId} fun ${companyName} ti yọkuro ni gbangba nipasẹ NITDA. Iwe-ẹri ${category} yii ko tun dara ati pe o ti kọ bi ti ko dara lori blockchain. Ma se lọ siwaju pẹlu eyikeyi iṣowo.

HAUSA: GARGADI NA TSARO: Takardar shaida ${certificateId} na ${companyName} an soke ta gaba ɗaya ta NITDA. Wannan takardar shaida ta ${category} ba ta da inganci kuma an rubuta ta a matsayin ba ta da inganci a kan blockchain. Kada ku ci gaba da kowane ma'amaloli.`,

    `ENGLISH: Revoked certificate detected: ${companyName}'s ${category} certification (${certificateId}) was officially revoked by NITDA. The revocation is ${blockchainVerified} and this certificate should not be trusted under any circumstances.

YORUBA: Iwe-ẹri ti yọkuro ti a rii: Iwe-ẹri ${category} ti ${companyName} (${certificateId}) ti yọkuro ni ofin nipasẹ NITDA. Iyọkuro naa jẹ ${blockchainVerified} ati pe iwe-ẹri yii ko gbọdọ gbẹkẹle ni eyikeyi ipo.

HAUSA: An gano takardar shaida da aka soke: Takardar shaida ta ${category} ta ${companyName} (${certificateId}) an soke ta a hukumance ta NITDA. Sokewar ita ce ${blockchainVerified} kuma wannan takardar shaida kada a amince da ita a kowane yanayi.`,
  ];

  const unknownSummaries = [
    `ENGLISH: This certificate, issued to ${companyName} under the ${category} category, has an unknown status. The certificate was issued on ${dateIssued} but its current validity cannot be confirmed. Please contact NITDA for verification.

YORUBA: Iwe-ẹri yii, ti a fi fun ${companyName} labẹ ẹka ${category}, ni ipo ti a ko mọ. Iwe-ẹri naa ti fi fun ni ${dateIssued} ṣugbọn ipo rẹ lọwọlọwọ ko le jẹrisi. Jọwọ kan si NITDA fun iwadii.

HAUSA: Wannan takardar shaida, wacce aka ba wa ${companyName} a ƙarƙashin rukunin ${category}, tana da matsayi da ba a sani ba. An ba da takardar shaida a ranar ${dateIssued} amma ba za a iya tabbatar da ingancin ta a halin yanzu ba. Da fatan za a tuntuɓi NITDA don tabbatarwa.`,

    `ENGLISH: Status unclear for ${companyName}'s ${category} certificate (${certificateId}). Issued on ${dateIssued} but current validity cannot be determined. Contact NITDA support for verification assistance.

YORUBA: Ipo ko daju fun iwe-ẹri ${category} ti ${companyName} (${certificateId}). Ti fi fun ni ${dateIssued} ṣugbọn ipo lọwọlọwọ ko le pinnu. Kan si atilẹyin NITDA fun iranlọwọ iwadii.

HAUSA: Matsayin ba a sani ba don takardar shaida ta ${category} ta ${companyName} (${certificateId}). An ba da ita a ranar ${dateIssued} amma ba za a iya tantance ingancin ta a halin yanzu ba. Tuntuɓi tallafin NITDA don taimakon tabbatarwa.`,
  ];

  let summaries;
  if (certificate.status === "valid") {
    summaries = validSummaries;
  } else if (certificate.status === "expired") {
    summaries = expiredSummaries;
  } else if (certificate.status === "revoked") {
    summaries = revokedSummaries;
  } else {
    summaries = unknownSummaries;
  }

  const seed = certificateId
    .split("")
    .reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
  const index = seed % summaries.length;

  return summaries[index];
}
