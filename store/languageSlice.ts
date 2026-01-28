
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Language = 'en' | 'de';

interface LanguageState {
  current: Language;
}

const initialState: LanguageState = {
  current: (localStorage.getItem('askari_lang') as Language) || 'de',
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.current = action.payload;
      localStorage.setItem('askari_lang', action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
