
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Globe, 
  Save, 
  ChevronRight, 
  Building2, 
  CreditCard, 
  Scale, 
  MapPin,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertTriangle,
  UserX
} from 'lucide-react';
import { logout } from '../store/authSlice';
import { AppDispatch } from '../store/store';

const SettingsView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded state for comprehensive company identity
  const [companyData, setCompanyData] = useState({
    legalName: 'Spedition Askari GmbH',
    tradingName: 'Askari Logistics',
    email: 'invoice@spedition-askari.de',
    phone: '+49 5731 1530960',
    website: 'www.spedition-askari.de',
    address: 'Südbahnstraße 31',
    city: '32584 Löhne',
    country: 'Germany',
    amtsgericht: 'Bünde',
    hrNr: '20414',
    ustId: 'DE348127058',
    steuerNr: '310/5003/2632',
    management: 'Tanveer Askari',
    bankName: 'Volksbank in Ostwestfalen',
    iban: 'DE45 4786 0125 0620 1700 00',
    bic: 'GENODEM1GTL'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "WARNING: This action is permanent. Deleting your account will remove all your data, settings, and documents from our servers. Are you sure you want to proceed?"
    );

    if (confirmDelete) {
      setIsDeleting(true);
      // Simulate account deletion
      setTimeout(() => {
        setIsDeleting(false);
        dispatch(logout());
        navigate('/login');
        alert("Account successfully deleted. We are sorry to see you go.");
      }, 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Breadcrumbs & Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span className="hover:text-blue-600 cursor-pointer">Settings</span>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-bold uppercase tracking-wider">Company Identity</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Company Identity</h2>
            <p className="text-gray-500 mt-1">Configure the official information used on your invoices and documents.</p>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20 ${
              showSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : showSuccess ? (
              <CheckCircle2 size={18} />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? 'Saving...' : showSuccess ? 'Saved successfully' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General & Contact */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information Section */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">General Information</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Company Name</label>
                <input 
                  type="text" 
                  name="legalName"
                  value={companyData.legalName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trading / Brand Name</label>
                <input 
                  type="text" 
                  name="tradingName"
                  value={companyData.tradingName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headquarters Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    name="address"
                    value={companyData.address}
                    onChange={handleInputChange}
                    placeholder="Street and house number"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ZIP & City</label>
                <input 
                  type="text" 
                  name="city"
                  value={companyData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Country</label>
                <input 
                  type="text" 
                  name="country"
                  value={companyData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Legal & Registry Section */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Scale size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Legal & Tax Registry</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Management (CEO)</label>
                <input 
                  type="text" 
                  name="management"
                  value={companyData.management}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">District Court (Amtsgericht)</label>
                <input 
                  type="text" 
                  name="amtsgericht"
                  value={companyData.amtsgericht}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">HR Number</label>
                <input 
                  type="text" 
                  name="hrNr"
                  value={companyData.hrNr}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VAT ID (USt-IdNr.)</label>
                <input 
                  type="text" 
                  name="ustId"
                  value={companyData.ustId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax Number (Steuer-Nr.)</label>
                <input 
                  type="text" 
                  name="steuerNr"
                  value={companyData.steuerNr}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bank & Contact Channels */}
        <div className="space-y-8">
          {/* Bank Details Section */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <CreditCard size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Bank Details</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Institution</label>
                <input 
                  type="text" 
                  name="bankName"
                  value={companyData.bankName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IBAN</label>
                <input 
                  type="text" 
                  name="iban"
                  value={companyData.iban}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-mono" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BIC / SWIFT</label>
                <input 
                  type="text" 
                  name="bic"
                  value={companyData.bic}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Contact Channels Section */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Globe size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Communication</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="email" 
                    name="email"
                    value={companyData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    name="phone"
                    value={companyData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Official Website</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    name="website"
                    value={companyData.website}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-red-50/30 border border-red-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-red-100 flex items-center gap-3 bg-red-50/50">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider">Danger Zone</h3>
        </div>
        <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-gray-900">Delete Account</h4>
            <p className="text-sm text-gray-500 font-medium">
              Permanently remove your account, all company data, and documents. This action is irreversible.
            </p>
          </div>
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <UserX size={18} />
            )}
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
