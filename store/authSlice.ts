
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  browser: string;
}

interface User {
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  sessionStartedAt: string | null;
  activeSessions: Session[];
}

// Persistent auth state for session management
const savedAuth = localStorage.getItem('askari_auth');
const initialState: AuthState = savedAuth ? JSON.parse(savedAuth) : {
  isAuthenticated: false,
  user: null,
  token: null,
  sessionStartedAt: null,
  activeSessions: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.sessionStartedAt = new Date().toISOString();
      state.activeSessions = [
        {
          id: Math.random().toString(36).substr(2, 9),
          device: 'Browser (Primary)',
          location: 'Auto-detected',
          lastActive: 'Just now',
          isCurrent: true,
          browser: 'Current'
        }
      ];
      localStorage.setItem('askari_auth', JSON.stringify(state));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.sessionStartedAt = null;
      state.activeSessions = [];
      localStorage.removeItem('askari_auth');
    },
    terminateOtherSessions: (state) => {
      state.activeSessions = state.activeSessions.filter(s => s.isCurrent);
      localStorage.setItem('askari_auth', JSON.stringify(state));
    },
    // Fix: Added updateUserPassword reducer to resolve the missing export error in ResetPasswordView
    updateUserPassword: (state, _action: PayloadAction<string>) => {
      // In a real application, this would be an API call.
      // For this demo, we simply provide the reducer so the action can be dispatched and handled in the UI.
      console.log('Password update action dispatched successfully');
    }
  },
});

export const { loginSuccess, logout, terminateOtherSessions, updateUserPassword } = authSlice.actions;
export default authSlice.reducer;
