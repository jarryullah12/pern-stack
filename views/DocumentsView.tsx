
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Filter, Download, Search, ChevronRight, Plus, Mail, Loader2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import InvoiceTable from '../components/InvoiceTable';
import { RootState, AppDispatch } from '../store/store';
import { fetchDocuments } from '../store/documentsSlice';
import { exportToCSV } from '../utils/fileUtils';
import { Document } from '../types';
import { translations } from '../translations';
import { api } from '../services/api';

interface DocumentsViewProps {
  activeInitialTab?: string;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ activeInitialTab = 'All' }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].documents;
  
  const { items: documents } = useSelector((state: RootState) => state.documents);
  const [activeTab, setActiveTab] = useState(activeInitialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  useEffect(() => {
    setActiveTab(activeInitialTab);
  }, [activeInitialTab]);

  const counts = useMemo(() => {
    return {
      All: documents.length,
      Incoming: documents.filter(d => d.type?.toLowerCase() === 'bill').length,
      Outgoing: documents.filter(d => d.type?.toLowerCase() === 'invoice').length,
      Overdue: documents.filter(d => d.status === 'Overdue').length,
      Open: documents.filter(d => d.status === 'Open').length,
      Pending: documents.filter(d => d.status === 'Pending').length,
      Archived: documents.filter(d => d.status === 'Archived').length,
      Canceled: documents.filter(d => d.status === 'Canceled').length,
      Paid: documents.filter(d => d.status === 'Paid').length,
      Draft: documents.filter(d => d.status === 'Draft').length,
    };
  }, [documents]);

  const tabs = [
    { name: t.tabs.all, id: 'All', count: counts.All },
    { name: t.tabs.incoming, id: 'Incoming', count: counts.Incoming },
    { name: t.tabs.outgoing, id: 'Outgoing', count: counts.Outgoing },
    { name: t.tabs.paid, id: 'Paid', count: counts.Paid },
    { name: t.tabs.review, id: 'Pending', count: counts.Pending },
    { name: t.tabs.overdue, id: 'Overdue', count: counts.Overdue },
    { name: t.tabs.open, id: 'Open', count: counts.Open },
    { name: t.tabs.draft, id: 'Draft', count: counts.Draft },
    { name: t.tabs.canceled, id: 'Canceled', count: counts.Canceled },
    { name: t.tabs.archived, id: 'Archived', count: counts.Archived },
  ];

  const filteredDocuments = useMemo(() => {
    let docs: Document[] = [...documents];
    
    if (activeTab === 'Incoming') docs = docs.filter(d => d.type?.toLowerCase() === 'bill');
    else if (activeTab === 'Outgoing') docs = docs.filter(d => d.type?.toLowerCase() === 'invoice');
    else if (activeTab === 'Overdue') docs = docs.filter(d => d.status === 'Overdue');
    else if (activeTab === 'Open') docs = docs.filter(d => d.status === 'Open');
    else if (activeTab === 'Pending') docs = docs.filter(d => d.status === 'Pending');
    else if (activeTab === 'Archived') docs = docs.filter(d => d.status === 'Archived');
    else if (activeTab === 'Paid') docs = docs.filter(d => d.status === 'Paid');
    else if (activeTab === 'Draft') docs = docs.filter(d => d.status === 'Draft');
    else if (activeTab === 'Canceled') docs = docs.filter(d => d.status === 'Canceled');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => 
        d.reference.toLowerCase().includes(q) || 
        d.contact.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [activeTab, searchQuery, documents]);

  const handleExport = () => {
    exportToCSV(filteredDocuments, `Askari_Documents_${activeTab}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleEmailSync = async () => {
    setIsSyncing(true);
    try {
      const result = await api.syncEmailInvoices();
      if (result.success) {
        if (result.imported > 0) {
          alert(lang === 'de' ? `${result.imported} Belege erfolgreich von IONOS importiert!` : `${result.imported} documents successfully imported from IONOS!`);
        }
        dispatch(fetchDocuments());
      } else if (result.demo) {
        alert("Demo Mode: IMAP Sync simulated. In live environment, this connects to imap.ionos.de.");
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isSyncing && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
               <Loader2 size={64} className="text-blue-600 animate-spin mx-auto" />
               <Mail size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {lang === 'en' ? 'Connecting to IONOS IMAP...' : 'Verbindung zum IONOS IMAP...'}
            </h3>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest animate-pulse">
              {lang === 'en' ? 'Scanning inbox for new invoices' : 'Posteingang nach neuen Rechnungen scannen'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors">{lang === 'de' ? 'Start' : 'Home'}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-bold uppercase tracking-wider">{t.history}</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t.records}</h2>
            <p className="text-gray-500 mt-1 font-medium">{t.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleEmailSync}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
            >
              <Mail size={16} />
              {lang === 'de' ? 'IONOS Sync' : 'IONOS Sync'}
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <Download size={16} />
              {translations[lang].common.export}
            </button>
            <button 
              onClick={() => navigate('/documents/new')}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus size={18} />
              {translations[lang].common.upload}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.name}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={t.search_placeholder} 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/20 transition-all outline-none shadow-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <InvoiceTable documents={filteredDocuments} />
        {filteredDocuments.length === 0 && (
          <div className="px-8 py-20 text-center flex flex-col items-center justify-center gap-3">
             <div className="p-4 bg-gray-50 rounded-full">
               <Filter size={32} className="text-gray-300" />
             </div>
             <div>
               <p className="text-gray-900 font-bold">{t.no_records}</p>
               <p className="text-gray-400 text-sm">{t.no_records_subtitle}</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsView;
