import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLocal } from "@/lib/analyzeLocal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;


const analyzeSchema = z.object({ url: z.string().url("Please provide a valid URL") });



export async function POST(req: NextRequest) {
const body = await req.json().catch(() => ({}));
const parsed = analyzeSchema.safeParse(body);
if (!parsed.success) {
const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
return NextResponse.json({ error: msg }, { status: 400 });
}
const url = parsed.data.url;


try {
const data = await analyzeLocal(url);
return NextResponse.json(data, { status: 200 });
} catch (e: any) {
console.warn("[analyze] local failed:", e?.message);
// minimal fallback response
return NextResponse.json({
url,
score: 0,
grade: "F",
violations: [],
passes: [],
summary: { total: 0, violations: 0, passes: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
analyzedAt: new Date().toISOString(),
testEngine: "axe+lighthouse (fallback)",
}, { status: 200 });
}
}