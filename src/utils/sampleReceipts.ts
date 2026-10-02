export interface SampleReceiptMeta {
  id: string;
  title: string;
  clinic: string;
  employee: string;
  amount: string;
  category: string;
}

export const SAMPLE_RECEIPTS: SampleReceiptMeta[] = [
  {
    id: 'sample-1',
    title: 'GP Family Clinic Bill',
    clinic: 'Dr. Tan & Partners Medical Clinic',
    employee: 'Sarah Jenkins',
    amount: '$76.30',
    category: 'General Practice / Flu',
  },
  {
    id: 'sample-2',
    title: 'Dental Surgery Invoice',
    clinic: 'SmileCare Dental Surgery',
    employee: 'Jonathan Chen',
    amount: '$174.40',
    category: 'Dental / Scaling',
  },
  {
    id: 'sample-3',
    title: 'Specialist Centre Receipt',
    clinic: 'Novena Eye & Vision Specialist',
    employee: 'Emily Rodriguez',
    amount: '$313.92',
    category: 'Specialist / Eye Care',
  },
  {
    id: 'sample-4',
    title: 'Physiotherapy Claim',
    clinic: 'RehabPlus Physical Therapy',
    employee: 'Michael Chang',
    amount: '$130.80',
    category: 'Physiotherapy',
  },
];

