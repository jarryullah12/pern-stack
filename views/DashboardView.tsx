
import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Clock, AlertCircle, Loader2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import InvoiceTable from '../components/InvoiceTable';
import { RootState, AppDispatch } from '../store/store';
import { fetchDocuments } from '../store/documentsSlice';
import { translations } from '../translations';

const DashboardView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].dashboard;
  const { items: documents, isLoading } = useSelector((state: RootState) => state.documents);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const statsSummary = useMemo(() => {
    const totalRevenue = documents
      .filter(d => d.type === 'Invoice' && d.status === 'Paid')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const outstanding = documents
      .filter(d => (d.status === 'Open' || d.status === 'Pending') && d.type === 'Invoice')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const overdue = documents
      .filter(d => d.status === 'Overdue' && d.type === 'Invoice')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const pendingCount = documents.filter(d => d.status === 'Pending').length;

    return { totalRevenue, outstanding, overdue, pendingCount };
  }, [documents]);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-500 font-bold animate-pulse">{lang === 'en' ? 'Syncing with Cloud Database...' : 'Synchronisierung mit Datenbank...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t.title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          data={{ label: t.revenue, value: statsSummary.totalRevenue.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }), trend: 'up' }} 
          icon={DollarSign}
        />
        <StatCard 
          data={{ label: t.outstanding, value: statsSummary.outstanding.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }), subtext: `${statsSummary.pendingCount} ${t.pending_approval}` }} 
          icon={Clock}
        />
        <StatCard 
          data={{ label: t.overdue, value: statsSummary.overdue.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }), subtext: t.action_required }} 
          icon={AlertCircle} iconColor="text-red-500" iconBg="bg-red-50"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">{t.live_records}</h3>
          <button className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">{t.refresh}</button>
        </div>
        <InvoiceTable documents={documents.slice(0, 5)} />
      </div>
    </div>
  );
};

export default DashboardView;
