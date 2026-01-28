
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { updateUserPassword } from '../store/authSlice';
import { RootState } from '../store/store';
import { translations } from '../translations';
import { api } from '../services/api';

const ResetPasswordView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].auth.reset;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (password.length < 8) {
      setError('Password too short');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-3xl shadow-xl text-center animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{t.success_title}</h2>
          <p className="text-gray-500 mt-4 font-medium">
            {t.success_subtitle}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-8 w-full py-4 px-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
          >
            {t.login_btn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <img 
            src="https://i.postimg.cc/KvkHSw-wb/Screenshot-20260119-094110.png" 
            alt="Spedition Askari" 
            className="mx-auto h-16 w-auto mb-6"
          />
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.title}</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {t.subtitle}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">{t.new_password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-white placeholder-gray-400 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">{t.confirm_password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-white placeholder-gray-400 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {t.submit}
                <ShieldCheck className="ml-2 w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {t.secured}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordView;
