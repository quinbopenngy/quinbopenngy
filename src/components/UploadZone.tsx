import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, Sparkles, AlertCircle, CheckCircle2, RotateCw, CopySlash } from 'lucide-react';
import { SAMPLE_RECEIPTS, generateReceiptImage } from '../utils/sampleReceipts';
import { optimizeImageForOCR } from '../utils/imageCompressor';
import { computeFileHash, computeBase64Hash } from '../utils/fileHash';
import { MedicalClaimRecord } from '../types';

export interface QueueItem {
  id: string;
  name: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  fileData?: { base64: string; mimeType: string; name: string; fileHash?: string };
}

interface UploadZoneProps {
  records: MedicalClaimRecord[];
  onProcessImage: (
    fileData: { base64: string; mimeType: string; name: string; fileHash?: string },
    queueId?: string
  ) => Promise<void>;
  isProcessing: boolean;
  processingQueue: QueueItem[];
  onRetryItem?: (item: QueueItem) => void;
  onDuplicateDetected: (info: { fileName: string; reason: string; existingRecordId?: string }) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  records,
  onProcessImage,
  isProcessing,
  processingQueue,
  onRetryItem,
  onDuplicateDetected,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragCounter, setDragCounter] = useState(0);

  // Listen for clipboard paste events (e.g. user takes screenshot with Win+Shift+S or Cmd+Shift+4 and pastes)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processFile(blob, `pasted-receipt-${Date.now()}.png`);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [records, processingQueue]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const next = prev - 1;
      if (next <= 0) setIsDragOver(false);
      return next;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    for (const file of files) {
      await processFile(file, file.name);
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter((file) =>
      file.type.startsWith('image/')
    );

    for (const file of files) {
      await processFile(file, file.name);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const checkIsDuplicate = (
    hash: string,
    fileName: string
  ): { isDuplicate: boolean; reason: string; existingRecordId?: string } => {
    // 1. Check against records already in the table by hash
    const matchByHash = records.find(
      (r) => r.fileHash && r.fileHash === hash
    );
    if (matchByHash) {
      return {
        isDuplicate: true,
        reason: `Identical file content was already uploaded for ${matchByHash.employeeName} (${matchByHash.clinicName})`,
        existingRecordId: matchByHash.id,
      };
    }

    // 2. Check against records by filename
    const matchByName = records.find(
      (r) => r.fileName && r.fileName.toLowerCase() === fileName.toLowerCase()
    );
    if (matchByName) {
      return {
        isDuplicate: true,
        reason: `File with name "${fileName}" is already in the submitted claims table`,
        existingRecordId: matchByName.id,
      };
    }

    // 3. Check against items currently in active processing queue
    const matchInQueue = processingQueue.find(
      (item) =>
        (item.fileData?.fileHash && item.fileData.fileHash === hash) ||
        (item.fileData?.name && item.fileData.name.toLowerCase() === fileName.toLowerCase())
    );
    if (matchInQueue) {
      return {
        isDuplicate: true,
        reason: `File "${fileName}" is already in the processing queue`,
      };
    }

    return { isDuplicate: false, reason: '' };
  };

  const processFile = async (file: File, fileName: string): Promise<void> => {
    // Compute cryptographic hash of the incoming file
    const fileHash = await computeFileHash(file);

    // Duplicate check BEFORE any processing or upload!
    const dupCheck = checkIsDuplicate(fileHash, fileName);
    if (dupCheck.isDuplicate) {
      onDuplicateDetected({
        fileName,
        reason: dupCheck.reason,
        existingRecordId: dupCheck.existingRecordId,
      });
      return; // DO NOT upload into system!
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        // Optimize resolution for reliable OCR and lower network latency
        const { base64, mimeType } = await optimizeImageForOCR(rawBase64);

        await onProcessImage({
          base64,
          mimeType,
          name: fileName,
          fileHash,
        });
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSampleClick = async (sampleId: string) => {
    const sample = SAMPLE_RECEIPTS.find((s) => s.id === sampleId);
    if (!sample) return;

    const fileName = `${sample.title.replace(/\s+/g, '_')}.jpg`;
    const base64 = generateReceiptImage(sampleId);
    if (!base64) return;

    const fileHash = await computeBase64Hash(base64);

    // Check duplicate for sample receipt as well
    const dupCheck = checkIsDuplicate(fileHash, fileName);
    if (dupCheck.isDuplicate) {
      onDuplicateDetected({
        fileName,
        reason: dupCheck.reason,
        existingRecordId: dupCheck.existingRecordId,
      });
      return; // DO NOT upload into system
    }

    await onProcessImage({
      base64,
      mimeType: 'image/jpeg',
      name: fileName,
      fileHash,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs mb-6">
      {/* Upload Zone Drop Target */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 group ${
          isDragOver
            ? 'border-blue-600 bg-blue-50/70 scale-[0.995]'
            : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm ${
              isDragOver
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border border-slate-200'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-800">
            {isDragOver
              ? 'Drop medical receipt or MC here'
              : 'Upload or Drag & Drop Receipts / Medical Certificates (MC)'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Drag in photo/scan of receipt or MC, click to browse, or paste image with{' '}
            <kbd className="px-1.5 py-0.5 text-[11px] font-semibold bg-white border border-slate-300 rounded-md text-slate-600 shadow-2xs">
              Ctrl+V
            </kbd>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 flex items-center gap-1 text-slate-600 font-medium">
              <CopySlash className="w-3 h-3 text-amber-500" />
              Duplicate Prevention Active
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">
              Supports: Medical Bills, Clinic Invoices & MCs
            </span>
          </div>
        </div>
      </div>

      {/* Try with Sample Receipts banner */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>No medical receipt ready? Try instant samples:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {SAMPLE_RECEIPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSampleClick(sample.id);
                }}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={`${sample.clinic} - ${sample.amount}`}
              >
                <ImageIcon className="w-3 h-3 text-slate-500" />
                <span>{sample.title}</span>
                <span className="text-[10px] text-slate-400">({sample.amount})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Processing Queue List */}
      {processingQueue.length > 0 && (
        <div className="mt-4 space-y-2">
          {processingQueue.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs animate-in fade-in duration-300 ${
                item.status === 'error'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : item.status === 'done'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-blue-50/60 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                {item.status === 'processing' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                )}
                {item.status === 'queued' && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                )}
                {item.status === 'done' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {item.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-semibold truncate block">
                    {item.name}
                  </span>
                  {item.errorMessage && (
                    <span className="text-[11px] text-rose-600 block truncate">
                      {item.errorMessage}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold">
                  {item.status === 'processing' && 'Extracting with Gemini OCR...'}
                  {item.status === 'queued' && 'Queued...'}
                  {item.status === 'done' && 'Extracted'}
                  {item.status === 'error' && 'Failed'}
                </span>

                {item.status === 'error' && item.fileData && onRetryItem && (
                  <button
                    onClick={() => onRetryItem(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Retry OCR on this file"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
