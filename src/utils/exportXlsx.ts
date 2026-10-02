import * as XLSX from 'xlsx';
import { MedicalClaimRecord } from '../types';

export function exportClaimsToXLSX(records: MedicalClaimRecord[], customFilename?: string) {
  if (records.length === 0) return false;

  // Prepare header info and tabular data
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `Medical_Cost_Claims_${dateStr}.xlsx`;

  // Calculate totals
  const totalSubTotal = records.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const totalGst = records.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const totalGrandTotal = records.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);

  // Build rows array with clean formatting
  const rows: any[][] = [
    ['COMPANY MEDICAL EXPENSES SUBMISSION REPORT'],
    [`Generated Date: ${new Date().toLocaleString()}`, '', '', '', '', '', '', '', `Total Claims: ${records.length}`],
    [], // Blank line
    [
      'Item No.',
      'Name of Employee',
      'Clinic Name',
      'Sub-Total ($)',
      'GST ($)',
      'Grand Total ($)',
      'Summary of Illness / Diagnosis',
      'Consultation Date',
      'Receipt / Invoice No.',
      'Status',
    ],
  ];

  records.forEach((record, index) => {
    rows.push([
      index + 1,
      record.employeeName || 'N/A',
      record.clinicName || 'N/A',
      Number(record.subTotal || 0).toFixed(2),
      Number(record.gst || 0).toFixed(2),
      Number(record.grandTotal || 0).toFixed(2),
      record.illnessSummary || 'N/A',
      record.receiptDate || 'N/A',
      record.receiptNumber || 'N/A',
      record.status === 'extracted' ? 'OCR Verified' : record.status === 'manual' ? 'Manual Entry' : 'Pending',
    ]);
  });

  // Append Total Row
  rows.push([]);
  rows.push([
    'TOTAL',
    '',
    '',
    totalSubTotal.toFixed(2),
    totalGst.toFixed(2),
    totalGrandTotal.toFixed(2),
    `Total of ${records.length} claim(s)`,
    '',
    '',
    '',
  ]);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for beautiful presentation
  worksheet['!cols'] = [
    { wch: 10 }, // Item No
    { wch: 24 }, // Name of Employee
    { wch: 30 }, // Clinic Name
    { wch: 16 }, // Sub-Total
    { wch: 14 }, // GST
    { wch: 16 }, // Grand Total
    { wch: 38 }, // Summary of Illness
    { wch: 18 }, // Date
    { wch: 22 }, // Receipt No
    { wch: 16 }, // Status
  ];

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Claims');

  // Trigger download
  XLSX.writeFile(workbook, filename);
  return true;
}
