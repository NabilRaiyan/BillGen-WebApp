
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from 'fs';
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
  discount: number | 0;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to convert number to words (simplified for Bangladeshi context)
function numberToWords(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "Zero Taka Only.";

  const ones = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  const twoDigits = (num: number) => {
    if (num < 20) return ones[num];
    const t = Math.floor(num / 10);
    const r = num % 10;
    return tens[t] + (r ? " " + ones[r] : "");
  };

  const threeDigits = (num: number) => {
    if (num === 0) return "";
    if (num < 100) return twoDigits(num);
    const h = Math.floor(num / 100);
    const rem = num % 100;
    return ones[h] + " Hundred" + (rem ? " " + twoDigits(rem) : "");
  };

  let n = Math.floor(Math.abs(amount));
  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);

  const lac = Math.floor(n / 100000);
  n %= 100000;
  if (lac) parts.push(`${threeDigits(lac)} Lac`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);

  if (n) parts.push(threeDigits(n));

  return parts.join(" ").replace(/\s+/g, " ").trim() + " Taka Only.";
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
let page = pdfDoc.addPage([595, 842]); // A4
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

let y = 820; 
const leftMargin = 40; 
const rightMargin = 555;
const pageWidth = 595;
const pageHeight = 842;
const bottomMargin = 60; // reserve space for footer/signature

// Helper: Page break
function checkPageBreak(requiredSpace = 40) {
  if (y - requiredSpace < bottomMargin) {
    page = pdfDoc.addPage([595, 842]);
    y = 820;
    drawHeader(); // repeat header on new page
  }
}

