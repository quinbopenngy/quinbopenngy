import React from 'react';
import { FileSpreadsheet, Plus, Sparkles, Receipt, Download } from 'lucide-react';
import { MedicalClaimRecord } from '../types';

interface NavbarProps {
  records: MedicalClaimRecord[];
  onExport: () => void;
  onOpenManualModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ records, onExport, onOpenManualModal }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-900 tracking-tight">MediClaim</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Gemini OCR
              </span>
            </div>
            <p className="text-xs text-slate-500">Medical Cost Submission & Verification System</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenManualModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Add Manually
          </button>

          <button
            onClick={onExport}
            disabled={records.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${
              records.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download XLSX</span>
            {records.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[11px] bg-emerald-800/40 text-emerald-100 rounded-full font-bold">
                {records.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
