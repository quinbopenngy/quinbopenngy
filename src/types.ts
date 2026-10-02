export interface LineItem {
  description: string;
  amount: number;
}

export interface MedicalClaimRecord {
  id: string;
  employeeName: string;
  clinicName: string;
  subTotal: number;
  gst: number;
  grandTotal: number;
  illnessSummary: string;
  currency: string;
  receiptDate?: string;
  receiptNumber?: string;
  receiptImage?: string; // base64 or object URL for preview
  fileName?: string;
  fileHash?: string; // SHA-256 cryptographic hash of the image file
  lineItems?: LineItem[];
  status: 'extracted' | 'manual' | 'processing' | 'error';
  errorMessage?: string;
  createdAt: string;
}

export interface OCRExtractResult {
  employeeName: string;
  clinicName: string;
  subTotal: number;
  gst: number;
  grandTotal: number;
  illnessSummary: string;
  currency?: string;
  receiptDate?: string;
  receiptNumber?: string;
  lineItems?: LineItem[];
}