// --- HEADER (Logo + Company Info) ---
async function drawHeader() {
  const res = await fetch('https://epfeexfehliszmipvbhe.supabase.co/storage/v1/object/sign/asset/logo1.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kYzc2MDhmZi1lM2M5LTQ5YWEtOGQ5Yy0yMGI0ZTJmNDhiMGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldC9sb2dvMS5qcGVnIiwiaWF0IjoxNzU3NTA0NjAwLCJleHAiOjE5MTUxODQ2MDB9.y1hikMKVpnVwhECBfSnXXmAspns9knyaiFUxH7XzFfo');
  const logoBytes = await res.arrayBuffer();
  const logoImage = await pdfDoc.embedPng(logoBytes);

  const logoWidth = 50, logoHeight = 50;
  const logoScale = 0.2;
  const logoDims = { width: logoImage.width * logoScale, height: logoImage.height * logoScale };

  // Watermark
  page.drawImage(logoImage, {
    x: rightMargin - logoDims.width - 10,
    y: y - logoDims.height - 100,
    width: logoDims.width,
    height: logoDims.height,
    opacity: 0.3,
  });

  // Logo + Company Name
  page.drawImage(logoImage, { x: leftMargin, y: y - logoHeight + 5, width: logoWidth, height: logoHeight });
  page.drawText("Techmak Technology Ltd.", { x: leftMargin + logoWidth + 10, y, size: 18, font: boldFont, color: rgb(0, 0, 0.8) });

  y -= 20;
  page.drawText("www.techmakai.com", { x: leftMargin + logoWidth + 10, y, size: 10, font, color: rgb(0, 0, 0.6) });
  y -= 13;
  page.drawText("info@techmakai.com", { x: leftMargin + logoWidth + 10, y, size: 10, font, color: rgb(0, 0, 0.6) });
  y -= 11;
  page.drawText("4th floor, House# 36/E, Road-02, Block- D", { x: leftMargin + logoWidth + 10, y, size: 10, font, color: rgb(0, 0, 0.6) });
  y -= 10;
  page.drawText("Bashundhara R/A, Dhaka-1229", { x: leftMargin + logoWidth + 10, y, size: 10, font, color: rgb(0, 0, 0.6) });

  // Header line
  page.drawLine({ start: { x: leftMargin, y: y - 8 }, end: { x: rightMargin, y: y - 8 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  y -= 40;
}

await drawHeader();

// --- REF & DATE ---
const refY = 800;
page.drawText(`REF: ${typedQuotation.quotation_number}`, { x: rightMargin - 180, y: refY, size: 10, font: boldFont });
page.drawText(`Date: ${new Date(typedQuotation.issue_date).toLocaleDateString('en-GB')}`, { x: rightMargin - 180, y: refY - 15, size: 10, font });

// --- CLIENT INFO ---
y -= 20;
page.drawText("To,", { x: leftMargin, y, size: 12, font: boldFont });
y -= 18;
page.drawText("Authority", { x: leftMargin, y, size: 12, font });
y -= 16;
page.drawText(typedQuotation.clients?.name || "Client Name", { x: leftMargin, y, size: 12, font });
y -= 16;
if (typedQuotation.clients?.address) {
  const addressLines = typedQuotation.clients.address.split('\n');
  addressLines.forEach(line => { page.drawText(line, { x: leftMargin, y, size: 12, font }); y -= 16; });
}
if (typedQuotation.clients?.contact_person) {
  y -= 8;
  page.drawText(`Attention: ${typedQuotation.clients.contact_person}`, { x: leftMargin, y, size: 12, font, color: rgb(0, 0, 0.6) });
  y -= 18;
}
y -= 10;
page.drawText(`Quotation Number: ${typedQuotation.quotation_number}`, { x: leftMargin, y, size: 10, color: rgb(0, 0, 0.6), font });
page.drawText(`Date: ${new Date(typedQuotation.issue_date).toLocaleDateString('en-GB')}`, { x: leftMargin + 200, y, size: 10, font });

// --- QUOTATION TITLE ---
y -= 30;
const title = "Quotation";
const titleSize = 12;
const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
const centerX = (pageWidth - titleWidth) / 2;
page.drawText(title, { x: centerX, y, size: titleSize, font: boldFont });
page.drawLine({ start: { x: centerX, y: y - 2 }, end: { x: centerX + titleWidth, y: y - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

y -= 30;
page.drawText("Dear Sir,", { x: leftMargin, y, size: 12, font });
y -= 25;

// --- INTRO PARA ---
const intro = "We would like to thank you for giving us the opportunity to do business with your organization. In reference on your showing interest to the following goods we are very happy to inform you our best offer.";
const introSize = 11;
const maxWidth = pageWidth - leftMargin * 2;
let line = "";
intro.split(" ").forEach((word, i, arr) => {
  const testLine = line + word + " ";
  const testWidth = font.widthOfTextAtSize(testLine, introSize);
  if (testWidth > maxWidth && line !== "") {
    checkPageBreak(20);
    page.drawText(line.trim(), { x: leftMargin, y, size: introSize, font });
    y -= 16;
    line = word + " ";
  } else {
    line = testLine;
  }
  if (i === arr.length - 1) {
    checkPageBreak(20);
    page.drawText(line.trim(), { x: leftMargin, y, size: introSize, font });
    y -= 16;
  }
});

y -= 10;

// --- TABLE ---
const rowHeight = 35;
const colWidths = [35, 130, 55, 100, 75, 85];
let xPos = leftMargin;

// Helper function to trim text to fit in column
function trimTextToFit(text: string, maxWidth: number, fontSize: number): string {
  if (!text) return '';
  
  // Approximate character width (adjust based on your font)
  const avgCharWidth = fontSize * 0.6;
  const maxChars = Math.floor((maxWidth - 10) / avgCharWidth); // 10px padding
  
  if (text.length <= maxChars) return text;
  
  // For multi-line text (item name + description), handle specially
  if (text.includes('\n')) {
    const lines = text.split('\n');
    const trimmedLines = lines.map(line => {
      if (line.length > maxChars) {
        return line.substring(0, maxChars - 3) + '...';
      }
      return line;
    });
    return trimmedLines.join('\n');
  }
  
  return text.substring(0, maxChars - 3) + '...';
}

// Helper function to draw column separators
function drawColumnSeparators(startY: number, height: number) {
  let separatorX = leftMargin;
  for (let i = 0; i < colWidths.length - 1; i++) {
    separatorX += colWidths[i];
    page.drawLine({
      start: { x: separatorX, y: startY },
      end: { x: separatorX, y: startY - height },
      thickness: 0.5,
      color: rgb(0.4, 0.4, 0.4)
    });
  }
}

// Header
checkPageBreak(50);
page.drawRectangle({ 
  x: leftMargin, 
  y: y - rowHeight, 
  width: colWidths.reduce((a, b) => a + b, 0), 
  height: rowHeight, 
  color: rgb(0.95, 0.95, 0.95), 
  borderColor: rgb(0, 0, 0), 
  borderWidth: 1 
});

// Draw column separators for header
drawColumnSeparators(y, rowHeight);

const headers = ["Sl no", "Item Description", "Quantity", "Unit of Measurement", "Unit price (TK)", "Total price"];
headers.forEach((header, i) => { 
  page.drawText(header, { 
    x: xPos + 2, 
    y: y - 18, 
    size: 10, 
    font: boldFont 
  }); 
  xPos += colWidths[i]; 
});
y -= rowHeight;

// Rows
typedLineItems.forEach((item: QuotationLineItem, idx: number) => {
  checkPageBreak(50);
  const isEvenRow = idx % 2 === 0;
  page.drawRectangle({ 
    x: leftMargin, 
    y: y - rowHeight, 
    width: colWidths.reduce((a, b) => a + b, 0), 
    height: rowHeight, 
    color: isEvenRow ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98), 
    borderColor: rgb(0, 0, 0), 
    borderWidth: 1 
  });

  // Draw column separators for this row
  drawColumnSeparators(y, rowHeight);

  xPos = leftMargin;
  const rawDescription = `${item.items?.item_name || 'Item'}\n${item.items?.item_description || ''}`;
  const trimmedDescription = trimTextToFit(rawDescription, colWidths[1], 9);
  
  const rowData = [
    `${idx + 1}.`, 
    trimmedDescription, 
    `${item.quantity}`, 
    item.unit_of_measurement || 'Pcs', 
    `${item.rate.toLocaleString()}/-`, 
    `${item.line_item_total.toLocaleString()}/-`
  ];
  
  rowData.forEach((data, i) => { 
    // Trim other columns if needed (except description which is already trimmed)
    const finalData = i === 1 ? data : trimTextToFit(data, colWidths[i], 9);
    page.drawText(finalData, { 
      x: xPos + 5, 
      y: y - 18, 
      size: 9, 
      font 
    }); 
    xPos += colWidths[i]; 
  });
  y -= rowHeight;
});

// Total
checkPageBreak(60);
page.drawRectangle({ 
  x: leftMargin, 
  y: y - rowHeight, 
  width: colWidths.reduce((a, b) => a + b, 0), 
  height: rowHeight, 
  color: rgb(0.9, 0.9, 0.9), 
  borderColor: rgb(0, 0, 0), 
  borderWidth: 2 
});

// NO column separators for total row - removed for cleaner look

const label = "Total amount including VAT & TAX - ";
const discountLabel = "Discount amount -";

// Draw total amount row
page.drawText(label, { 
  x: leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 10, 
  y: y - 18, 
  size: 11, 
  font: boldFont 
});
page.drawText(`${typedQuotation.total_amount.toLocaleString()}/-`, { 
  x: leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 10 + boldFont.widthOfTextAtSize(label, 11) + 10, 
  y: y - 18, 
  size: 12, 
  font: boldFont, 
  color: rgb(0, 0, 0.8) 
});

// Move to next row for discount
y -= rowHeight;

// Check if we need a new page for discount row
checkPageBreak(60);

// Draw discount row background
page.drawRectangle({ 
  x: leftMargin, 
  y: y - rowHeight, 
  width: colWidths.reduce((a, b) => a + b, 0), 
  height: rowHeight, 
  color: rgb(0.95, 0.9, 0.9), // Light red background for discount
  borderColor: rgb(0, 0, 0), 
  borderWidth: 1 
});

// NO column separators for discount row - removed for cleaner look

// Draw discount amount row
page.drawText(discountLabel, { 
  x: leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 10, 
  y: y - 18, 
  size: 11, 
  font: boldFont,
  color: rgb(0.6, 0, 0) 
});

page.drawText(`${typedQuotation.discount.toLocaleString()}%`, { 
  x: leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 10 + boldFont.widthOfTextAtSize(discountLabel, 11) + 10, 
  y: y - 18, 
  size: 12, 
  font: boldFont, 
  color: rgb(0.6, 0, 0) 
});

// Move y position for any subsequent content
y -= rowHeight;
y -= 50;

// Amount in words
checkPageBreak(30);
page.drawText("IN WORD: " + numberToWords(typedQuotation.total_amount), { x: leftMargin, y, size: 11, font: boldFont, color: rgb(0, 0, 0.8) });

y -= 25;

// Notice / Warranty
checkPageBreak(40);
page.drawText(`NOTICE: ${typedQuotation.warranty_period || '01 Years Warranty'}`, { x: leftMargin, y, size: 11, font: boldFont, color: rgb(0.8, 0, 0) });

y -= 20;
page.drawText("Terms & Conditions:", { x: leftMargin, y, size: 12, font: boldFont, color: rgb(0, 0, 0.8) });

y -= 18;
const terms = [
  "1. Work Order: Work order should be issued by the buyer.",
  `2. Validity: Offer Valid up to ${typedQuotation.validity_days || 30} days.`,
  `3. Delivery Time: ${typedQuotation.delivery_time || '30-35 days from work order'}.`,
  `4. Payment Clearance: ${typedQuotation.payment_terms || 'As per buyer\'s rules'}.`
];
terms.forEach(term => { checkPageBreak(20); page.drawText(term, { x: leftMargin, y, size: 10, font }); y -= 14; });

y -= 18;
page.drawText("In acceptance of the following terms and conditions with the price we are ready to provide the above", { x: leftMargin, y, size: 11, font, color: rgb(0, 0, 0.6) });
y -= 14;
page.drawText("mentioned services.", { x: leftMargin, y, size: 11, font, color: rgb(0, 0, 0.6) });

y -= 20;
page.drawText("Thank you", { x: leftMargin, y, size: 12, font });

y -= 25;

// --- SIGNATURE ---
checkPageBreak(80);
page.drawText("A.Azam Tusher", { x: leftMargin, y, size: 12, font: boldFont });
y -= 14;
page.drawText("CEO", { x: leftMargin, y, size: 11, font });
y -= 14;
page.drawText("Techmak Technology", { x: leftMargin, y, size: 11, font: boldFont });
y -= 14;
page.drawText("+8801611224433", { x: leftMargin, y, size: 11, font });


    // // Professional Footer with enhanced styling and blue accent
    // const footerY = 80;
    
    // // Blue line before footer
    // page.drawLine({
    //   start: { x: 0, y: footerY + 25 },
    //   end: { x: pageWidth, y: footerY + 25 },
    //   thickness: 1,
    //   color: rgb(0, 0, 0.8),
    // });

    // // Footer background
    // page.drawRectangle({
    //   x: 0,
    //   y: 0,
    //   width: pageWidth,
    //   height: footerY + 20,
    //   color: rgb(0.95, 0.96, 1), // Light blue background
    // });

    // // Blue accent at bottom
    // page.drawRectangle({
    //   x: 0,
    //   y: 0,
    //   width: pageWidth,
    //   height: 3,
    //   color: rgb(0, 0, 0.8), // Blue accent
    // });

    // // Footer content in three columns with better spacing
    // // Email column
    // page.drawText("Email:", { 
    //   x: leftMargin, y: footerY - 10, size: 10, font: boldFont, color: rgb(0, 0, 0.8)
    // });
    // page.drawText("info@techmakbd.com", { 
    //   x: leftMargin, y: footerY - 25, size: 9, font 
    // });
    
    // // Phone column  
    // page.drawText("Phone:", { 
    //   x: leftMargin + 180, y: footerY - 10, size: 10, font: boldFont, color: rgb(0, 0, 0.8)
    // });
    // page.drawText("+8801611224433", { 
    //   x: leftMargin + 180, y: footerY - 25, size: 9, font 
    // });
    
    // // Website column
    // page.drawText("Website:", { 
    //   x: leftMargin + 350, y: footerY - 10, size: 10, font: boldFont, color: rgb(0, 0, 0.8)
    // });
    // page.drawText("www.techmakbd.com", { 
    //   x: leftMargin + 350, y: footerY - 25, size: 9, font 
    // });

    // // Address row
    // page.drawText("Address: 4th floor, House# 36/E, Road-02, Block- D, Bashundhara R/A, Dhaka-1229", { 
    //   x: leftMargin, y: footerY - 45, size: 9, font, color: rgb(0, 0, 0.7)
    // });

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