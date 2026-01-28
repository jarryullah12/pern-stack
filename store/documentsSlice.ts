
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Document } from '../types';
import { api } from '../services/api';

interface DocumentsState {
  items: Document[];
  canceledItems: any[];
  isLoading: boolean;
  error: string | null;
}

export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async () => {
    return await api.getDocuments();
  }
);

export const deleteDocumentAsync = createAsyncThunk(
  'documents/deleteDocument',
  async (id: string | number) => {
    await api.deleteDocument(id);
    return id;
  }
);

export const createDocumentAsync = createAsyncThunk(
  'documents/createDocument',
  async (doc: any) => {
    return await api.createDocument(doc);
  }
);

export const updateDocumentAsync = createAsyncThunk(
  'documents/updateDocument',
  async ({ id, updates }: { id: string | number, updates: any }) => {
    return await api.updateDocument(id, updates);
  }
);

const initialState: DocumentsState = {
  items: [],
  canceledItems: [],
  isLoading: false,
  error: null,
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    deleteCanceledRecord: (state, action) => {
      state.canceledItems = state.canceledItems.filter(doc => doc.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load documents';
      })
      // Delete
      .addCase(deleteDocumentAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(doc => doc.id !== action.payload);
      })
      // Create
      .addCase(createDocumentAsync.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update
      .addCase(updateDocumentAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      });
  },
});

export const { deleteCanceledRecord } = documentsSlice.actions;
export default documentsSlice.reducer;
