
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  ArrowLeft, 
  Save, 
  FileText, 
  User, 
  DollarSign, 
  Calendar, 
  Loader2,
  Upload,
  Sparkles,
  CheckCircle2,
  FileType,
  ChevronDown
} from 'lucide-react';
import { createDocumentAsync, fetchDocuments } from '../store/documentsSlice';
import { fetchContacts } from '../store/contactsSlice';
import { AppDispatch, RootState } from '../store/store';
import { Status } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { translations } from '../translations';

const NewDocumentView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const commonT = translations[lang].common;
  const t = translations[lang].documents;
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: contacts } = useSelector((state: RootState) => state.contacts);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);

  // Default selection is 'Pending' which maps to 'To be checked' tab
  const [selectedCategory, setSelectedCategory] = useState<string>('Pending');
  const [formData, setFormData] = useState({
    reference: '',
    type: 'Invoice',
    contact: '',
    amount: '',
    currency: 'EUR',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.reference.trim()) newErrors.reference = 'Reference is required';
    if (!formData.contact.trim()) newErrors.contact = 'Client name is required';
    if (!formData.amount || isNaN(Number(formData.amount))) newErrors.amount = 'Valid amount is required';
    if (!formData.date) newErrors.date = 'Date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);
    setExtractSuccess(false);

    try {
      const base64Data = await fileToBase64(file);
      await extractInvoiceData(base64Data);
    } catch (error) {
      console.error("Extraction failed:", error);
      alert("AI extraction failed. Please enter details manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const extractInvoiceData = async (base64: string) => {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Act as a professional logistics auditor. Extract data from this invoice PDF and return it in the following JSON format ONLY:
    {
      "reference": "string",
      "contact": "string",
      "amount": "number",
      "date": "YYYY-MM-DD",
      "dueDate": "YYYY-MM-DD",
      "currency": "EUR/USD",
      "type": "Invoice/Bill"
    }`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      const extracted = JSON.parse(text);
      
      setFormData(prev => ({
        ...prev,
        reference: extracted.reference || prev.reference,
        contact: extracted.contact || prev.contact,
        amount: extracted.amount?.toString() || prev.amount,
        date: extracted.date || prev.date,
        dueDate: extracted.dueDate || prev.dueDate,
        currency: extracted.currency || prev.currency,
        type: extracted.type || prev.type
      }));
      
      setExtractSuccess(true);
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const selectedContact = contacts.find(c => c.name.toLowerCase() === formData.contact.toLowerCase());
      
      let finalType = formData.type;
      let finalStatus: Status = 'Open';

      // Advanced Category Logic for Mapping to Status or Type
      switch (selectedCategory) {
        case 'Incoming':
          finalType = 'Bill';
          finalStatus = 'Open';
          break;
        case 'Outgoing':
          finalType = 'Invoice';
          finalStatus = 'Open';
          break;
        case 'Pending':
          finalStatus = 'Pending';
          break;
        case 'Paid':
          finalStatus = 'Paid';
          break;
        case 'Overdue':
          finalStatus = 'Overdue';
          break;
        case 'Draft':
          finalStatus = 'Draft';
          break;
        case 'Canceled':
          finalStatus = 'Canceled';
          break;
        case 'Archived':
          finalStatus = 'Archived';
          break;
        default:
          finalStatus = 'Open';
      }

      // If we have an uploaded file, upload it to the server first
      let filename = null;
      let file_path = null;

      if (uploadedFile) {
        try {
          const base64 = await fileToBase64(uploadedFile);
          // @ts-ignore
          const uploadRes = await api.uploadFile(uploadedFile.name, base64);
          if (uploadRes.success) {
            filename = uploadRes.filename;
            file_path = uploadRes.filePath;
          }
        } catch (err) {
          console.error("File upload failed:", err);
        }
      }

      const payload = {
        reference: formData.reference,
        type: selectedCategory === 'Incoming' ? 'Bill' : 'Invoice',
        contact: formData.contact,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: formData.date,
        dueDate: formData.dueDate,
        status: finalStatus,
        contactInitials: selectedContact?.initials || formData.contact.substring(0, 2).toUpperCase(),
        uploadedBy: user?.name || 'Admin',
        source: uploadedFile ? 'PDF Upload' : 'Manual',
        filename,
        file_path
      };
      
      await dispatch(createDocumentAsync(payload)).unwrap();
      await dispatch(fetchDocuments());

      // Routing Logic
      let targetPath = '/documents';
      if (selectedCategory === 'Incoming') targetPath = '/documents/incoming';
      else if (selectedCategory === 'Outgoing') targetPath = '/documents/outgoing';
      else if (selectedCategory === 'Paid') targetPath = '/documents/paid';
      else if (selectedCategory === 'Pending') targetPath = '/documents/pending';
      else if (selectedCategory === 'Overdue') targetPath = '/documents/overdue';
      else if (selectedCategory === 'Draft') targetPath = '/documents/draft';
      else if (selectedCategory === 'Canceled') targetPath = '/documents/records';
      else if (selectedCategory === 'Archived') targetPath = '/documents/archived';
      else if (selectedCategory === 'Open') targetPath = '/documents/open';

      navigate(targetPath);
    } catch (error) {
      alert('Error saving document: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors">{lang === 'de' ? 'Start' : 'Home'}</Link>
          <ChevronRight size={12} />
          <Link to="/documents" className="hover:text-blue-600 transition-colors">{lang === 'de' ? 'Dokumente' : 'Documents'}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-bold uppercase tracking-wider">{lang === 'de' ? 'Beleg verarbeiten' : 'Process PDF Invoice'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/documents')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 shadow-sm transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{commonT.upload}</h2>
          </div>
          {extractSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-100 rounded-full animate-bounce">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase">{lang === 'de' ? 'Daten extrahiert' : 'Data Extracted'}</span>
            </div>
          )}
        </div>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center bg-white ${
          isExtracting ? 'border-blue-400 bg-blue-50/20' : 'border-gray-200 hover:border-blue-500 hover:bg-gray-50'
        }`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
        
        {isExtracting ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <Sparkles className="absolute -top-1 -right-1 text-yellow-500 animate-pulse" size={20} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-black">{lang === 'de' ? 'KI extrahiert Daten...' : 'AI Extracting Data...'}</p>
              <p className="text-sm text-gray-400 font-medium">{lang === 'de' ? 'Beträge und Referenznummern werden gelesen' : 'Reading amounts and reference numbers'}</p>
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-4 text-black">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
              <FileType size={40} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-black">{uploadedFile.name}</p>
              <p className="text-sm text-blue-600 font-bold uppercase tracking-widest">{lang === 'de' ? 'Upload abgeschlossen' : 'Upload Complete'}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="p-6 bg-gray-50 text-gray-400 rounded-full group-hover:scale-110 transition-transform">
              <Upload size={40} />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-black">{lang === 'de' ? 'Rechnung (PDF) auswählen' : 'Select Invoice PDF'}</p>
              <p className="text-sm text-gray-400 font-medium mt-1">{lang === 'de' ? 'KI füllt Formularfelder automatisch aus' : 'AI will automatically fill the form fields'}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{lang === 'de' ? 'Verifizierungsdetails' : 'Verification Details'}</h3>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'de' ? 'Standard Dokumententyp' : 'Default Document Type'}</label>
                <div className="relative">
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full pl-4 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none appearance-none"
                  >
                    <option value="Invoice">{lang === 'de' ? 'Ausgangsrechnung' : 'Invoice'}</option>
                    <option value="Bill">{lang === 'de' ? 'Eingangsrechnung' : 'Bill'}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].table.reference}</label>
                <input type="text" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10" placeholder="e.g. RE-2025-001" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].table.contact}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} placeholder="Extracted client name..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].table.amount}</label>
                <div className="relative">
                  <input type="text" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10" placeholder="0.00" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">{formData.currency}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'de' ? 'Währung' : 'Currency'}</label>
                <div className="relative">
                  <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full pl-4 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none appearance-none">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{lang === 'de' ? 'Klassifizierung' : 'Classification'}</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'de' ? 'Ziel-Kategorie / Status' : 'Target Page Category'}</label>
                <div className="relative">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none appearance-none"
                  >
                    <option value="Pending">{t.status_labels.Pending}</option>
                    <option value="Open">{t.status_labels.Open}</option>
                    <option value="Paid">{t.status_labels.Paid}</option>
                    <option value="Overdue">{t.status_labels.Overdue}</option>
                    <option value="Draft">{t.status_labels.Draft}</option>
                    <option value="Canceled">{t.status_labels.Canceled}</option>
                    <option value="Archived">{t.status_labels.Archived}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'de' ? 'Rechnungsdatum' : 'Invoice Date'}</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].table.due}</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-500/20 space-y-4">
             <button type="submit" disabled={isSaving || isExtracting} className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl">
               {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
               {lang === 'de' ? 'Speichern unter' : 'Save to'} {t.status_labels[selectedCategory as keyof typeof t.status_labels] || selectedCategory}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewDocumentView;
