
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Download, Layers, FileText, CheckCircle, Trash2, AlertCircle, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { exportToCSV } from '../utils/fileUtils';
import { RootState, AppDispatch } from '../store/store';
import { fetchDocuments, updateDocumentAsync, deleteDocumentAsync } from '../store/documentsSlice';
import { Link } from 'react-router-dom';
import { translations } from '../translations';
import { Status } from '../types';

const PendingReviewView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].documents;
  const tableT = translations[lang].table;
  
  const { items: allDocuments, isLoading } = useSelector((state: RootState) => state.documents);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Local state to track chosen target status for each row
  const [targetStatuses, setTargetStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const pendingDocs = useMemo(() => {
    return allDocuments.filter(doc => doc.status === 'Pending');
  }, [allDocuments]);

  const filteredDocs = useMemo(() => {
    return pendingDocs.filter(doc => 
      doc.reference.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.contact.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pendingDocs, searchQuery]);

  const handleExport = () => {
    exportToCSV(filteredDocs, `Pending_Review_${new Date().toISOString().split('T')[0]}`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map(d => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApprove = async (id: string) => {
    const targetStatus = targetStatuses[id] || 'Open';
    setActionLoading(id);
    try {
      await dispatch(updateDocumentAsync({ id, updates: { status: targetStatus } })).unwrap();
    } catch (error) {
      alert('Error approving document: ' + error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = lang === 'de' ? 'Diesen Beleg wirklich löschen?' : 'Permanently delete this pending document?';
    if (window.confirm(confirmMsg)) {
      setActionLoading(id);
      try {
        await dispatch(deleteDocumentAsync(id)).unwrap();
      } catch (error) {
        alert('Error: ' + error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleBulkAction = async (action: 'verify' | 'delete') => {
    if (selectedIds.length === 0) return;
    const confirmMsg = action === 'verify' 
      ? `Are you sure you want to approve ${selectedIds.length} documents?`
      : `Are you sure you want to delete ${selectedIds.length} documents?`;
    
    if (window.confirm(confirmMsg)) {
      setActionLoading('bulk');
      try {
        for (const id of selectedIds) {
          if (action === 'verify') {
            const targetStatus = targetStatuses[id] || 'Open';
            await dispatch(updateDocumentAsync({ id, updates: { status: targetStatus } })).unwrap();
          } else {
            await dispatch(deleteDocumentAsync(id)).unwrap();
          }
        }
        setSelectedIds([]);
      } catch (error) {
        alert('Bulk action failed: ' + error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const statusOptions: Status[] = ['Open', 'Paid', 'Overdue', 'Draft', 'Canceled', 'Archived'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link to="/" className="hover:text-blue-600">{lang === 'de' ? 'Start' : 'Home'}</Link>
          <ChevronRight size={10} />
          <span className="text-gray-900 font-bold uppercase tracking-wider">{t.tabs.review}</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{lang === 'de' ? 'Prüfwarteschlange' : 'Review Queue'}</h2>
            <p className="text-gray-500 mt-1 font-medium">
              {pendingDocs.length} {lang === 'de' ? 'Belege warten auf Verifizierung und Status-Zuweisung.' : 'documents waiting for verification and status assignment.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <Download size={18} />
              {lang === 'de' ? 'Log exportieren' : 'Export Log'}
            </button>
            
            <div className="relative group">
              <button 
                disabled={selectedIds.length === 0 || actionLoading !== null}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm border ${
                  selectedIds.length > 0 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95' 
                    : 'bg-white text-gray-300 border-gray-200 cursor-not-allowed opacity-50'
                }`}
              >
                {actionLoading === 'bulk' ? <Loader2 className="animate-spin" size={18} /> : <Layers size={18} />}
                {lang === 'de' ? 'Massenaktion' : 'Bulk Actions'} {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
              
              {selectedIds.length > 0 && actionLoading === null && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 hidden group-hover:block overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => handleBulkAction('verify')}
                    className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors text-left"
                  >
                    <CheckCircle size={18} /> {lang === 'de' ? 'Alle freigeben' : 'Approve Selected'}
                  </button>
                  <button 
                    onClick={() => handleBulkAction('delete')}
                    className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50 text-left"
                  >
                    <Trash2 size={18} /> {lang === 'de' ? 'Alle löschen' : 'Delete Selected'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder={t.search_placeholder}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/20 transition-all outline-none shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{lang === 'de' ? 'Warteschlange wird synchronisiert...' : 'Syncing Queue...'}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-5 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredDocs.length && filteredDocs.length > 0}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-5">{tableT.reference}</th>
                <th className="px-8 py-5">{tableT.contact}</th>
                <th className="px-8 py-5">{tableT.date}</th>
                <th className="px-8 py-5 text-right">{tableT.amount}</th>
                <th className="px-8 py-5 text-center">{tableT.target_status}</th>
                <th className="px-8 py-5 text-center">{tableT.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className={`transition-colors group ${selectedIds.includes(doc.id) ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-6 py-5">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{doc.reference}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{doc.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 border border-blue-200">
                        {doc.contactInitials}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{doc.contact}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-gray-500">
                    {new Date(doc.date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US')}
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-gray-900 text-right">
                    {doc.currency} {Number(doc.amount).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="relative inline-block w-48 text-left">
                      <select 
                        value={targetStatuses[doc.id] || 'Open'}
                        onChange={(e) => setTargetStatuses({...targetStatuses, [doc.id]: e.target.value as Status})}
                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none appearance-none cursor-pointer"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt}>{t.status_labels[opt]}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleApprove(doc.id)}
                        disabled={actionLoading !== null}
                        className="px-4 py-2.5 bg-blue-600 text-white text-[11px] font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center gap-2"
                      >
                        {actionLoading === doc.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                        {tableT.approve}
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        disabled={actionLoading !== null}
                        className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!isLoading && filteredDocs.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center gap-4">
            <div className="p-5 bg-gray-50 rounded-full">
               <AlertCircle className="text-gray-300" size={48} />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{lang === 'de' ? 'Warteschlange leer!' : 'Queue Clear!'}</p>
              <p className="text-gray-400 font-medium text-sm">
                {lang === 'de' ? 'Keine Belege zur Überprüfung vorhanden.' : 'No pending documents require review at this moment.'}
              </p>
            </div>
          </div>
        )}
        
        <div className="px-8 py-6 flex items-center justify-between border-t border-gray-50 bg-white">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {lang === 'de' ? 'Anzahl:' : 'Queue Size:'} <span className="text-gray-900">{filteredDocs.length}</span>
          </p>
          <div className="flex gap-2">
            <button className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed">
              {lang === 'de' ? 'Zurück' : 'Previous'}
            </button>
            <button className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
              {lang === 'de' ? 'Weiter' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingReviewView;
