
export type Status = 'Paid' | 'Overdue' | 'Open' | 'Draft' | 'Pending' | 'Canceled' | 'Archived' | 'High Priority' | 'Flagged';

export interface Document {
  id: string;
  type: 'Invoice' | 'Bill' | 'Credit Note' | 'Proforma' | string;
  reference: string;
  contact: string;
  contactInitials: string;
  contactAvatar?: string;
  amount: number;
  currency: string;
  date: string;
  dueDate?: string;
  status: Status;
  source?: string;
  uploadedBy?: string;
  reason?: string;
    filePath?: string;
    fileName?: string;
    filename?: string;
    file_path?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  type: 'Customer' | 'Vendor';
  address: string;
  taxId: string;
  balance: number;
  status: 'Overdue' | 'Paid' | 'Pending';
  initials: string;
}

export interface StatData {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
  icon?: any;
}
