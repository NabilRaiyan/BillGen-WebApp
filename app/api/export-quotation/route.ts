
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Define types for better type safety
interface Client {
  name: string;
  address?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

interface Item {
  item_name: string;
  item_description: string;
}

interface QuotationLineItem {
  quantity: number;
  rate: number;
  line_item_total: number;
  unit_of_measurement?: string;
  items: Item | null;
}

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  issue_date: string;
  total_amount: number;
  validity_days?: number;
  delivery_time?: string;
  payment_terms?: string;
  warranty_period?: string;
  notes?: string;
  clients: Client | null;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to convert number to words (simplified for Bangladeshi context)
function numberToWords(amount: number): string {
  // This is a simplified version - you might want to use a proper library
  const crore = Math.floor(amount / 10000000);
  const lac = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const hundred = Math.floor((amount % 1000) / 100);
  const remaining = amount % 100;

  let words = "";
  if (crore > 0) words += `${crore} Crore `;
  if (lac > 0) words += `${lac} Lac `;
  if (thousand > 0) words += `${thousand} Thousand `;
  if (hundred > 0) words += `${hundred} Hundred `;
  if (remaining > 0) words += `${remaining} `;
  
  return words.trim() + " Taka Only.";
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing quotation ID" }, { status: 400 });

  try {
    // Fetch quotation with client info
    const { data: quotation, error: quoteError } = await supabaseAdmin
      .from("quotations")
      .select("*, clients(*)")
      .eq("id", id)
      .single();

    if (quoteError) throw quoteError;
    if (!quotation) throw new Error("Quotation not found");

    const typedQuotation = quotation as Quotation;

    // Fetch line items with related item info
    const { data: lineItems, error: lineError } = await supabaseAdmin
      .from("quotation_line_items")
      .select(`
        *,
        items:item_id(item_name, item_description)
      `)
      .eq("quotation_id", id);

    if (lineError) throw lineError;
    const typedLineItems = lineItems as QuotationLineItem[];

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = 800; // Start slightly lower for better alignment
    const leftMargin = 40; // Moved left as requested
    const rightMargin = 555;
    const pageWidth = 595;

    // Professional Header with enhanced styling
    // Company name with larger, bold styling
    page.drawText("Techmak Technology", { 
      x: leftMargin, y, size: 18, font: boldFont, color: rgb(0, 0, 0.8)
    });
    
    y -= 20;
    page.drawText("www.techmakbd.com", { 
      x: leftMargin, y, size: 10, font, color: rgb(0, 0, 0.6)
    });
    
    y -= 12;
    page.drawText("info@techmakbd.com", { 
      x: leftMargin, y, size: 10, font, color: rgb(0, 0, 0.6)
    });
    
    y -= 12;
    page.drawText("4th floor, House# 36/E, Road-02, Block- D", { 
      x: leftMargin, y, size: 10, font, color: rgb(0, 0, 0.6)
    });
    
    y -= 12;
    page.drawText("Bashundhara R/A, Dhaka-1229", { 
      x: leftMargin, y, size: 10, font, color: rgb(0, 0, 0.6)
    });

    // Draw a subtle header line
    page.drawLine({
      start: { x: leftMargin, y: y - 10 },
      end: { x: rightMargin, y: y - 10 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Reference and Date (top right) - aligned better
    const refY = 800;
    page.drawText(`REF: ${typedQuotation.quotation_number}`, { 
      x: rightMargin - 180, y: refY, size: 10, font: boldFont
    });
    
    page.drawText(`Date: ${new Date(typedQuotation.issue_date).toLocaleDateString('en-GB')}`, { 
      x: rightMargin - 180, y: refY - 15, size: 10, font 
    });

    y -= 50;

    // Client Information with better alignment
    page.drawText("To,", { x: leftMargin, y, size: 12, font: boldFont });
    y -= 18;
    page.drawText("Authority", { x: leftMargin, y, size: 12, font });
    y -= 16;
    page.drawText(typedQuotation.clients?.name || "Client Name", { 
      x: leftMargin, y, size: 12, font 
    });
    y -= 16;
    if (typedQuotation.clients?.address) {
      const addressLines = typedQuotation.clients.address.split('\n');
      addressLines.forEach(line => {
        page.drawText(line, { x: leftMargin, y, size: 12, font });
        y -= 16;
      });
    }

    // Attention line with better spacing
    if (typedQuotation.clients?.contact_person) {
      y -= 8;
      page.drawText(`Attention: ${typedQuotation.clients.contact_person}`, { 
        x: leftMargin, y, size: 12, font 
      });
      y -= 18;
    }

    // Changed "RFQ Number" to "Quotation Number" as requested
    y -= 15;
    page.drawText(`Quotation Number: ${typedQuotation.quotation_number}`, { 
      x: leftMargin, y, size: 10, font: boldFont 
    });
    page.drawText(`Date: ${new Date(typedQuotation.issue_date).toLocaleDateString('en-GB')}`, { 
      x: leftMargin + 200, y, size: 10, font: boldFont 
    });
    
    y -= 35;

    // Quotation Title with enhanced styling
    page.drawText("Quotation", { 
      x: leftMargin, y, size: 12, font: boldFont, color: rgb(0, 0, 0)
    });
    
    y -= 30;

    // Dear Sir
    page.drawText("Dear Sir,", { x: leftMargin, y, size: 12, font });
    y -= 25;

    // Introduction paragraph with better line spacing
    const intro = "We would like to thank you for giving us the opportunity to do business with your organization. In reference on your showing interest to the following goods we are very happy to inform you our best offer.";
    const introLines = intro.match(/.{1,85}(\s|$)/g) || [intro];
    introLines.forEach(line => {
      page.drawText(line.trim(), { x: leftMargin, y, size: 11, font });
      y -= 16;
    });

    y -= 25;

    // Enhanced Table with better alignment and styling
    const tableTop = y;
    const rowHeight = 35; // Increased row height for better readability
    const colWidths = [35, 130, 55, 100, 75, 85]; // Adjusted column widths
    let xPos = leftMargin;

    // Table header background
    page.drawRectangle({
      x: leftMargin,
      y: y - rowHeight,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: rowHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Table headers with better alignment
    const headers = ["Sl no", "Item Description", "Quantity", "Unit of Measurement", "Unit price (TK)", "Total price"];
    headers.forEach((header, index) => {
      page.drawText(header, { 
        x: xPos + 2, 
        y: y - 18, 
        size: 10, 
        font: boldFont 
      });
      
      // Draw vertical lines
      if (index < headers.length - 1) {
        page.drawLine({
          start: { x: xPos + colWidths[index], y: y },
          end: { x: xPos + colWidths[index], y: y - rowHeight },
          thickness: 1,
        });
      }
      
      xPos += colWidths[index];
    });

    y -= rowHeight;

    // Table rows with better styling
    if (typedLineItems && typedLineItems.length > 0) {
      typedLineItems.forEach((item: QuotationLineItem, idx: number) => {
        // Alternate row colors for better readability
        const isEvenRow = idx % 2 === 0;
        page.drawRectangle({
          x: leftMargin,
          y: y - rowHeight,
          width: colWidths.reduce((a, b) => a + b, 0),
          height: rowHeight,
          color: isEvenRow ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98),
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        xPos = leftMargin;
        const rowData = [
          `${idx + 1}.`,
          `${item.items?.item_name || 'Item'}\n${item.items?.item_description || ''}`,
          `${item.quantity}`,
          item.unit_of_measurement || 'Pcs',
          `${item.rate.toLocaleString()}/-`,
          `${item.line_item_total.toLocaleString()}/-`
        ];

        rowData.forEach((data, index) => {
          const lines = data.split('\n');
          lines.forEach((line, lineIdx) => {
            const textY = y - 15 - (lineIdx * 12);
            // Center align numbers
            let textX = xPos + 5;
            if (index === 0 || index === 2) { // Sl no and Quantity
              textX = xPos + (colWidths[index] / 2) - (line.length * 2.5);
            } else if (index >= 4) { // Price columns - right align
              textX = xPos + colWidths[index] - 10 - (line.length * 5);
            }
            
            page.drawText(line, { 
              x: textX, 
              y: textY, 
              size: 9, 
              font 
            });
          });

          // Draw vertical lines
          if (index < rowData.length - 1) {
            page.drawLine({
              start: { x: xPos + colWidths[index], y: y },
              end: { x: xPos + colWidths[index], y: y - rowHeight },
              thickness: 1,
            });
          }
          
          xPos += colWidths[index];
        });

        y -= rowHeight;
      });
    }

    // Enhanced Total row
    page.drawRectangle({
      x: leftMargin,
      y: y - rowHeight,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: rowHeight,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    page.drawText("Total amount including VAT & TAX -", { 
      x: leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 10, 
      y: y - 18, 
      size: 11, 
      font: boldFont 
    });

    page.drawText(`${typedQuotation.total_amount.toLocaleString()}/-`, { 
      x: leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 10, 
      y: y - 18, 
      size: 12, 
      font: boldFont,
      color: rgb(0, 0, 0.8)
    });

    y -= 45;

    // Amount in words with better styling
    page.drawText("IN WORD: " + numberToWords(typedQuotation.total_amount), { 
      x: leftMargin, y, size: 11, font: boldFont, color: rgb(0, 0, 0.8)
    });

    y -= 30;

    // Notice/Warranty with enhanced styling
    page.drawText(`NOTICE: ${typedQuotation.warranty_period || '01 Years Warranty'}`, { 
      x: leftMargin, y, size: 11, font: boldFont, color: rgb(0.8, 0, 0)
    });

    y -= 35;

    // Terms & Conditions with better spacing
    page.drawText("Terms & Conditions:", { 
      x: leftMargin, y, size: 12, font: boldFont, color: rgb(0, 0, 0.8)
    });
    
    y -= 25;
    
    const terms = [
      "1. Work Order: Work order should be issued by the buyer.",
      `2. Validity: Offer Valid up to ${typedQuotation.validity_days || 30} days from the date of submission.`,
      `3. Delivery Time: ${typedQuotation.delivery_time || 'lead time is within 30-35 days from the date of getting work order'}.`,
      `4. Payment Clearance: ${typedQuotation.payment_terms || 'As per buyer\'s rules'}.`
    ];

    terms.forEach(term => {
      page.drawText(term, { x: leftMargin, y, size: 10, font });
      y -= 18; // Increased spacing
    });

    y -= 30;

    // Closing with better spacing
    page.drawText("In acceptance of the following terms and conditions with the price we are ready to provide the above", { 
      x: leftMargin, y, size: 11, font 
    });
    y -= 18;
    page.drawText("mentioned services.", { 
      x: leftMargin, y, size: 11, font 
    });
    
    y -= 30;
    page.drawText("Thank you", { x: leftMargin, y, size: 12, font });

    y -= 50;

    // Signature section with better spacing
    page.drawText("A.Azam Tusher", { x: leftMargin, y, size: 12, font: boldFont });
    y -= 18;
    page.drawText("CEO", { x: leftMargin, y, size: 11, font });
    y -= 18;
    page.drawText("Techmak Technology", { x: leftMargin, y, size: 11, font: boldFont });
    y -= 18;
    page.drawText("+8801611224433", { x: leftMargin, y, size: 11, font });

    // Professional Footer with enhanced styling and blue accent
    const footerY = 80;
    
    // Blue line before footer
    page.drawLine({
      start: { x: 0, y: footerY + 25 },
      end: { x: pageWidth, y: footerY + 25 },
      thickness: 1,
      color: rgb(0, 0, 0.8),
    });

    // Footer background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: footerY + 20,
      color: rgb(0.95, 0.96, 1), // Light blue background
    });

    // Blue accent at bottom
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: 3,
      color: rgb(0, 0, 0.8), // Blue accent
    });

    // Footer content in three columns with better spacing
    // Email column
    page.drawText("Email:", { 
      x: leftMargin, y: footerY - 10, size: 10, font: boldFont, color: rgb(0, 0, 0.8)
    });
    page.drawText("info@techmakbd.com", { 
      x: leftMargin, y: footerY - 25, size: 9, font 
    });
    
    // Phone column  
    page.drawText("Phone:", { 
      x: leftMargin + 180, y: footerY - 10, size: 10, font: boldFont, color: rgb(0, 0, 0.8)
    });
    page.drawText("+8801611224433", { 
      x: leftMargin + 180, y: footerY - 25, size: 9, font 
    });
    
    // Website column
    page.drawText("Website:", { 
      x: leftMargin + 350, y: footerY - 10, size: 10, font: boldFont, color: rgb(0, 0, 0.8)
    });
    page.drawText("www.techmakbd.com", { 
      x: leftMargin + 350, y: footerY - 25, size: 9, font 
    });

    // Address row
    page.drawText("Address: 4th floor, House# 36/E, Road-02, Block- D, Bashundhara R/A, Dhaka-1229", { 
      x: leftMargin, y: footerY - 45, size: 9, font, color: rgb(0, 0, 0.7)
    });

    console.log("Generating PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated, size:", pdfBytes.length, "bytes");

    return new Response(pdfBytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${typedQuotation.quotation_number}.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
        "Cache-Control": "no-cache",
      },
    });

  } catch (err: unknown) {
    console.error("Error generating PDF:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}