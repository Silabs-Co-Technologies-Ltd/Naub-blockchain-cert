import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { message, certificate, history } = await req.json();

    if (!message || !certificate) {
      return NextResponse.json(
        { error: "Message and certificate are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are NITDA's official renewal assistance AI, helping IT service providers renew their certificates.

Company context:
- Company: ${certificate.companyName}
- Category: ${certificate.category}
- Certificate ID: ${certificate.id}
- Expiry Date: ${new Date(certificate.dateExpiry).toLocaleDateString("en-NG")}
- Status: ${certificate.status}

Guidelines:
- Be helpful, concise, and specific to ${certificate.category} services in Nigeria
- Provide realistic estimates for documents, fees, and timelines based on NITDA procedures
- Always recommend contacting support@nitda.gov.ng for official confirmation
- Keep responses under 4 sentences unless more detail is clearly needed
- Never make up specific fee amounts — direct to NITDA portal for exact figures`;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      const reply = getTemplateReply(message, certificate);
      return NextResponse.json({ reply });
    }

    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];

    if (Array.isArray(history)) {
      history.forEach((h: { role: string; content: string }) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 250,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const reply =
      response.text?.trim() ||
      "I apologize, I could not generate a response. Please contact support@nitda.gov.ng for assistance.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[Renewal Chat]", error);
    return NextResponse.json(
      { error: "Chat service temporarily unavailable" },
      { status: 500 }
    );
  }
}

function getTemplateReply(message: string, certificate: any): string {
  const lower = message.toLowerCase();

  if (lower.includes("document") || lower.includes("required") || lower.includes("need") || lower.includes("submit")) {
    return `For ${certificate.category} renewal, you will typically need: an updated CAC registration certificate, evidence of continued operations in the ${certificate.category} sector, a completed NITDA renewal application form, and your most recent tax clearance certificate. Contact support@nitda.gov.ng to confirm the exact list for your category.`;
  }

  if (lower.includes("how long") || lower.includes("time") || lower.includes("duration") || lower.includes("process")) {
    return "The renewal process typically takes 2–4 weeks from submission of complete documentation. Submit all required documents together to avoid delays in processing.";
  }

  if (lower.includes("fee") || lower.includes("cost") || lower.includes("price") || lower.includes("pay")) {
    return `Renewal fees vary by service category. Visit the NITDA portal or contact support@nitda.gov.ng for the current fee schedule applicable to ${certificate.category} services.`;
  }

  if (lower.includes("start") || lower.includes("begin") || lower.includes("apply") || lower.includes("steps")) {
    return `To begin renewal: (1) Gather the required documents for ${certificate.category} services, (2) Visit the NITDA Vendor Portal or regional office, (3) Submit your completed renewal application with all documents, (4) Pay the applicable renewal fee. Contact support@nitda.gov.ng for assistance.`;
  }

  if (lower.includes("penalty") || lower.includes("fine") || lower.includes("late")) {
    return "Operating without a valid certificate may result in regulatory sanctions. We recommend initiating renewal immediately. Contact support@nitda.gov.ng to discuss your specific situation.";
  }

  return `For specific guidance on renewing your ${certificate.category} certificate (${certificate.id}), please contact support@nitda.gov.ng or visit the NITDA Vendor Portal. Our team will guide you through the renewal process step by step.`;
}
