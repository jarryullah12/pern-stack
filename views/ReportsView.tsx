
import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingCart, Briefcase, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import { RootState, AppDispatch } from '../store/store';
import { fetchDocuments } from '../store/documentsSlice';
import { exportToCSV } from '../utils/fileUtils';

const ReportsView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: documents, isLoading } = useSelector((state: RootState) => state.documents);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  // Calculate Dynamic Financial Totals
  const financials = useMemo(() => {
    const revenue = documents
      .filter(d => d.type === 'Invoice' && d.status === 'Paid')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const expenses = documents
      .filter(d => d.type === 'Bill' && d.status === 'Paid')
      .reduce((sum, d) => sum + Math.abs(Number(d.amount)), 0);

    const netProfit = revenue - expenses;
    const growth = revenue > 0 ? '12.5%' : '0%';

    return { revenue, expenses, netProfit, growth };
  }, [documents]);

  // Generate Chart Data from real document history
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const stats = months.map(m => ({ month: m, revenue: 0, target: 500 }));

    documents.forEach(doc => {
      const date = new Date(doc.date);
      if (doc.type === 'Invoice' && doc.status === 'Paid') {
        const monthIdx = date.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          stats[monthIdx].revenue += Number(doc.amount);
          stats[monthIdx].target = stats[monthIdx].revenue > 0 ? stats[monthIdx].revenue * 1.1 : 500;
        }
      }
    });

    const currentMonth = new Date().getMonth();
    return stats.slice(0, currentMonth + 1);
  }, [documents]);

  // Calculate Expense Categories dynamically based on contacts
  const expenseCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    const paidBills = documents.filter(d => d.type === 'Bill' && d.status === 'Paid');
    
    paidBills.forEach(bill => {
      categories[bill.contact] = (categories[bill.contact] || 0) + Math.abs(Number(bill.amount));
    });

    const total = Object.values(categories).reduce((a, b) => a + b, 0);
    
    return Object.entries(categories)
      .map(([label, value]) => ({
        label,
        value: total > 0 ? `${Math.round((value / total) * 100)}%` : '0%',
        color: 'bg-blue-500'
      }))
      .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
      .slice(0, 4);
  }, [documents]);

  const handleExport = () => {
    exportToCSV(documents, `Financial_Report_${new Date().toISOString().split('T')[0]}`);
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-500 font-bold">Generating report from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Overview</h2>
          <p className="text-gray-500 mt-1">Track your business performance and financial health.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
            <Calendar size={18} className="text-gray-400" />
            Full Year {new Date().getFullYear()}
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Download size={18} />
            Export Full Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          data={{ 
            label: 'Net Profit', 
            value: financials.netProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), 
            change: financials.growth, 
            trend: 'up' 
          }}
          icon={TrendingUp}
          iconColor="text-green-600" iconBg="bg-green-50"
        />
        <StatCard 
          data={{ 
            label: 'Total Revenue', 
            value: financials.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), 
            change: '5.2%', 
            trend: 'up' 
          }}
          icon={DollarSign}
          iconColor="text-blue-600" iconBg="bg-blue-50"
        />
        <StatCard 
          data={{ 
            label: 'Total Expenses', 
            value: financials.expenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), 
            change: '2.1%', 
            trend: 'down' 
          }}
          icon={ShoppingCart}
          iconColor="text-orange-600" iconBg="bg-orange-50"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Monthly Sales Performance</h3>
            <p className="text-sm text-gray-500 mt-1">Revenue trends from paid invoices</p>
          </div>
        </div>
        
        <div className="h-[400px]">
          {monthlyData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px' }} />
                <Bar dataKey="revenue" name="Actual Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={45} />
                <Bar dataKey="target" name="Target" fill="#dbeafe" radius={[6, 6, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <p className="text-gray-400 font-medium">No sales data available in the database yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