export function generateReceiptImage(sampleId: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - textured paper receipt look
  ctx.fillStyle = '#faf9f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle border / shadow line
  ctx.strokeStyle = '#e2dfd2';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  // Header banner or clinic logo
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(36, 36, canvas.width - 72, 8);

  ctx.textAlign = 'center';

  let clinicTitle = '';
  let addressLine = '';
  let telLine = '';
  let employeeName = '';
  let receiptNo = '';
  let dateStr = '';
  let items: { name: string; qty: number; price: string }[] = [];
  let subTotal = '';
  let gst = '';
  let grandTotal = '';
  let diagnosis = '';
  let doctorName = '';

  if (sampleId === 'sample-1') {
    clinicTitle = 'DR. TAN & PARTNERS MEDICAL CLINIC';
    addressLine = '10 Marina Boulevard, #01-14 Marina Bay Link Mall';
    telLine = 'Tel: (65) 6538-2900 | Reg No: 201823901K';
    employeeName = 'Sarah Jenkins';
    receiptNo = 'INV-2026-09412';
    dateStr = '28-Sep-2026';
    doctorName = 'Dr. Marcus Tan (MBBS, FRACGP)';
    diagnosis = 'Acute Upper Respiratory Tract Infection (URTI) & Fever';
    items = [
      { name: 'Standard GP Consultation (Day)', qty: 1, price: '45.00' },
      { name: 'Paracetamol 500mg (20 Tabs)', qty: 1, price: '8.50' },
      { name: 'Promethazine Cough Linctus 100ml', qty: 1, price: '16.50' },
    ];
    subTotal = '70.00';
    gst = '6.30';
    grandTotal = '76.30';
  } else if (sampleId === 'sample-2') {
    clinicTitle = 'SMILECARE DENTAL SURGERY';
    addressLine = '391 Orchard Road, #08-02 Ngee Ann City';
    telLine = 'Tel: (65) 6733-4122 | GST Reg: M90382109X';
    employeeName = 'Jonathan Chen';
    receiptNo = 'DENT-2026-4491';
    dateStr = '29-Sep-2026';
    doctorName = 'Dr. Clara Wong (BDS Oral Surgery)';
    diagnosis = 'Routine Dental Scaling & Polishing, Fluoride Varnish';
    items = [
      { name: 'Full Mouth Scaling & Polishing', qty: 1, price: '120.00' },
      { name: 'Topical Fluoride Application', qty: 1, price: '30.00' },
      { name: 'Infection Control & PPE Surcharge', qty: 1, price: '10.00' },
    ];
    subTotal = '160.00';
    gst = '14.40';
    grandTotal = '174.40';
  } else if (sampleId === 'sample-3') {
    clinicTitle = 'NOVENA EYE & VISION SPECIALIST';
    addressLine = '290 Orchard Road, #14-06 Paragon Medical';
    telLine = 'Tel: (65) 6836-8800 | GST Reg: 201209384W';
    employeeName = 'Emily Rodriguez';
    receiptNo = 'EYE-2026-8921';
    dateStr = '30-Sep-2026';
    doctorName = 'Dr. Raymond Lim (FRCOphth)';
    diagnosis = 'Bilateral Dry Eye Syndrome & Allergic Conjunctivitis';
    items = [
      { name: 'Specialist Ophthalmologist Consultation', qty: 1, price: '180.00' },
      { name: 'Slit Lamp Biomicroscopy & Tear Test', qty: 1, price: '60.00' },
      { name: 'Systane Ultra Lubricant Eye Drops (Twin)', qty: 1, price: '48.00' },
    ];
    subTotal = '288.00';
    gst = '25.92';
    grandTotal = '313.92';
  } else {
    clinicTitle = 'REHABPLUS PHYSICAL THERAPY';
    addressLine = '100 Tras Street, #03-12 100 AM Mall';
    telLine = 'Tel: (65) 6444-1922 | GST Reg: 201633019R';
    employeeName = 'Michael Chang';
    receiptNo = 'PT-2026-1029';
    dateStr = '01-Oct-2026';
    doctorName = 'Physiotherapist: Aaron Tan (B.Sc PT)';
    diagnosis = 'Acute Lumbar Spine Strain & Manual Therapy Treatment';
    items = [
      { name: 'Initial Physiotherapy Assessment (45 mins)', qty: 1, price: '80.00' },
      { name: 'Spinal Mobilization & Deep Tissue Rehab', qty: 1, price: '40.00' },
    ];
    subTotal = '120.00';
    gst = '10.80';
    grandTotal = '130.80';
  }

  // Clinic Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px monospace, sans-serif';
  ctx.fillText(clinicTitle, canvas.width / 2, 80);

  ctx.fillStyle = '#475569';
  ctx.font = '13px monospace, sans-serif';
  ctx.fillText(addressLine, canvas.width / 2, 108);
  ctx.fillText(telLine, canvas.width / 2, 128);

  // Decorative dashed divider
  drawDashedLine(ctx, 40, 150, canvas.width - 40, 150);

  // Title: OFFICIAL TAX INVOICE / RECEIPT
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px monospace, sans-serif';
  ctx.fillText('OFFICIAL MEDICAL TAX INVOICE / RECEIPT', canvas.width / 2, 178);

  // Metadata block (left & right aligned)
  ctx.textAlign = 'left';
  ctx.font = '14px monospace, sans-serif';
  ctx.fillStyle = '#334155';

  let y = 220;
  ctx.fillText(`Receipt No: ${receiptNo}`, 48, y);
  ctx.fillText(`Date: ${dateStr}`, canvas.width - 240, y);

  y += 28;
  ctx.font = 'bold 15px monospace, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`Employee / Patient Name: ${employeeName}`, 48, y);

  y += 26;
  ctx.font = '14px monospace, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`Attending Practitioner: ${doctorName}`, 48, y);

  y += 28;
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 14px monospace, sans-serif';
  ctx.fillText(`Medical Summary / Diagnosis:`, 48, y);
  ctx.fillStyle = '#1e293b';
  ctx.font = '14px monospace, sans-serif';
  ctx.fillText(diagnosis, 48, y + 20);

  y += 44;
  drawDashedLine(ctx, 40, y, canvas.width - 40, y);

  // Table Header
  y += 30;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px monospace, sans-serif';
  ctx.fillText('DESCRIPTION', 48, y);
  ctx.fillText('QTY', canvas.width - 210, y);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT ($)', canvas.width - 48, y);

  y += 12;
  drawSolidLine(ctx, 40, y, canvas.width - 40, y);

  // Line items
  ctx.font = '14px monospace, sans-serif';
  ctx.fillStyle = '#1e293b';

  items.forEach((item) => {
    y += 30;
    ctx.textAlign = 'left';
    ctx.fillText(item.name, 48, y);
    ctx.fillText(item.qty.toString(), canvas.width - 200, y);
    ctx.textAlign = 'right';
    ctx.fillText(item.price, canvas.width - 48, y);
  });

  y += 30;
  drawDashedLine(ctx, 40, y, canvas.width - 40, y);

  // Sub-Total, GST, Grand Total Summary
  y += 36;
  ctx.textAlign = 'left';
  ctx.font = '15px monospace, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Sub-Total:', canvas.width - 320, y);
  ctx.textAlign = 'right';
  ctx.fillText(`$${subTotal}`, canvas.width - 48, y);

  y += 28;
  ctx.textAlign = 'left';
  ctx.fillText('GST (9%):', canvas.width - 320, y);
  ctx.textAlign = 'right';
  ctx.fillText(`$${gst}`, canvas.width - 48, y);

  y += 16;
  drawSolidLine(ctx, canvas.width - 330, y, canvas.width - 40, y);

  y += 34;
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px monospace, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('GRAND TOTAL:', canvas.width - 320, y);
  ctx.textAlign = 'right';
  ctx.fillText(`$${grandTotal}`, canvas.width - 48, y);

  y += 14;
  drawDoubleLine(ctx, canvas.width - 330, y, canvas.width - 40, y);

  // Payment status badge / stamp
  ctx.save();
  ctx.translate(140, y - 40);
  ctx.rotate(-0.15);
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3;
  ctx.strokeRect(-80, -25, 160, 50);
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 18px monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAID IN FULL', 0, 5);
  ctx.restore();

  // Footer notes & barcode
  y = 860;
  drawDashedLine(ctx, 40, y, canvas.width - 40, y);

  y += 30;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '12px monospace, sans-serif';
  ctx.fillText('Thank you for choosing our clinic. Please retain this receipt for insurance & corporate claims.', canvas.width / 2, y);

  // Barcode simulation
  y += 30;
  drawSimulatedBarcode(ctx, canvas.width / 2 - 120, y, 240, 36);

  return canvas.toDataURL('image/jpeg', 0.95);
}

function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawSolidLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawDoubleLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.moveTo(x1, y1 + 4);
  ctx.lineTo(x2, y2 + 4);
  ctx.stroke();
}

function drawSimulatedBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = '#1e293b';
  let curX = x;
  while (curX < x + width) {
    const barWidth = Math.floor(Math.random() * 3) + 1;
    const spaceWidth = Math.floor(Math.random() * 3) + 1;
    ctx.fillRect(curX, y, barWidth, height);
    curX += barWidth + spaceWidth;
  }
}
