
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, 
  Plus, 
  Download, 
  MoreVertical, 
  Trash2, 
  Loader2, 
  ChevronDown, 
  ListFilter, 
  ChevronLeft, 
  ChevronRight,
  X,
  User,
  Mail,
  MapPin,
  CreditCard,
  Check
} from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { fetchContacts, deleteContactAsync, createContactAsync } from '../store/contactsSlice';

const ContactsView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: contacts, isLoading } = useSelector((state: RootState) => state.contacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'Customer' as 'Customer' | 'Vendor',
    address: '',
    taxId: '',
    balance: '0.00'
  });

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please enter both Name and Email.");
      return;
    }

    setIsSaving(true);
    try {
      const initials = formData.name.substring(0, 2).toUpperCase();
      await dispatch(createContactAsync({
        ...formData,
        initials,
        balance: parseFloat(formData.balance)
      })).unwrap();
      
      setIsModalOpen(false);
      setFormData({ name: '', email: '', type: 'Customer', address: '', taxId: '', balance: '0.00' });
    } catch (err) {
      alert('Failed to create contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (window.confirm(`Delete contact ${name}?`)) {
      try {
        await dispatch(deleteContactAsync(id)).unwrap();
      } catch (err) {
        alert('Failed to delete contact');
      }
    }
  };

  // Avatar colors
  const avatarColors: Record<string, string> = {
    'AC': 'bg-blue-100 text-blue-600',
    'GS': 'bg-rose-50 text-rose-500',
    'JD': 'bg-orange-100 text-orange-500',
    'TS': 'bg-teal-100 text-teal-600',
    'BI': 'bg-purple-100 text-purple-600'
  };
  const getAvatarColor = (initials: string) => avatarColors[initials] || 'bg-gray-100 text-gray-500';

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.taxId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All Types' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Contacts & Clients</h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">Manage your customers and vendor relationships efficiently.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or tax ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-black focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
          />
        </div>
        
        <div className="relative">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[140px]"
          >
            <option>All Types</option>
            <option>Customer</option>
            <option>Vendor</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>

        <button className="p-2.5 text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
          <Download size={18} />
        </button>
        <button className="p-2.5 text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
          <ListFilter size={18} />
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/30 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Name & Email</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Address</th>
                  <th className="px-8 py-5">Tax ID</th>
                  <th className="px-8 py-5 text-center">Outstanding Balance</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${getAvatarColor(contact.initials)}`}>
                          {contact.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-400 font-medium">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        contact.type === 'Customer' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {contact.type}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs text-gray-500 font-semibold">{contact.address || 'N/A'}</td>
                    <td className="px-8 py-4">
                      <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600 border border-gray-200">{contact.taxId || 'UNSET'}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div>
                        <p className={`text-sm font-black ${Number(contact.balance) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          ${Number(contact.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        {Number(contact.balance) > 0 && <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter mt-0.5">Overdue</p>}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center items-center gap-1">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(contact.id, contact.name)}
                          className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No contacts match the criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
          Showing <span className="text-gray-900">1-{filteredContacts.length}</span> of <span className="text-gray-900">{contacts.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-xl shadow-sm"><ChevronLeft size={18} /></button>
          <button className="w-10 h-10 flex items-center justify-center text-xs font-bold rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">1</button>
          <button className="w-10 h-10 flex items-center justify-center text-xs font-bold rounded-xl bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 shadow-sm">2</button>
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-xl shadow-sm"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">New Contact</h3>
                <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new profile.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'Customer'})}
                    className={`py-3 rounded-2xl text-sm font-bold border transition-all ${formData.type === 'Customer' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                  >
                    Customer
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'Vendor'})}
                    className={`py-3 rounded-2xl text-sm font-bold border transition-all ${formData.type === 'Vendor' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                  >
                    Vendor
                  </button>
                </div>
              </div>

              <div className="space-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="billing@acmecorp.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500/10 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax ID</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                      placeholder="US-123456"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address (City/State)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="New York, NY"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  <span>Save Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsView;
