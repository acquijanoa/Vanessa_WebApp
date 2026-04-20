import { NextRequest, NextResponse } from "next/server";
import { removePortfolioItem } from "@/lib/portfolio-data";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

type Params = { id: string };

export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  const denied = await requireAdmin(req);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Falta id." }, { status: 400 });
  }

  const ok = await removePortfolioItem(id);
  if (!ok) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
