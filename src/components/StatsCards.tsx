import React from 'react';
import { MedicalClaimRecord } from '../types';
import { DollarSign, FileText, Percent, ReceiptText } from 'lucide-react';

interface StatsCardsProps {
  records: MedicalClaimRecord[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ records }) => {
  const totalClaims = records.length;
  const totalSubTotal = records.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const totalGst = records.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const totalGrandTotal = records.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
  const averageClaim = totalClaims > 0 ? totalGrandTotal / totalClaims : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Claims */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Claims</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{totalClaims}</span>
          <span className="text-xs text-slate-400">
            {totalClaims === 1 ? 'record' : 'records'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Avg: ${averageClaim.toFixed(2)} / claim
        </p>
      </div>

      {/* Sub-Total */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sub-Total</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <ReceiptText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-slate-900">${totalSubTotal.toFixed(2)}</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Pre-tax medical expenses</p>
      </div>

      {/* GST Amount */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total GST / Tax</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-amber-700">${totalGst.toFixed(2)}</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Claimable goods & service tax</p>
      </div>

      {/* Grand Total */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-xl p-4 shadow-md shadow-blue-900/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Grand Total Claim</span>
          <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center backdrop-blur-xs">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-extrabold tracking-tight">${totalGrandTotal.toFixed(2)}</span>
        </div>
        <p className="mt-1 text-[11px] text-blue-200/80">Net payout for submission</p>
      </div>
    </div>
  );
};
