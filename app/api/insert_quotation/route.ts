import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);


type LineItem = {
  item_id: string;
  quantity: number;
  rate: number;
  line_item_total: number;
};



export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    console.log('Received body:', body);

    const { formData, userId } = body; // <--- extract formData
    
    if (!formData) return NextResponse.json({ error: 'Missing formData' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const {
      client_id,
      title,
      quotation_number,
      issue_date,
      due_date,
      terms_and_conditions,
      discount = 0,
      tax_rate = 0,
      line_items = []
    } = formData; // <--- use formData

    const subtotal = line_items.reduce(
      (sum: number, item: LineItem) => sum + item.line_item_total,
      0
    );
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * tax_rate) / 100;
    const total_amount = taxableAmount + taxAmount;

    // Insert quotation
    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .insert({
        user_id: userId,
        client_id,
        title,
        quotation_number,
        issue_date,
        due_date,
        subtotal,
        discount,
        tax_rate,
        terms_and_conditions,
        total_amount
      })
      .select()
      .single();

    if (quotationError) throw quotationError;

    // Insert line items
    const lineItemsToInsert = line_items
      .filter((item: LineItem) => item.item_id && item.quantity > 0)
      .map((item: LineItem) => ({
        quotation_id: quotationData.id,
        item_id: item.item_id,
        user_id: userId,
        quantity: item.quantity,
        rate: item.rate,
        line_item_total: item.line_item_total
      }));


    if (lineItemsToInsert.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('quotation_line_items')
        .insert(lineItemsToInsert);
      if (lineItemsError) throw lineItemsError;
    }

    return NextResponse.json({ success: true, quotation: quotationData });
  } catch (error: unknown) {
      console.error('Insert Quotation API error:', error);

      // Safely access message if error is an instance of Error
      const message = error instanceof Error ? error.message : 'Server error';

      return NextResponse.json({ error: message }, { status: 500 });
    }
}
