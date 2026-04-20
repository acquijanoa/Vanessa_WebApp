import { NextResponse } from "next/server";
import { getPortfolioItems } from "@/lib/portfolio-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await getPortfolioItems();
    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se pudo leer el portfolio." }, { status: 500 });
  }
}
