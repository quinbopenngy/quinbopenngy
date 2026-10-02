import React, { useState } from 'react';
import { MedicalClaimRecord } from '../types';
import { X, Plus, Calculator, Building2, User, Receipt } from 'lucide-react';

interface ManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newRecord: MedicalClaimRecord) => void;
}

export const ManualAddModal: React.FC<ManualAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [subTotal, setSubTotal] = useState<string>('');
  const [gst, setGst] = useState<string>('');
  const [grandTotal, setGrandTotal] = useState<string>('');
  const [illnessSummary, setIllnessSummary] = useState('');
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [receiptNumber, setReceiptNumber] = useState('');

  if (!isOpen) return null;

  const handleSubTotalBlur = () => {
    const sub = parseFloat(subTotal) || 0;
    // If GST is empty or 0, suggest standard 9% GST or auto-fill
    if (!gst && sub > 0) {
      const calcGst = Number((sub * 0.09).toFixed(2));
      setGst(calcGst.toString());
      if (!grandTotal) {
        setGrandTotal((sub + calcGst).toFixed(2));
      }
    }
  };

  const handleAutoSum = () => {
    const sub = parseFloat(subTotal) || 0;
    const tax = parseFloat(gst) || 0;
    setGrandTotal((sub + tax).toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sub = parseFloat(subTotal) || 0;
    const tax = parseFloat(gst) || 0;
    const total = parseFloat(grandTotal) || sub + tax;

    const newRecord: MedicalClaimRecord = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employeeName: employeeName.trim(),
      clinicName: clinicName.trim(),
      subTotal: sub,
      gst: tax,
      grandTotal: total,
      illnessSummary: illnessSummary.trim(),
      currency: '$',
      receiptDate: receiptDate.trim(),
      receiptNumber: receiptNumber.trim() || undefined,
      status: 'manual',
      createdAt: new Date().toISOString(),
    };

    onAdd(newRecord);
    // Reset and close
    setEmployeeName('');
    setClinicName('');
    setSubTotal('');
    setGst('');
    setGrandTotal('');
    setIllnessSummary('');
    setReceiptNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add Medical Claim Manually</h3>
              <p className="text-xs text-slate-500">Record a claim without receipt scan</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
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
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden"
                placeholder="e.g. Alex Tan"
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
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden"
                placeholder="e.g. Raffles Medical Group"
              />
            </div>
          </div>

          {/* 3, 4, 5: Sub-Total, GST, Grand Total */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Sub-Total ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={subTotal}
                onChange={(e) => setSubTotal(e.target.value)}
                onBlur={handleSubTotalBlur}
                className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden text-right font-medium"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. GST ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden text-right font-medium text-amber-700"
                placeholder="0.00"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-900">
                  5. Total ($) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoSum}
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Compute Subtotal + GST"
                >
                  <Calculator className="w-2.5 h-2.5" /> Sum
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={grandTotal}
                onChange={(e) => setGrandTotal(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-blue-50 focus:bg-white border border-blue-300 focus:border-blue-600 rounded-lg focus:outline-hidden text-right font-bold text-blue-900"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* 6. Summary of Illness */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6. Summary of Illness / Diagnosis <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={illnessSummary}
              onChange={(e) => setIllnessSummary(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-hidden"
              placeholder="e.g. Consultation for severe migraine and tension headache"
            />
          </div>

          {/* Date & Ref No. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Consultation Date
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Receipt / Invoice Ref No.
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                placeholder="e.g. RM-99410"
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              <Plus className="w-4 h-4" />
              <span>Add Record to Table</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
