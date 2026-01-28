
import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ChevronRight, Check, MoreVertical, ArrowLeft, Save, Layout, 
  Settings2, FileText, CreditCard, Loader2, CheckCircle, Send,
  Printer, Download, AlertCircle, FileCheck, ShieldCheck, Mail, Share2, 
  Globe, SendHorizontal, Lock, Server, Paperclip, User, Upload, FileType, 
  X, ExternalLink, ShieldAlert, Plus, Trash2 
} from 'lucide-react';
import { api } from '../services/api';
import { RootState, AppDispatch } from '../store/store';
import { createDocumentAsync, fetchDocuments } from '../store/documentsSlice';
import { translations } from '../translations';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceItem {
  description: string;
  subDescription: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
}

interface InvoiceData {
  companyName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  invoiceNo: string;
  date: string;
  deliveryDate: string;
  reference: string;
  customerNo: string;
  contactPerson: string;
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerCountry: string;
  items: InvoiceItem[];
  taxRate: number;
  bankName: string;
  iban: string;
  bic: string;
  amtsgericht: string;
  hrNr: string;
  ustId: string;
  steuerNr: string;
  management: string;
}

const InvoiceTemplatesView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const { user } = useSelector((state: RootState) => state.auth);
  const t = translations[lang].editor;
  
  const [view, setView] = useState<'gallery' | 'edit'>('gallery');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [clientEmail, setClientEmail] = useState('');
  const [emailPdf, setEmailPdf] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert(lang === 'en' ? "Please upload a PDF file" : "Bitte laden Sie eine PDF-Datei hoch");
        return;
      }
      setEmailPdf(file);
    }
  };

  const removeUploadedFile = () => {
    setEmailPdf(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    companyName: 'Spedition Askari GmbH',
    address: 'Südbahnstraße 31',
    city: '32584 Löhne',
    country: lang === 'en' ? 'Germany' : 'Deutschland',
    phone: '+49 5731 1530960',
    email: 'info@spedition-askari.de',
    website: 'www.spedition-askari.de',
    invoiceNo: 'RE-2025-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toLocaleDateString('de-DE'),
    deliveryDate: new Date().toLocaleDateString('de-DE'),
    reference: 'TA - 276412000711583 Raben',
    customerNo: '1968',
    contactPerson: 'Tanveer Askari',
    customerName: 'IKRA GmbH',
    customerAddress: 'Boettgerstrasse 11',
    customerCity: '41066 Mönchengladbach',
    customerCountry: lang === 'en' ? 'Germany' : 'Deutschland',
    items: [
      { 
        description: '1. Transport', 
        subDescription: 'Raben - Regioparkring 8, D - 41199 Mönchengladbach to IKRA - Boettgerstrasse 11, D - 41066 Mönchengladbach',
        quantity: '1.00', 
        unit: 'pcs',
        unitPrice: '250.00',
        amount: '250.00' 
      }
    ],
    taxRate: 19,
    bankName: 'Volksbank in Ostwestfalen',
    iban: 'DE45 4786 0125 0620 1700 00',
    bic: 'GENODEM1GTL',
    amtsgericht: 'Bünde',
    hrNr: '20414',
    ustId: 'DE348127058',
    steuerNr: '310/5003/2632',
    management: 'Tanveer Askari'
  });

  const handleInputChange = (field: keyof InvoiceData, value: any) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string) => {
    const newItems = [...invoiceData.items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      item.amount = (q * p).toFixed(2);
    }
    newItems[index] = item;
    setInvoiceData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', subDescription: '', quantity: '1', unit: 'pcs', unitPrice: '0', amount: '0' }]
    }));
  };

  const removeItem = (index: number) => {
    if (invoiceData.items.length === 1) return;
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const subtotal = invoiceData.items.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
  const tax = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + tax;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!invoiceRef.current) {
      console.error("PDF Error: invoiceRef.current is null");
      return null;
    }
    
    try {
      console.log("PDF: Starting html2canvas capture...");
      const element = invoiceRef.current;
      
      // Small delay to ensure all fonts and styles are fully applied
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use a more stable configuration to avoid the 'Range' error
      const canvas = await html2canvas(element, {
        scale: 3, // Even higher quality (increased from 2)
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 30000,
        removeContainer: true,
        foreignObjectRendering: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: 210 * 3.78, // Force A4 width in pixels
         windowHeight: 297 * 3.78, // Force A4 height in pixels
         x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        // Added ignoreElements to skip problematic ones if any
        ignoreElements: (element) => element.tagName === 'IFRAME',
        // Add this to handle potential text wrap/range issues
         onclone: (clonedDoc) => {
             const clonedElement = clonedDoc.getElementById('invoice-capture-area');
             if (clonedElement) {
               // Ensure the cloned element is fully visible and not clipped
               clonedElement.style.height = 'auto';
               clonedElement.style.minHeight = 'auto';
               
               // Force standard styles on all elements to prevent 'Range' errors
               const all = clonedElement.getElementsByTagName('*');
               for (let i = 0; i < all.length; i++) {
                 const el = all[i] as HTMLElement;
                 el.style.fontFamily = 'Arial, sans-serif';
                 el.style.letterSpacing = 'normal';
                 el.style.textTransform = 'none';
                 
                 // CRITICAL: white-space: pre-wrap is the #1 cause of the Range error in html2canvas
                 if (el.classList.contains('whitespace-pre-wrap')) {
                   el.classList.remove('whitespace-pre-wrap');
                   el.style.whiteSpace = 'normal';
                 }
               }
               clonedElement.style.transform = 'none';
             }
           }
      });

      console.log("PDF: Canvas generated successfully, size:", canvas.width, "x", canvas.height);
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas has zero dimensions");
      }

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      
      // Calculate dimensions to fit exactly on A4 width while maintaining aspect ratio
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Additional pages if content is longer than A4
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      const output = pdf.output('blob');
      console.log("PDF: Blob generation complete");
      return output;
    } catch (err: any) {
      console.error("PDF Export Critical Error:", err);
      // Re-throw to be caught by handleDownloadInvoice
      throw new Error(`PDF generation failed: ${err.message}`);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    setIsProcessing(true);
    setStatusMessage(lang === 'en' ? "Rendering High-Resolution PDF..." : "Erzeuge hochauflösendes PDF...");
    
    // Scroll to top to ensure html2canvas captures correctly
    const scrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Slightly longer wait for layout
      const blob = await generatePDFBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoiceData.invoiceNo}_Spedition_Askari.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error("PDF Export failed:", error);
      // Removed technical error message as requested, using a cleaner notification
      alert(lang === 'de' ? "Der PDF-Export konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut." : "The PDF export could not be completed. Please try again.");
    } finally {
      window.scrollTo(0, scrollPos); // Restore scroll position
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!clientEmail.includes('@')) return alert("Invalid Email");
    setIsProcessing(true);
    
    try {
      let base64 = "";
      let fileName = "";

      if (emailPdf) {
        setStatusMessage(lang === 'en' ? "Preparing Uploaded Attachment..." : "Anhang wird vorbereitet...");
        base64 = await fileToBase64(emailPdf);
        fileName = emailPdf.name;
      } else {
        setStatusMessage(lang === 'en' ? "Generating Template PDF..." : "PDF-Vorlage wird erzeugt...");
        const blob = await generatePDFBlob();
        if (blob) {
          const reader = new FileReader();
          base64 = await new Promise((resolve) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
          });
          fileName = `Invoice_${invoiceData.invoiceNo}.pdf`;
        }
      }

      setStatusMessage(lang === 'en' ? "Connecting to IONOS SMTP..." : "Verbindung zu IONOS SMTP...");
      
      // 1. Send the Email
      const emailResponse = await api.sendInvoiceEmail({
        to: clientEmail,
        invoiceNo: invoiceData.invoiceNo,
        clientName: invoiceData.customerName,
        fileName: fileName,
        fileContent: base64
      });

      // 2. Automatically Record in Financial Records (Outgoing)
      setStatusMessage(lang === 'en' ? "Recording Transaction..." : "Vorgang wird erfasst...");
      
      const newDocRecord = {
        reference: invoiceData.invoiceNo || 'INV-PENDING',
        type: 'Invoice',
        contact: invoiceData.customerName || 'Unknown Customer',
        contactInitials: (invoiceData.customerName || 'UC').substring(0, 2).toUpperCase(),
        amount: parseFloat(total.toFixed(2)) || 0,
        currency: 'EUR',
        status: 'Open',
        source: 'Invoice Editor',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        uploadedBy: user?.name || 'System',
        filename: emailResponse.filename,
        file_path: emailResponse.filePath
      };

      const createdDoc = await dispatch(createDocumentAsync(newDocRecord)).unwrap();
      
      await dispatch(fetchDocuments());

      setStatusMessage(lang === 'en' ? "Sent & Archived Successfully!" : "Gesendet & Archiviert!");
        
      // Redirect to Documents Outgoing page after 2 seconds
       setTimeout(() => {
         setIsProcessing(false);
         setView('gallery');
         navigate('/documents/outgoing');
       }, 2000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  if (view === 'edit') {
    return (
      <div className="flex flex-col h-full -m-8 bg-gray-50 overflow-hidden animate-in fade-in duration-300">
        {isProcessing && (
          <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="text-center space-y-6">
              <Loader2 size={64} className="text-blue-600 animate-spin mx-auto" />
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{statusMessage}</h3>
            </div>
          </div>
        )}

        {/* Editor Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('gallery')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-none">{t.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadInvoice} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
              <Download size={16} />
              {t.download}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* High Fidelity Preview Panel (Left) */}
              <div className="flex-1 overflow-y-auto p-12 bg-gray-100 flex justify-center custom-scrollbar">
                 <div ref={invoiceRef} id="invoice-capture-area" className="w-[210mm] bg-white shadow-2xl pt-[15mm] px-[20mm] pb-[10mm] flex flex-col text-[10.5px] text-gray-900 border border-gray-100 rounded-sm font-sans leading-snug origin-top">
                     <div className="flex justify-between items-start mb-6">
                        <div className="pt-2">
                           <p className="text-[7.5px] text-gray-500 mb-4 border-b border-gray-200 pb-1">
                            {invoiceData.companyName} • {invoiceData.address} • {invoiceData.city}
                          </p>
                          <div className="space-y-0.5">
                            <p className="font-bold text-base text-gray-900 leading-tight">{invoiceData.customerName}</p>
                            <p className="text-gray-800">{invoiceData.customerAddress}</p>
                            <p className="text-gray-800">{invoiceData.customerCity}</p>
                            <p className="text-gray-800">{invoiceData.customerCountry}</p>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <img 
                            src="https://i.postimg.cc/KvkHSw-wb/Screenshot-20260119-094110.png" 
                            alt="Spedition Askari" 
                            className="h-14 w-auto object-contain mb-8" 
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-logo')) {
                                const fallback = document.createElement('div');
                                fallback.className = "fallback-logo text-2xl font-black text-blue-700 italic tracking-tighter";
                                fallback.innerHTML = 'SPEDITION <span class="text-gray-900">ASKARI</span>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                          <div className="w-[180px] space-y-0.5 text-[10px] text-right">
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t.invoice_no}</span>
                              <span className="font-bold">{invoiceData.invoiceNo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t.date}</span>
                              <span className="font-bold">{invoiceData.date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t.customerNo}</span>
                              <span className="font-bold">{invoiceData.customerNo}</span>
                            </div>
                          </div>
                       </div>
                    </div>

                     <div className="mb-6">
                        <h1 className="text-2xl font-bold mb-4 text-gray-900">{lang === 'en' ? 'Invoice' : 'Rechnung'}</h1>
                        <div className="space-y-1">
                           <p className="font-bold">{t.greeting}</p>
                           <p className="text-gray-700">{t.thank_you}</p>
                           {invoiceData.reference && (
                             <div className="mt-4 flex gap-2">
                               <span className="font-bold shrink-0">Betreff:</span>
                               <span className="text-gray-800">{invoiceData.reference}</span>
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="mb-6">
                        <table className="w-full border-collapse">
                           <thead>
                             <tr className="border-y border-gray-300 text-[10px] font-bold text-gray-900 bg-gray-50/30">
                               <th className="text-left px-2 py-2 w-12">Pos.</th>
                               <th className="text-left px-2 py-2">Bezeichnung</th>
                               <th className="text-right px-2 py-2 w-20">Menge</th>
                               <th className="text-right px-2 py-2 w-28">Einzelpreis</th>
                               <th className="text-right px-2 py-2 w-28">Gesamtpreis</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                             {invoiceData.items.map((item, i) => (
                               <tr key={i} className="text-[10.5px] text-gray-900 align-top">
                                 <td className="px-2 py-2 text-gray-500">{(i + 1)}</td>
                                 <td className="px-2 py-2">
                                    <p className="font-bold">{item.description || "No Description"}</p>
                                    <p className="text-[9.5px] text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{item.subDescription || ""}</p>
                                 </td>
                                 <td className="px-2 py-2 text-right">{item.quantity} {item.unit}</td>
                                 <td className="px-2 py-2 text-right">{parseFloat(item.unitPrice).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                                 <td className="px-2 py-2 text-right font-bold">{parseFloat(item.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                     </div>

                     <div className="mt-8 pt-6">
                       <div className="flex justify-end mb-6">
                          <div className="w-[240px] space-y-1.5 border-t border-gray-200 pt-4">
                             <div className="flex justify-between text-[10.5px]">
                               <span className="text-gray-600">Nettobetrag</span>
                               <span className="font-medium">{subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                             </div>
                             <div className="flex justify-between text-[10.5px]">
                               <span className="text-gray-600">zzgl. {invoiceData.taxRate}% MwSt.</span>
                               <span className="font-medium">{tax.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                             </div>
                             <div className="flex justify-between font-bold text-[13px] border-t border-gray-300 pt-2 mt-2">
                               <span>Gesamtbetrag</span>
                               <span>{total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                             </div>
                          </div>
                       </div>

                       <div className="mb-8">
                          <p className="font-bold mb-1">{lang === 'en' ? 'Payment Terms:' : 'Zahlungsbedingungen:'}</p>
                          <p className="text-gray-700">Bitte überweisen Sie den Rechnungsbetrag bis zum {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')} auf das unten genannte Bankkonto.</p>
                          <div className="mt-6">
                            <p className="text-gray-600 italic mb-1">{t.regards}</p>
                            <p className="font-bold">{invoiceData.management}</p>
                          </div>
                      </div>

                      {/* Footer Information */}
                      <div className="pt-6 text-[8.5px] text-gray-500 grid grid-cols-4 gap-6 border-t border-gray-200">
                         <div className="space-y-1">
                            <p className="font-bold text-gray-800 uppercase text-[7.5px] tracking-wider mb-2">Firmensitz</p>
                            <p className="font-medium text-gray-700">{invoiceData.companyName}</p>
                            <p>{invoiceData.address}</p>
                            <p>{invoiceData.city}</p>
                            <p>{invoiceData.country}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="font-bold text-gray-800 uppercase text-[7.5px] tracking-wider mb-2">Kontakt</p>
                            <p>Tel: {invoiceData.phone}</p>
                            <p>Email: {invoiceData.email}</p>
                            <p>Web: {invoiceData.website}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="font-bold text-gray-800 uppercase text-[7.5px] tracking-wider mb-2">Registergericht</p>
                            <p>Amtsgericht {invoiceData.amtsgericht}</p>
                            <p>HRB {invoiceData.hrNr}</p>
                            <p>Ust-ID: {invoiceData.ustId}</p>
                            <p>Steuer-Nr: {invoiceData.steuerNr}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="font-bold text-gray-800 uppercase text-[7.5px] tracking-wider mb-2">Bankverbindung</p>
                            <p className="font-medium text-gray-700">{invoiceData.bankName}</p>
                            <p>IBAN: {invoiceData.iban}</p>
                            <p>BIC: {invoiceData.bic}</p>
                         </div>
                      </div>
                    </div>
                 </div>
              </div>

          {/* Editor Controls Sidebar (Right) */}
          <div className="w-[480px] bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar p-8 print:hidden">
            <div className="space-y-10">
              
              {/* Dispatch Controls (Email) */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Mail size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">{t.dispatch}</h3>
                </div>
                <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.recipient}</label>
                    <input 
                      type="email" 
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Upload Invoice Option */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {lang === 'en' ? 'Attachment (Optional)' : 'Anhang (Optional)'}
                    </label>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept=".pdf"
                    />
                    {!emailPdf ? (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 bg-white border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center gap-2 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                      >
                        <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span className="text-xs font-bold">{lang === 'en' ? 'Upload Custom PDF' : 'Eigene PDF hochladen'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <FileCheck size={14} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-900 truncate">{emailPdf.name}</span>
                        </div>
                        <button 
                          onClick={removeUploadedFile}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button onClick={handleSendEmail} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                    {lang === 'en' ? 'Send via IONOS' : 'Über IONOS senden'}
                  </button>
                  <p className="text-[10px] text-gray-400 font-medium text-center italic leading-normal">
                    {lang === 'en' 
                      ? 'Sending will automatically record this in Outgoing Financial Records.' 
                      : 'Das Senden erfasst diesen Beleg automatisch in den Ausgangsrechnungen.'}
                  </p>
                </div>
              </section>

              <div className="border-t border-gray-100" />

              {/* Document Details Form */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Layout size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">{t.doc_details}</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.invoice_no}</label>
                      <input type="text" value={invoiceData.invoiceNo} onChange={(e) => handleInputChange('invoiceNo', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.date}</label>
                      <input type="text" value={invoiceData.date} onChange={(e) => handleInputChange('date', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.ref}</label>
                    <input type="text" value={invoiceData.reference} onChange={(e) => handleInputChange('reference', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>
              </section>

              {/* Consignee Form */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">{t.consignee}</h3>
                </div>
                <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <input type="text" placeholder="Customer Name" value={invoiceData.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
                  <input type="text" placeholder="Street & No." value={invoiceData.customerAddress} onChange={(e) => handleInputChange('customerAddress', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none mt-3 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                  <input type="text" placeholder="City & ZIP" value={invoiceData.customerCity} onChange={(e) => handleInputChange('customerCity', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none mt-3 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                </div>
              </section>

              {/* Line Items Management */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileType size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">{t.items}</h3>
                  </div>
                  <button onClick={addItem} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {invoiceData.items.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative group hover:border-blue-200 transition-all">
                      <button onClick={() => removeItem(idx)} className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
                        <Trash2 size={12} />
                      </button>
                      <input 
                        type="text" 
                        placeholder="Service Title" 
                        value={item.description} 
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-bold outline-none mb-2 text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500/10"
                      />
                      <textarea 
                        placeholder="Route and Details" 
                        value={item.subDescription}
                        onChange={(e) => handleItemChange(idx, 'subDescription', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-[11px] font-medium outline-none h-20 resize-none mb-2 text-gray-600 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/10 custom-scrollbar"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                           <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Qty</label>
                           <input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="px-3 py-2 bg-gray-50 border-none rounded-lg text-xs font-black outline-none text-black focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Unit</label>
                           <input type="text" value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="px-3 py-2 bg-gray-50 border-none rounded-lg text-xs font-black outline-none text-black focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-right pr-1">Price €</label>
                           <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} className="px-3 py-2 bg-gray-50 border-none rounded-lg text-xs font-black outline-none text-right text-black focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bank Details Editor */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <CreditCard size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'BANKING' : 'BANKVERBINDUNG'}</h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                   <input type="text" value={invoiceData.bankName} onChange={(e) => handleInputChange('bankName', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="Bank Name" />
                   <input type="text" value={invoiceData.iban} onChange={(e) => handleInputChange('iban', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none font-mono focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="IBAN" />
                   <input type="text" value={invoiceData.bic} onChange={(e) => handleInputChange('bic', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-black outline-none font-mono focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="BIC" />
                </div>
              </section>

              {/* Legal Details Editor */}
              <section className="space-y-4 pb-20">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <ShieldCheck size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'LEGAL & REGISTRY' : 'RECHTLICHES'}</h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={invoiceData.amtsgericht} onChange={(e) => handleInputChange('amtsgericht', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="Court" />
                      <input type="text" value={invoiceData.hrNr} onChange={(e) => handleInputChange('hrNr', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="HR No." />
                   </div>
                   <input type="text" value={invoiceData.ustId} onChange={(e) => handleInputChange('ustId', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="VAT-ID" />
                   <input type="text" value={invoiceData.steuerNr} onChange={(e) => handleInputChange('steuerNr', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="Tax No." />
                   <input type="text" value={invoiceData.management} onChange={(e) => handleInputChange('management', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-bold text-black outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="CEO / GF" />
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-widest">
          <span>Settings</span> <ChevronRight size={10} /> <span>Portal</span> <ChevronRight size={10} /> <span className="text-gray-900 font-bold">Templates</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{lang === 'en' ? 'Invoice Templates' : 'Rechnungsvorlagen'}</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm p-10 flex gap-8">
          <div onClick={() => setView('edit')} className="group relative flex flex-col p-4 bg-gray-50 border border-gray-200 rounded-3xl hover:border-blue-400 transition-all w-full max-w-[320px] aspect-[1/1.4] cursor-pointer shadow-sm hover:shadow-xl overflow-hidden">
            <div className="flex-1 bg-white rounded-xl shadow-inner p-6 overflow-hidden relative border border-gray-100 flex flex-col items-center justify-center">
              <img src="https://i.postimg.cc/KvkHSw-wb/Screenshot-20260119-094110.png" alt="Logo" className="w-48 h-auto mb-4 opacity-90"/>
              <div className="absolute inset-0 bg-gray-900/5 group-hover:bg-gray-900/10 flex items-center justify-center transition-all">
                <button className="px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-xl active:scale-95 transition-transform">{lang === 'en' ? 'Open Editor' : 'Editor öffnen'}</button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-base font-bold text-gray-900">{lang === 'en' ? 'Official Template' : 'Offizielle Vorlage'}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Askari Logistics Standard</p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default InvoiceTemplatesView;
