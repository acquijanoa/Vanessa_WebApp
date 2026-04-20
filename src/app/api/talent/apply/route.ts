import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function redirectApply(req: NextRequest, query: Record<string, string>) {
  const u = new URL("/talent/apply", req.url);
  for (const [k, v] of Object.entries(query)) {
    u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u);
}

function optionalTrim(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") {
    return null;
  }
  const t = v.trim();
  return t.length ? t : null;
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return redirectApply(req, { error: "form" });
  }

  const fullName = optionalTrim(form, "fullName");
  if (!fullName) {
    return redirectApply(req, { error: "validacion" });
  }

  let height_cm: number | null = null;
  const heightRaw = form.get("height");
  if (typeof heightRaw === "string" && heightRaw.trim()) {
    const n = Number(heightRaw.replace(",", "."));
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      height_cm = n;
    }
  }

  const supabase = createServerClient();
  if (!supabase) {
    return redirectApply(req, { error: "config" });
  }

  const { error } = await supabase.from("talent_form_submissions").insert({
    full_name: fullName,
    height_cm,
    sizes_notes: optionalTrim(form, "sizes"),
    skin_tone: optionalTrim(form, "skin"),
    eye_color: optionalTrim(form, "eyes"),
    skills: optionalTrim(form, "skills"),
    digitals_urls: optionalTrim(form, "digitals"),
  });

  if (error) {
    console.error("talent_form_submissions insert:", error);
    return redirectApply(req, { error: "servidor" });
  }

  return redirectApply(req, { ok: "1" });
}
