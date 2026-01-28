
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Receipt, FileText, Tag, CheckCircle2, Truck, Copy, Upload, Loader2 } from 'lucide-react';
import { createDocumentAsync } from '../store/documentsSlice';
import { AppDispatch, RootState } from '../store/store';

interface NewEvidenceModalProps {
  onClose: () => void;
}

const NewEvidenceModal: React.FC<NewEvidenceModalProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSampleInvoice = async () => {
    setIsCreating(true);
    try {
      const sampleInvoice = {
        reference: `INV-${Date.now().toString().slice(-6)}`,
        type: 'Invoice',
        contact: 'New Client Corp',
        contactInitials: 'NC',
        amount: (Math.random() * 5000 + 500).toFixed(2),
        currency: 'USD',
        status: 'Open',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        uploadedBy: user?.name || 'Admin'
      };
      
      await dispatch(createDocumentAsync(sampleInvoice)).unwrap();
      alert('Invoice created successfully in database!');
      onClose();
    } catch (error) {
      alert('Error creating invoice: ' + error);
    } finally {
      setIsCreating(false);
    }
  };

  const types = [
    { title: 'Record Receipt', desc: 'Upload or manual entry of expenses', icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-50', action: () => alert('Feature coming soon!') },
    { title: 'The Invoice', desc: 'Create bill for client services', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', action: handleCreateSampleInvoice },
    { title: 'Offer (Quotation)', desc: 'Send a detailed proposal', icon: Tag, color: 'text-blue-500', bg: 'bg-blue-50', action: () => alert('Feature coming soon!') },
    { title: 'Order Confirmation', desc: 'Confirm a purchase order', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', action: () => alert('Feature coming soon!') },
    { title: 'Delivery Note', desc: 'Generate proof of delivery', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50', action: () => alert('Feature coming soon!') },
    { title: 'Interim Invoice', desc: 'Partial or series billing', icon: Copy, color: 'text-blue-500', bg: 'bg-blue-50', action: () => alert('Feature coming soon!') },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Evidence</h2>
            <p className="text-sm text-gray-500 mt-1">Select the type of document you want to create.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {types.map((type, idx) => (
            <button 
              key={idx}
              disabled={isCreating}
              onClick={type.action}
              className="group p-6 text-left border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all flex flex-col items-center text-center gap-4 active:scale-95 disabled:opacity-50"
            >
              <div className={`w-14 h-14 rounded-full ${type.bg} flex items-center justify-center ${type.color} group-hover:scale-110 transition-transform`}>
                {isCreating && type.title === 'The Invoice' ? <Loader2 className="animate-spin" size={28} /> : <type.icon size={28} />}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{type.title}</h4>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{type.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Upload size={18} />
            <span>Import from file</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewEvidenceModal;
