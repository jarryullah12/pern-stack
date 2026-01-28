
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download, Trash2, ArrowDown, FileText, Receipt, FileSearch } from 'lucide-react';
import { Document, Status } from '../types';
import { deleteDocumentAsync } from '../store/documentsSlice';
import { RootState, AppDispatch } from '../store/store';
import { downloadMockPDF } from '../utils/fileUtils';
import { translations } from '../translations';

interface InvoiceTableProps {
  documents: Document[];
  compact?: boolean;
}

const StatusBadge = ({ status, lang }: { status: Status, lang: 'en' | 'de' }) => {
  const styles: Record<Status, string> = {
    'Paid': 'bg-green-50 text-green-600 border border-green-100',
    'Overdue': 'bg-red-50 text-red-600 border border-red-100',
    'Open': 'bg-blue-50 text-blue-600 border border-blue-100',
    'Draft': 'bg-gray-100 text-gray-500 border border-gray-200',
    'Pending': 'bg-yellow-50 text-yellow-600 border border-yellow-100',
    'Canceled': 'bg-orange-50 text-orange-600 border border-orange-100',
    'Archived': 'bg-gray-50 text-gray-500 border border-gray-100',
    'High Priority': 'bg-orange-100 text-orange-700 border border-orange-200',
    'Flagged': 'bg-red-100 text-red-700 border border-red-200'
  };

  const labels: Record<string, Record<Status, string>> = {
    en: {
      'Paid': 'Paid',
      'Overdue': 'Overdue',
      'Open': 'Open',
      'Draft': 'Draft',
      'Pending': 'Pending',
      'Canceled': 'Canceled',
      'Archived': 'Archived',
      'High Priority': 'High Priority',
      'Flagged': 'Flagged'
    },
    de: {
      'Paid': 'Bezahlt',
      'Overdue': 'Überfällig',
      'Open': 'Offen',
      'Draft': 'Entwurf',
      'Pending': 'Anstehend',
      'Canceled': 'Storniert',
      'Archived': 'Archiviert',
      'High Priority': 'Hohe Priorität',
      'Flagged': 'Markiert'
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${styles[status]}`}>
      {labels[lang][status]}
    </span>
  );
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ documents, compact = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].table;

  const handleAction = async (e: React.MouseEvent, action: string, doc: Document) => {
    e.stopPropagation();
    if (action === 'Delete') {
      const confirmMsg = lang === 'de' 
        ? `Möchten Sie das Dokument ${doc.reference} wirklich dauerhaft löschen?`
        : `Are you sure you want to permanently delete document ${doc.reference}?`;
        
      if (window.confirm(confirmMsg)) {
        try {
          await dispatch(deleteDocumentAsync(doc.id)).unwrap();
        } catch (error) {
          alert('Error: ' + error);
        }
      }
    } else if (action === 'Download') {
      await downloadMockPDF(doc);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="border-b border-gray-100 bg-gray-50/30">
          <tr>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors">
                {t.date} <ArrowDown size={14} />
              </div>
            </th>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.type}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.reference}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.contact}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">{t.amount}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.status}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">{t.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(doc.date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {doc.dueDate && <span className="text-[10px] text-gray-400 font-medium">{t.due}: {doc.dueDate}</span>}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    doc.type?.toLowerCase() === 'invoice' ? 'bg-indigo-50 text-indigo-600' : 
                    doc.type?.toLowerCase() === 'bill' ? 'bg-amber-50 text-amber-600' : 
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {doc.type?.toLowerCase() === 'invoice' ? <FileText size={16} /> : doc.type?.toLowerCase() === 'bill' ? <Receipt size={16} /> : <FileSearch size={16} />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {doc.type?.toLowerCase() === 'invoice' ? (lang === 'de' ? 'Ausgang' : 'Invoice') : (lang === 'de' ? 'Eingang' : 'Bill')}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span 
                  onClick={(e) => handleAction(e, 'Download', doc)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  {doc.reference}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 border border-blue-200">
                    {doc.contactInitials || doc.contact.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{doc.contact}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-bold ${Number(doc.amount) < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {Number(doc.amount) < 0 ? '-' : ''}{Math.abs(Number(doc.amount)).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{doc.currency}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={doc.status} lang={lang} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={(e) => handleAction(e, 'Download', doc)}
                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title={lang === 'de' ? 'PDF ansehen' : 'View PDF'}
                  >
                    <FileSearch size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleAction(e, 'Download', doc)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    title={lang === 'de' ? 'PDF herunterladen' : 'Download PDF'}
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleAction(e, 'Delete', doc)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title={lang === 'de' ? 'Datensatz löschen' : 'Delete Record'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
