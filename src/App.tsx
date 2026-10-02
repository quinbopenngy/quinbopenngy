/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MedicalClaimRecord } from './types';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { UploadZone, QueueItem } from './components/UploadZone';
import { ClaimsTable } from './components/ClaimsTable';
import { RecordModal } from './components/RecordModal';
import { ManualAddModal } from './components/ManualAddModal';
import { exportClaimsToXLSX } from './utils/exportXlsx';
import { generateReceiptImage } from './utils/sampleReceipts';
import { CheckCircle2, AlertCircle, FileSpreadsheet, X } from 'lucide-react';

const STORAGE_KEY = 'mediclaim_submissions_v1';

function formatErrorMessage(raw: string | undefined): string {
  if (!raw) return 'Failed to extract receipt data. Please try again.';
  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
    return 'The AI model is experiencing a temporary spike in traffic. Please retry in a few moments.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached. Please wait a few seconds before retrying.';
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error?.message) {
      return formatErrorMessage(parsed.error.message);
    }
  } catch {
    // not JSON
  }
  return raw;
}

export default function App() {
  const [records, setRecords] = useState<MedicalClaimRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load records from localStorage', e);
    }
    // Initial sample record to show the table and report ready
    return [
      {
        id: 'init-1',
        employeeName: 'Sarah Jenkins',
        clinicName: 'Dr. Tan & Partners Medical Clinic',
        subTotal: 70.0,
        gst: 6.3,
        grandTotal: 76.3,
        illnessSummary: 'Acute Upper Respiratory Tract Infection (URTI) & Fever',
        currency: '$',
        receiptDate: '2026-09-28',
        receiptNumber: 'INV-2026-09412',
        receiptImage: generateReceiptImage('sample-1'),
        fileName: 'GP_Family_Clinic_Bill.jpg',
        status: 'extracted',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'init-2',
        employeeName: 'Jonathan Chen',
        clinicName: 'SmileCare Dental Surgery',
        subTotal: 160.0,
        gst: 14.4,
        grandTotal: 174.4,
        illnessSummary: 'Routine Dental Scaling & Polishing, Fluoride Varnish',
        currency: '$',
        receiptDate: '2026-09-29',
        receiptNumber: 'DENT-2026-4491',
        receiptImage: generateReceiptImage('sample-2'),
        fileName: 'Dental_Surgery_Invoice.jpg',
        status: 'extracted',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<QueueItem[]>([]);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);

  const [activeRecordForModal, setActiveRecordForModal] = useState<MedicalClaimRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [records]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text: formatErrorMessage(text), type });
  };

  const handleDuplicateDetected = ({
    fileName,
    reason,
    existingRecordId,
  }: {
    fileName: string;
    reason: string;
    existingRecordId?: string;
  }) => {
    showToast(
      `Duplicate detected: "${fileName}" was not uploaded. (${reason})`,
      'warning'
    );

    if (existingRecordId) {
      setHighlightedRecordId(existingRecordId);
      setTimeout(() => {
        const el = document.getElementById(`record-${existingRecordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Remove highlight after 5 seconds
      setTimeout(() => {
        setHighlightedRecordId(null);
      }, 5000);
    }
  };

  // OCR Processing Handler
  const handleProcessImage = async (
    fileData: { base64: string; mimeType: string; name: string; fileHash?: string },
    existingQueueId?: string
  ) => {
    const queueId =
      existingQueueId ||
      `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    if (existingQueueId) {
      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === existingQueueId
            ? { ...item, status: 'processing', errorMessage: undefined }
            : item
        )
      );
    } else {
      setProcessingQueue((prev) => [
        ...prev,
        { id: queueId, name: fileData.name, status: 'processing', fileData },
      ]);
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/extract-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: fileData.base64,
          mimeType: fileData.mimeType,
          fileName: fileData.name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract data from receipt');
      }

      const extracted = result.data;

      // Post-OCR Duplicate Check: Check if this receipt number already exists for the same clinic
      if (
        extracted.receiptNumber &&
        extracted.receiptNumber.trim().length > 3 &&
        extracted.clinicName
      ) {
        const normRef = extracted.receiptNumber.trim().toLowerCase();
        const normClinic = extracted.clinicName.trim().toLowerCase();

        const duplicateReceipt = records.find(
          (r) =>
            r.receiptNumber &&
            r.receiptNumber.trim().toLowerCase() === normRef &&
            (r.clinicName.toLowerCase().includes(normClinic.slice(0, 8)) ||
              normClinic.includes(r.clinicName.toLowerCase().slice(0, 8)))
        );

        if (duplicateReceipt) {
          setProcessingQueue((prev) => prev.filter((item) => item.id !== queueId));
          handleDuplicateDetected({
            fileName: fileData.name,
            reason: `Receipt/Invoice #${extracted.receiptNumber} from "${extracted.clinicName}" is already recorded in the system`,
            existingRecordId: duplicateReceipt.id,
          });
          return; // DO NOT upload duplicate into system!
        }
      }

      const newRecord: MedicalClaimRecord = {
        id: `ocr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employeeName: extracted.employeeName || 'Unknown Employee',
        clinicName: extracted.clinicName || 'Unknown Clinic',
        subTotal: Number(extracted.subTotal) || 0,
        gst: Number(extracted.gst) || 0,
        grandTotal: Number(extracted.grandTotal) || 0,
        illnessSummary: extracted.illnessSummary || 'Medical consultation',
        currency: extracted.currency || '$',
        receiptDate: extracted.receiptDate || new Date().toISOString().split('T')[0],
        receiptNumber: extracted.receiptNumber,
        receiptImage: fileData.base64,
        fileName: fileData.name,
        fileHash: fileData.fileHash,
        lineItems: extracted.lineItems,
        status: 'extracted',
        createdAt: new Date().toISOString(),
      };

      setRecords((prev) => [newRecord, ...prev]);

      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? { ...item, status: 'done', errorMessage: undefined }
            : item
        )
      );

      showToast(
        `Extracted: ${newRecord.employeeName} (${newRecord.clinicName}) - $${Number(newRecord.grandTotal).toFixed(2)}`,
        'success'
      );
    } catch (err: any) {
      console.error('OCR Error:', err);
      const friendlyErr = formatErrorMessage(err?.message);
      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? { ...item, status: 'error', errorMessage: friendlyErr, fileData }
            : item
        )
      );
      showToast(friendlyErr, 'error');
    } finally {
      setIsProcessing(false);
      // Remove done items from queue after 3.5 seconds
      setTimeout(() => {
        setProcessingQueue((prev) =>
          prev.filter((item) => item.id !== queueId || item.status === 'error')
        );
      }, 3500);
    }
  };

  const handleRetryItem = (item: QueueItem) => {
    if (item.fileData) {
      handleProcessImage(item.fileData, item.id);
    }
  };

  const handleExportAll = () => {
    if (records.length === 0) {
      showToast('No records available to export.', 'info');
      return;
    }
    const success = exportClaimsToXLSX(records);
    if (success) {
      showToast(`Exported ${records.length} records to Excel (.xlsx) file!`, 'success');
    }
  };

  const handleExportSelected = (selected: MedicalClaimRecord[]) => {
    if (selected.length === 0) return;
    const success = exportClaimsToXLSX(selected);
    if (success) {
      showToast(`Exported ${selected.length} selected record(s) to Excel!`, 'success');
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Record deleted.', 'info');
  };

  const handleClearAll = () => {
    setRecords([]);
    showToast('All medical records cleared.', 'info');
  };

  const handleViewRecord = (record: MedicalClaimRecord) => {
    setActiveRecordForModal(record);
    setIsRecordModalOpen(true);
  };

  const handleEditRecord = (record: MedicalClaimRecord) => {
    setActiveRecordForModal(record);
    setIsRecordModalOpen(true);
  };

  const handleSaveModalRecord = (updated: MedicalClaimRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast('Record updated successfully.', 'success');
  };

  const handleAddManualRecord = (newRecord: MedicalClaimRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    showToast(`Added claim for ${newRecord.employeeName}`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        records={records}
        onExport={handleExportAll}
        onOpenManualModal={() => setIsManualModalOpen(true)}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-300 max-w-md">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-700 text-white border-rose-600'
                : toastMessage.type === 'warning'
                ? 'bg-amber-800 text-amber-50 border-amber-700 ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            ) : (
              <AlertCircle
                className={`w-5 h-5 shrink-0 ${
                  toastMessage.type === 'warning' ? 'text-amber-300' : 'text-rose-300'
                }`}
              />
            )}
            <span className="flex-1 leading-snug">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors text-white/80 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Intro Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Medical Cost Submission
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Upload medical receipts or invoices to automatically extract employee names, clinic details, subtotals, GST, grand totals, and illness summaries via AI OCR.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleExportAll}
              disabled={records.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer ${
                records.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel Report (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <StatsCards records={records} />

        {/* Upload Zone (Drag and Drop + OCR Extraction with Duplicate Prevention) */}
        <UploadZone
          records={records}
          onProcessImage={handleProcessImage}
          isProcessing={isProcessing}
          processingQueue={processingQueue}
          onRetryItem={handleRetryItem}
          onDuplicateDetected={handleDuplicateDetected}
        />

        {/* Extracted Records Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Submitted Medical Cost Records
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                {records.length} {records.length === 1 ? 'claim' : 'claims'}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Click thumbnail or edit icon to verify & adjust extracted fields
            </p>
          </div>

          <ClaimsTable
            records={records}
            highlightedId={highlightedRecordId}
            onDeleteRecord={handleDeleteRecord}
            onEditRecord={handleEditRecord}
            onViewRecord={handleViewRecord}
            onExportSelected={handleExportSelected}
            onClearAll={handleClearAll}
          />
        </div>
      </main>

      {/* Modals */}
      <RecordModal
        record={activeRecordForModal}
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setActiveRecordForModal(null);
        }}
        onSave={handleSaveModalRecord}
      />

      <ManualAddModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleAddManualRecord}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediClaim System • Automated Medical Bill OCR & Excel Export</span>
          <span>Extracting: Employee, Clinic, Sub-Total, GST, Grand Total, Illness Summary</span>
        </div>
      </footer>
    </div>
  );
}
