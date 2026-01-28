
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState } from './store/store';
import { logout } from './store/authSlice';
import { setLanguage, Language } from './store/languageSlice';
import { translations } from './translations';
import { api } from './services/api';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  AlertCircle, 
  Folder, 
  PenTool, 
  ClipboardCheck, 
  XCircle, 
  Archive,
  Settings, 
  Search, 
  Plus, 
  LogOut,
  Bell,
  Menu,
  X,
  Database,
  CloudOff,
  Users,
  LayoutDashboard,
  CheckCircle2,
  FileEdit,
  Languages
} from 'lucide-react';

import DashboardView from './views/DashboardView';
import DocumentsView from './views/DocumentsView';
import NewDocumentView from './views/NewDocumentView';
import ContactsView from './views/ContactsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import RecordsManagementView from './views/RecordsManagementView';
import PendingReviewView from './views/PendingReviewView';
import InvoiceTemplatesView from './views/InvoiceTemplatesView';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import ForgotPasswordView from './views/ForgotPasswordView';
import ResetPasswordView from './views/ResetPasswordView';
import NewEvidenceModal from './components/NewEvidenceModal';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const Sidebar = ({ isMobileOpen, setIsMobileOpen }: { isMobileOpen: boolean, setIsMobileOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].nav;
  const isActive = (path: string) => location.pathname === path;

  const { items: documents } = useSelector((state: RootState) => state.documents);
  
  const overdueCount = documents.filter(d => d.status === 'Overdue').length;
  const openCount = documents.filter(d => d.status === 'Open').length;
  const pendingCount = documents.filter(d => d.status === 'Pending').length;
  const archivedCount = documents.filter(d => d.status === 'Archived').length;
  const canceledCount = documents.filter(d => d.status === 'Canceled').length;
  const paidCount = documents.filter(d => d.status === 'Paid').length;
  const draftCount = documents.filter(d => d.status === 'Draft').length;

  const mainNav = [
    { icon: LayoutDashboard, label: t.dashboard, path: '/' },
    { icon: FileSpreadsheet, label: t.all_receipts, path: '/documents' },
    { icon: Upload, label: t.outgoing, path: '/documents/outgoing' },
    { icon: Download, label: t.incoming, path: '/documents/incoming' },
  ];

  const filterNav: Array<{ icon: any; label: string; path: string; color?: string; badge?: number }> = [
    { icon: CheckCircle2, label: t.paid, path: '/documents/paid', color: 'text-green-500', badge: paidCount },
    { icon: Folder, label: t.open, path: '/documents/open', badge: openCount },
    { icon: AlertCircle, label: t.overdue, path: '/documents/overdue', color: 'text-red-500', badge: overdueCount },
    { icon: FileEdit, label: t.drafts, path: '/documents/draft', badge: draftCount },
    { icon: PenTool, label: t.designs, path: '/settings/templates' },
    { icon: ClipboardCheck, label: t.review, path: '/documents/pending', badge: pendingCount },
    { icon: XCircle, label: t.canceled, path: '/documents/records', color: 'text-orange-500', badge: canceledCount },
    { icon: Archive, label: t.archived, path: '/documents/archived', badge: archivedCount },
  ];

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100 transition-transform lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex flex-col items-center">
            <Link to="/" onClick={() => setIsMobileOpen(false)}>
              <img 
                src="https://i.postimg.cc/KvkHSw-wb/Screenshot-20260119-094110.png" 
                alt="Logo" 
                className="w-32 h-auto object-contain hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {mainNav.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  isActive(item.path) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="my-6 border-t border-gray-100" />

            {filterNav.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium relative group ${
                  isActive(item.path) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={18} className={item.color} />
                <span>{item.label}</span>
                {(item.badge !== undefined && item.badge > 0) && (
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1 flex items-center justify-center ${item.label === t.overdue || item.label === t.canceled ? 'bg-red-500' : 'bg-blue-500'} text-white text-[10px] rounded-full font-bold`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 space-y-1 border-t border-gray-100">
            <Link
              to="/settings"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                isActive('/settings') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings size={18} />
              <span>{t.settings}</span>
            </Link>
            <button 
              onClick={() => dispatch(logout())}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ setIsMobileOpen }: { setIsMobileOpen: (v: boolean) => void }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { current: lang } = useSelector((state: RootState) => state.language);
  const [dbStatus, setDbStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkStatus = async () => {
      const mode = await api.getMode();
      setDbStatus(mode);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-8 bg-white border-b border-gray-100">
      <div className="flex items-center gap-8">
        <button className="lg:hidden text-gray-600" onClick={() => setIsMobileOpen(true)}><Menu size={24} /></button>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
            {dbStatus.includes('Live') ? <Database size={12} className="text-green-500" /> : <CloudOff size={12} className="text-orange-500" />}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${dbStatus.includes('Live') ? 'text-green-600' : 'text-orange-600'}`}>
              {dbStatus}
            </span>
          </div>
        </nav>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => dispatch(setLanguage('de'))}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'de' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            DE
          </button>
          <button 
            onClick={() => dispatch(setLanguage('en'))}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            EN
          </button>
        </div>

        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder={translations[lang].common.search}
            className="w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-xs font-bold text-gray-900">{user?.name || 'Guest User'}</p>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">{lang === 'en' ? 'Session Active' : 'Sitzung Aktiv'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  const { current: lang } = useSelector((state: RootState) => state.language);
  return (
    <footer className="bg-white border-t border-gray-100 py-6 px-8">
      <div className="max-w-[1600px] mx-auto text-center">
        <p className="text-gray-400 text-xs font-medium">
          © {new Date().getFullYear()} Spedition Askari GmbH. {lang === 'en' ? 'Digital Logistic Solutions.' : 'Digitale Logistiklösungen.'}
        </p>
      </div>
    </footer>
  );
};

const MainLayout = ({ children, setIsMobileOpen, isMobileOpen }: { children?: React.ReactNode, setIsMobileOpen: (v: boolean) => void, isMobileOpen: boolean }) => {
  return (
    <div className="min-h-screen flex">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen bg-[#f9fafb]">
        <Header setIsMobileOpen={setIsMobileOpen} />
        <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Provider store={store}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<AuthRoute><LoginView /></AuthRoute>} />
          <Route path="/signup" element={<AuthRoute><SignupView /></AuthRoute>} />
          <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordView /></AuthRoute>} />
          <Route path="/reset-password" element={<AuthRoute><ResetPasswordView /></AuthRoute>} />
          
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen}>
                <Routes>
                  <Route path="/" element={<DashboardView />} />
                  <Route path="/documents" element={<DocumentsView />} />
                  <Route path="/documents/new" element={<NewDocumentView />} />
                  <Route path="/documents/records" element={<RecordsManagementView />} />
                  <Route path="/documents/pending" element={<PendingReviewView />} />
                  <Route path="/settings/templates" element={<InvoiceTemplatesView />} />
                  <Route path="/contacts" element={<ContactsView />} />
                  <Route path="/reports" element={<ReportsView />} />
                  <Route path="/settings" element={<SettingsView />} />
                  <Route path="/documents/outgoing" element={<DocumentsView activeInitialTab="Outgoing" />} />
                  <Route path="/documents/incoming" element={<DocumentsView activeInitialTab="Incoming" />} />
                  <Route path="/documents/overdue" element={<DocumentsView activeInitialTab="Overdue" />} />
                  <Route path="/documents/open" element={<DocumentsView activeInitialTab="Open" />} />
                  <Route path="/documents/paid" element={<DocumentsView activeInitialTab="Paid" />} />
                  <Route path="/documents/draft" element={<DocumentsView activeInitialTab="Draft" />} />
                  <Route path="/documents/archived" element={<RecordsManagementView initialTab="Archived" />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
        {isModalOpen && <NewEvidenceModal onClose={() => setIsModalOpen(false)} />}
      </HashRouter>
    </Provider>
  );
};

export default App;
