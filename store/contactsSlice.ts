
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Contact } from '../types';
import { api } from '../services/api';

interface ContactsState {
  items: Contact[];
  isLoading: boolean;
  error: string | null;
}

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async () => {
    return await api.getContacts();
  }
);

export const createContactAsync = createAsyncThunk(
  'contacts/createContact',
  async (contact: any) => {
    return await api.createContact(contact);
  }
);

export const deleteContactAsync = createAsyncThunk(
  'contacts/deleteContact',
  async (id: string | number) => {
    await api.deleteContact(id);
    return id;
  }
);

const initialState: ContactsState = {
  items: [],
  isLoading: false,
  error: null,
};

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load contacts';
      })
      .addCase(createContactAsync.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteContactAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  },
});

export default contactsSlice.reducer;
