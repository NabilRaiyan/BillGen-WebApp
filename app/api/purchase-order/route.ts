import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit')) || 5; // default to 5

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        clients (
          id,
          name,
          email
        ),
        quotations (
          quotation_number
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Flatten client name and quotation_number for frontend
    const formattedData = (data || []).map(q => ({
      ...q,
      client_name: q.clients?.name || 'N/A',
      quotation_number: q.quotations?.quotation_number || 'N/A'
    }));

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
