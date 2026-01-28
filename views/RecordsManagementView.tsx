
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Download, Trash2, RotateCcw, ChevronRight, FileText, Archive, AlertCircle } from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { deleteDocumentAsync } from '../store/documentsSlice';
import { exportToCSV, downloadMockPDF } from '../utils/fileUtils';
import { Document } from '../types';

interface RecordsManagementViewProps {
  initialTab?: string;
}

const RecordsManagementView: React.FC<RecordsManagementViewProps> = ({ initialTab = 'Canceled' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  
  const { items: allDocuments } = useSelector((state: RootState) => state.documents);

  // Filter archived documents from main items
  const archivedRecords = useMemo(() => 
    allDocuments.filter(doc => doc.status === 'Archived'),
    [allDocuments]
  );

  // Filter canceled documents from main items
  const canceledRecords = useMemo(() => 
    allDocuments.filter(doc => doc.status === 'Canceled'),
    [allDocuments]
  );

  // Determine which list to show based on active tab
  const displayData = useMemo(() => {
    let data = activeTab === 'Canceled' ? canceledRecords : archivedRecords;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = (data as Document[]).filter(doc => 
        doc.reference.toLowerCase().includes(q) || 
        doc.contact.toLowerCase().includes(q)
      );
    }
    return data;
  }, [activeTab, canceledRecords, archivedRecords, searchQuery]);

  const handleExport = () => {
    const filename = `Askari_${activeTab}_Log_${new Date().toISOString().split('T')[0]}`;
    const exportData = displayData.map(doc => ({
      ID: doc.reference,
      Contact: doc.contact,
      Amount: `${doc.amount} ${doc.currency}`,
      Date: doc.date,
      Status: doc.status,
      Type: doc.type
    }));
        
    exportToCSV(exportData, filename);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Permanently delete this ${activeTab.toLowerCase()} record?`)) {
      try {
        await dispatch(deleteDocumentAsync(id)).unwrap();
        alert('Record deleted permanently.');
      } catch (error) {
        alert("Error: " + error);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span className="hover:text-blue-600 cursor-pointer">Home</span> 
          <ChevronRight size={10} /> 
          <span>Documents</span> 
          <ChevronRight size={10} /> 
          <span className="text-gray-900 font-bold uppercase tracking-wider">Records Management</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Records Management</h2>
            <p className="text-gray-500 mt-1 font-medium">Safe storage for inactive, canceled, and archived financial history.</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} className="text-blue-600" />
            Export {activeTab} Log
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100 px-8 pt-4 bg-gray-50/20">
          <button 
            onClick={() => setActiveTab('Canceled')}
            className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all relative ${activeTab === 'Canceled' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${activeTab === 'Canceled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>×</div>
            Canceled Records
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'Canceled' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>{canceledRecords.length}</span>
            {activeTab === 'Canceled' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('Archived')}
            className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all relative ${activeTab === 'Archived' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Archive size={16} className={activeTab === 'Archived' ? 'text-blue-600' : 'text-gray-400'} />
            Archived Records
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'Archived' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>{archivedRecords.length}</span>
            {activeTab === 'Archived' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        </div>

        <div className="p-6 flex flex-wrap gap-4 items-center bg-gray-50/10">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search in ${activeTab.toLowerCase()} records...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[11px] font-bold uppercase tracking-widest border-y border-gray-50 bg-gray-50/30">
                <th className="px-8 py-4">Document Ref</th>
                <th className="px-8 py-4">Contact & Amount</th>
                <th className="px-8 py-4">{activeTab === 'Canceled' ? 'Date' : 'Archival Date'}</th>
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayData.map((doc: Document) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-gray-500">{doc.reference}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${doc.status === 'Canceled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{doc.contact}</p>
                        <p className="text-xs text-gray-400 font-bold">{doc.currency} {doc.amount}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500 font-medium">{new Date(doc.date).toLocaleDateString()}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600 border border-blue-200 uppercase">
                        {(doc.uploadedBy || 'System').split(' ').map((n:string) => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{doc.uploadedBy || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border border-current/10 whitespace-nowrap ${doc.status === 'Canceled' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => downloadMockPDF(doc)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Permanent Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {displayData.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-gray-50 rounded-full">
                <AlertCircle size={32} className="text-gray-300" />
              </div>
              <div>
                <p className="text-gray-500 font-bold">No Records Found</p>
                <p className="text-gray-400 text-xs font-medium max-w-xs mx-auto">There are no {activeTab.toLowerCase()} documents matching your current criteria.</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 flex items-center justify-between border-t border-gray-50 bg-white">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Displaying <span className="text-gray-900">{displayData.length}</span> results
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 rounded-xl cursor-not-allowed">Previous</button>
            <button className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordsManagementView;
