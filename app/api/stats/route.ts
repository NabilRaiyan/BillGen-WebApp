import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role key for server
);

export async function GET(req: NextRequest) {
  try {
    // Fetch counts for each table
    const [{ count: invoices }, { count: bills }, { count: pos }, { count: quotations }] = await Promise.all([
      supabaseAdmin.from("invoices").select("id", { count: "exact" }),
      supabaseAdmin.from("bills").select("id", { count: "exact" }),
      supabaseAdmin.from("purchase_orders").select("id", { count: "exact" }),
      supabaseAdmin.from("quotations").select("id", { count: "exact" }),
    ]);

    return NextResponse.json({
      invoices: invoices ?? 0,
      bills: bills ?? 0,
      pos: pos ?? 0,
      quotations: quotations ?? 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 });
  }
}
