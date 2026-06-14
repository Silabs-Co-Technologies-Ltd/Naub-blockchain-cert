import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { deepseekGenerate } from "@/lib/deepseek";
import type { Certificate } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "Search query required" }, { status: 400 });
    }

    const certs = await database.getAllCertificates();
    const categories = [...new Set(certs.map((c) => c.category))];
    const today = new Date().toISOString().split("T")[0];

    let filters: {
      status?: string | null;
      category?: string | null;
      searchText?: string | null;
      expiryBefore?: string | null;
      expiryAfter?: string | null;
    } = {};
    let explanation = `Showing results for: "${query}"`;

    try {
      const text = await deepseekGenerate(
        `Parse this natural language search query for a certificate management system into structured filters. Return ONLY valid JSON, no explanation, no markdown.

Query: "${query}"
Today: ${today}
Available categories: ${categories.join(", ")}

Return JSON in this exact shape:
{
  "status": "valid" | "expired" | "revoked" | null,
  "category": "exact category name from the list above" | null,
  "searchText": "company name or certificate ID fragment" | null,
  "expiryBefore": "YYYY-MM-DD" | null,
  "expiryAfter": "YYYY-MM-DD" | null,
  "explanation": "plain English description of what is being searched"
}`,
        { temperature: 0.1, maxTokens: 200 }
      );

      if (text) {
        const jsonMatch = text.match(/\{[\s\S]+\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          filters = {
            status: parsed.status || null,
            category: parsed.category || null,
            searchText: parsed.searchText || null,
            expiryBefore: parsed.expiryBefore || null,
            expiryAfter: parsed.expiryAfter || null,
          };
          if (parsed.explanation) explanation = parsed.explanation;
        }
      }
    } catch {
      // fall through to basic text search
    }

    let results: Certificate[] = [...certs];
    let filtersApplied = false;

    if (filters.status) {
      results = results.filter((c) => c.status === filters.status);
      filtersApplied = true;
    }
    if (filters.category) {
      results = results.filter((c) =>
        c.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
      filtersApplied = true;
    }
    if (filters.searchText) {
      const q = filters.searchText.toLowerCase();
      results = results.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q)
      );
      filtersApplied = true;
    }
    if (filters.expiryBefore) {
      results = results.filter(
        (c) => new Date(c.dateExpiry) <= new Date(filters.expiryBefore!)
      );
      filtersApplied = true;
    }
    if (filters.expiryAfter) {
      results = results.filter(
        (c) => new Date(c.dateExpiry) >= new Date(filters.expiryAfter!)
      );
      filtersApplied = true;
    }

    if (!filtersApplied) {
      const q = query.toLowerCase();
      results = certs.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.status.includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ results, explanation, filters });
  } catch (error) {
    console.error("[NL Search]", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
