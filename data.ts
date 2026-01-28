
import { Document, Contact } from './types';

// Standard configuration for the app
export const defaultUser = {
  name: 'John Doe',
  email: 'johndoe@example.com',
  password: '12345678'
};

// These are now empty as data is fetched from PostgreSQL
export const mockDocuments: Document[] = [];
export const mockContacts: Contact[] = [];

export const cashFlowData = [
  { name: 'May 01', revenue: 0, target: 400 },
  { name: 'May 05', revenue: 0, target: 800 },
  { name: 'May 10', revenue: 0, target: 700 },
  { name: 'May 15', revenue: 0, target: 950 },
  { name: 'May 20', revenue: 0, target: 750 },
  { name: 'May 25', revenue: 0, target: 850 },
  { name: 'May 30', revenue: 0, target: 1100 },
];
