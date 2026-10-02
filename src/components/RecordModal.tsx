import React, { useState, useEffect } from 'react';
import { MedicalClaimRecord } from '../types';
import { X, ZoomIn, Check, Calculator, Building2, User, AlertCircle, Receipt } from 'lucide-react';

interface RecordModalProps {
  record: MedicalClaimRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: MedicalClaimRecord) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<MedicalClaimRecord | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

  if (!isOpen || !formData) return null;

  const handleSubTotalChange = (val: number) => {
    setFormData((prev) => {
      if (!prev) return null;
      const gst = prev.gst || 0;
      return {
        ...prev,
        subTotal: val,
        // Optional quick auto-recompute grandTotal if desired
      };
    });
  };

  const handleAutoComputeTotal = () => {
    if (!formData) return;
    const sub = Number(formData.subTotal) || 0;
    const tax = Number(formData.gst) || 0;
    setFormData({
      ...formData,
      grandTotal: Number((sub + tax).toFixed(2)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    onSave(formData);
    onClose();
  };

  const mathDiscrepancy =
    Math.abs(
      (Number(formData.subTotal) || 0) +
        (Number(formData.gst) || 0) -
        (Number(formData.grandTotal) || 0)
    ) > 0.05;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Verify & Edit Medical Claim
              </h3>
              <p className="text-xs text-slate-500">
                Compare original receipt with extracted OCR fields
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Side-by-side or stacked on mobile */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Original Receipt Preview */}
            <div className="md:col-span-5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Original Receipt Scan
                </span>
                {formData.receiptImage && (
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{isZoomed ? 'Fit to window' : 'Zoom In'}</span>
                  </button>
                )}
              </div>

              <div
                className={`bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[260px] max-h-[460px] ${
                  isZoomed ? 'overflow-auto cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              >
                {formData.receiptImage ? (
                  <img
                    src={formData.receiptImage}
                    alt="Receipt source"
                    className={`transition-all duration-200 ${
                      isZoomed ? 'scale-150 transform-origin-top' : 'max-h-[440px] w-auto object-contain'
                    }`}
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    No receipt image stored for this entry.
                  </div>
                )}
              </div>

              {formData.fileName && (
                <p className="text-[11px] text-slate-400 mt-2 truncate">
                  Source: {formData.fileName}
                </p>
              )}
            </div>

            {/* Right: Editable Form with the 6 core fields */}
            <div className="md:col-span-7 space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Extracted Medical Claim Data
                </h4>
              </div>

              {/* 1. Name of Employee */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Name of Employee <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.employeeName}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeName: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden"
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>
              </div>

              {/* 2. Clinic Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Clinic Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.clinicName}
                    onChange={(e) =>
                      setFormData({ ...formData, clinicName: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden"
                    placeholder="e.g. Dr. Tan & Partners Medical Clinic"
                  />
                </div>
              </div>

              {/* 3, 4, 5: Sub-Total, GST, Grand Total */}
              <div className="grid grid-cols-3 gap-3">
                {/* 3. Sub-Total */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Sub-Total ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.subTotal}
                    onChange={(e) =>
                      handleSubTotalChange(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden text-right font-medium"
                  />
                </div>

                {/* 4. GST */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    4. GST ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.gst}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gst: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden text-right font-medium text-amber-700"
                  />
                </div>

                {/* 5. Grand Total */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    5. Grand Total ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.grandTotal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        grandTotal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-blue-50 focus:bg-white border border-blue-300 focus:border-blue-600 rounded-lg focus:outline-hidden text-right font-bold text-blue-900"
                  />
                </div>
              </div>

              {/* Math Check warning if discrepancy */}
              {mathDiscrepancy && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Sub-total (${formData.subTotal}) + GST (${formData.gst}) ≠ Grand Total (${formData.grandTotal})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoComputeTotal}
                    className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 ml-2 cursor-pointer underline text-[11px]"
                  >
                    <Calculator className="w-3 h-3" />
                    Auto-sum
                  </button>
                </div>
              )}

              {/* 6. Summary of Illness */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6. Summary of Illness / Diagnosis <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.illnessSummary}
                  onChange={(e) =>
                    setFormData({ ...formData, illnessSummary: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden"
                  placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI) & Fever"
                />
              </div>

              {/* Secondary fields: Date & Receipt Number */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Consultation Date
                  </label>
                  <input
                    type="text"
                    value={formData.receiptDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, receiptDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    placeholder="e.g. 2026-09-28"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Receipt / Invoice Ref No.
                  </label>
                  <input
                    type="text"
                    value={formData.receiptNumber || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, receiptNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    placeholder="e.g. INV-2026-09412"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
