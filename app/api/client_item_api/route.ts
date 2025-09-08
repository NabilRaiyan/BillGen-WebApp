import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client with service role (server-side only)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Fetch clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) throw clientsError;

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    return NextResponse.json({ clients, items });
  } catch (error) {
    console.error('Error fetching clients/items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch clients and items' },
      { status: 500 }
    );
  }
}


