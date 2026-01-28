
import { configureStore } from '@reduxjs/toolkit';
import documentsReducer from './documentsSlice';
import contactsReducer from './contactsSlice';
import authReducer from './authSlice';
import languageReducer from './languageSlice';

export const store = configureStore({
  reducer: {
    documents: documentsReducer,
    contacts: contactsReducer,
    auth: authReducer,
    language: languageReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
