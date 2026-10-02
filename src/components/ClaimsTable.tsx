import React, { useState, useMemo } from 'react';
import { MedicalClaimRecord } from '../types';
import {
  Search,
  Trash2,
  Edit3,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  User,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface ClaimsTableProps {
  records: MedicalClaimRecord[];
  highlightedId?: string | null;
  onDeleteRecord: (id: string) => void;
  onEditRecord: (record: MedicalClaimRecord) => void;
  onViewRecord: (record: MedicalClaimRecord) => void;
  onExportSelected: (selectedRecords: MedicalClaimRecord[]) => void;
  onClearAll: () => void;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({
  records,
  highlightedId,
  onDeleteRecord,
  onEditRecord,
  onViewRecord,
  onExportSelected,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'grandTotal' | 'employeeName' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        r.employeeName?.toLowerCase().includes(q) ||
        r.clinicName?.toLowerCase().includes(q) ||
        r.illnessSummary?.toLowerCase().includes(q) ||
        r.receiptNumber?.toLowerCase().includes(q) ||
        r.receiptDate?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      if (sortField === 'grandTotal') {
        const diff = (Number(a.grandTotal) || 0) - (Number(b.grandTotal) || 0);
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortField === 'employeeName') {
        const diff = (a.employeeName || '').localeCompare(b.employeeName || '');
        return sortOrder === 'asc' ? diff : -diff;
      }
      // createdAt
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });

    return result;
  }, [records, searchQuery, sortField, sortOrder]);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} selected medical claim(s)?`)) {
      selectedIds.forEach((id) => onDeleteRecord(id));
      setSelectedIds(new Set());
    }
  };

  const handleExportSelected = () => {
    const selected = records.filter((r) => selectedIds.has(r.id));
    if (selected.length > 0) {
      onExportSelected(selected);
    }
  };

  const toggleSort = (field: 'grandTotal' | 'employeeName' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Column sums for filtered records
  const totalSubTotal = filteredRecords.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const totalGst = filteredRecords.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const totalGrandTotal = filteredRecords.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee, clinic, or illness..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-hidden transition-colors"
          />
        </div>

        {/* Selected Batch Actions & Clear */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleExportSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Selected ({selectedIds.size})</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            </>
          )}

          {records.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all submitted records?')) {
                  onClearAll();
                  setSelectedIds(new Set());
                }
              }}
              className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1.5 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-2 w-10">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
                  title="Select All"
                >
                  {filteredRecords.length > 0 && selectedIds.size === filteredRecords.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3.5 px-3 w-12 text-center">#</th>
              <th className="py-3.5 px-3 w-16 text-center">Receipt</th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-900 select-none"
                onClick={() => toggleSort('employeeName')}
              >
                <div className="flex items-center gap-1">
                  <span>1. Name of Employee</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3">2. Clinic Name</th>
              <th className="py-3.5 px-3 text-right">3. Sub-Total</th>
              <th className="py-3.5 px-3 text-right">4. GST</th>
              <th
                className="py-3.5 px-3 text-right cursor-pointer hover:text-slate-900 select-none"
                onClick={() => toggleSort('grandTotal')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>5. Grand Total</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 min-w-[200px]">6. Summary of Illness</th>
              <th className="py-3.5 px-3 text-center">Date / Ref</th>
              <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">
                      {records.length === 0 ? 'No medical claims added yet' : 'No matching records found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {records.length === 0
                        ? 'Upload or drag and drop a medical receipt above, or try one of the instant sample bills.'
                        : 'Try adjusting your search keywords.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const isSelected = selectedIds.has(record.id);
                const isHighlighted = highlightedId === record.id;

                return (
                  <tr
                    key={record.id}
                    id={`record-${record.id}`}
                    className={`transition-all duration-300 group ${
                      isHighlighted
                        ? 'bg-amber-100/80 ring-2 ring-amber-500 shadow-sm'
                        : isSelected
                        ? 'bg-blue-50/50'
                        : 'hover:bg-blue-50/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 pl-4 pr-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(record.id)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Index */}
                    <td className="py-3.5 px-3 text-center font-medium text-slate-400 text-xs">
                      {index + 1}
                    </td>

                    {/* Receipt Thumbnail */}
                    <td className="py-3.5 px-3 text-center">
                      {record.receiptImage ? (
                        <button
                          onClick={() => onViewRecord(record)}
                          className="relative group/thumb inline-block rounded-md overflow-hidden border border-slate-200 hover:border-blue-500 shadow-2xs cursor-pointer"
                          title="Click to view full receipt"
                        >
                          <img
                            src={record.receiptImage}
                            alt="Receipt"
                            className="w-10 h-10 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs italic">N/A</span>
                      )}
                    </td>

                    {/* 1. Name of Employee */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-[180px]">
                          {record.employeeName || 'Unknown Employee'}
                        </span>
                      </div>
                    </td>

                    {/* 2. Clinic Name */}
                    <td className="py-3.5 px-3 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px] sm:max-w-[200px]" title={record.clinicName}>
                          {record.clinicName || 'Unknown Clinic'}
                        </span>
                      </div>
                    </td>

                    {/* 3. Sub-Total */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                      ${Number(record.subTotal || 0).toFixed(2)}
                    </td>

                    {/* 4. GST */}
                    <td className="py-3.5 px-3 text-right font-medium text-amber-700">
                      ${Number(record.gst || 0).toFixed(2)}
                    </td>

                    {/* 5. Grand Total */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        ${Number(record.grandTotal || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* 6. Summary of Illness */}
                    <td className="py-3.5 px-3">
                      <div className="max-w-[220px] sm:max-w-[280px]">
                        <span
                          className="inline-block text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 line-clamp-2"
                          title={record.illnessSummary}
                        >
                          {record.illnessSummary || 'General consultation'}
                        </span>
                      </div>
                    </td>

                    {/* Date / Ref */}
                    <td className="py-3.5 px-3 text-center text-xs text-slate-500">
                      <div className="font-medium text-slate-700">{record.receiptDate || '-'}</div>
                      {record.receiptNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{record.receiptNumber}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewRecord(record)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="View Receipt & Verify"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditRecord(record)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Claim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Sums */}
          {filteredRecords.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-900">
                <td className="py-3 pl-4 pr-2"></td>
                <td colSpan={4} className="py-3 px-3 text-right uppercase text-xs tracking-wider text-slate-500">
                  Sub-Totals & Total ({filteredRecords.length} records):
                </td>
                <td className="py-3 px-3 text-right text-slate-800">
                  ${totalSubTotal.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-amber-700">
                  ${totalGst.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-blue-700 font-bold text-sm">
                  ${totalGrandTotal.toFixed(2)}
                </td>
                <td colSpan={3} className="py-3 px-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
