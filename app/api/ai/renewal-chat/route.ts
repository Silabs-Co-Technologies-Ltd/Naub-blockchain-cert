import { NextResponse } from "next/server";
import { deepseekChat, isDeepSeekConfigured } from "@/lib/deepseek";
import type { DSMessage } from "@/lib/deepseek";

export async function POST(req: Request) {
  try {
    const { message, certificate, history } = await req.json();

    if (!message || !certificate) {
      return NextResponse.json(
        { error: "Message and certificate are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are NAUB's official certificate support AI, helping Nigerian Army University Biu graduates understand certificate verification, revalidation, correction, and registry support workflows.

Certificate context:
- Holder: ${certificate.companyName}
- Programme / Department: ${certificate.category}
- Certificate ID: ${certificate.id}
- Expiry Date: ${new Date(certificate.dateExpiry).toLocaleDateString("en-NG")}
- Status: ${certificate.status}

Guidelines:
- Be helpful, concise, and specific to academic certificate verification in Nigeria
- Provide realistic estimates for registry documents, processing fees, and timelines without inventing exact fee amounts
- Always recommend contacting support@naub.edu.ng or the NAUB registry for official confirmation
- Keep responses under 4 sentences unless more detail is clearly needed`;

    if (!isDeepSeekConfigured()) {
      const reply = getTemplateReply(message, certificate);
      return NextResponse.json({ reply });
    }

    const messages: DSMessage[] = [{ role: "system", content: systemPrompt }];

    if (Array.isArray(history)) {
      history.forEach((h: { role: string; content: string }) => {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content,
        });
      });
    }
    messages.push({ role: "user", content: message });

    const reply =
      (await deepseekChat(messages, { temperature: 0.7, maxTokens: 250 })) ??
      "I apologize, I could not generate a response. Please contact support@naub.edu.ng for assistance.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[Certificate Support Chat]", error);
    return NextResponse.json(
      { error: "Chat service temporarily unavailable" },
      { status: 500 }
    );
  }
}

function getTemplateReply(message: string, certificate: any): string {
  const lower = message.toLowerCase();

  if (lower.includes("document") || lower.includes("required") || lower.includes("need") || lower.includes("submit")) {
    return `For ${certificate.category} certificate support, you will typically need a valid student or alumni identity document, certificate ID, proof of graduation where available, and any registry correction or revalidation form requested by NAUB. Contact support@naub.edu.ng or the registry to confirm the exact list.`;
  }
  if (lower.includes("how long") || lower.includes("time") || lower.includes("duration") || lower.includes("process")) {
    return "Registry review timelines vary, but simple verification or correction requests are commonly handled faster when all supporting documents are submitted together. Contact NAUB registry for the official timeline for your case.";
  }
  if (lower.includes("fee") || lower.includes("cost") || lower.includes("price") || lower.includes("pay")) {
    return `Any approved processing fee depends on the request type. Please use the official NAUB registry channel for the current fee schedule for ${certificate.category} certificate support.`;
  }
  if (lower.includes("start") || lower.includes("begin") || lower.includes("apply") || lower.includes("steps")) {
    return `To begin: (1) copy your certificate ID ${certificate.id}, (2) gather your student or alumni identification evidence, (3) contact NAUB registry or support@naub.edu.ng, and (4) submit any requested correction or revalidation form.`;
  }
  if (lower.includes("revoked") || lower.includes("invalid") || lower.includes("mismatch")) {
    return "If a certificate appears revoked, invalid, or mismatched, do not rely on it until NAUB registry confirms the record. Share the certificate ID and verification result with the registry for investigation.";
  }

  return `For specific guidance on certificate ${certificate.id} for ${certificate.companyName}, contact support@naub.edu.ng or the NAUB registry. They can confirm verification, correction, and revalidation steps for the ${certificate.category} programme.`;
}
