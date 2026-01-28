
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { RootState } from '../store/store';
import { translations } from '../translations';
import { setLanguage } from '../store/languageSlice';
import { api } from '../services/api';

const ForgotPasswordView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].auth.forgot;
  
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 relative overflow-hidden">
      {/* Language Toggle */}
      <div className="absolute top-8 right-8 flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
        <button 
          onClick={() => dispatch(setLanguage('de'))}
          className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'de' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400'}`}
        >
          DE
        </button>
        <button 
          onClick={() => dispatch(setLanguage('en'))}
          className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${lang === 'en' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400'}`}
        >
          EN
        </button>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <img 
            src="https://i.postimg.cc/KvkHSw-wb/Screenshot-20260119-094110.png" 
            alt="Spedition Askari" 
            className="mx-auto h-16 w-auto mb-6"
          />
          {!isSent ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.title}</h2>
              <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">
                {t.subtitle}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.success_title}</h2>
              <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">
                {t.success_subtitle} <span className="text-gray-900 font-bold">{email}</span>
              </p>
            </div>
          )}
        </div>

        {!isSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">{t.email_label}</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full pl-12 pr-4 py-3.5 border ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'} placeholder-gray-400 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm font-medium`}
                  placeholder="johndoe@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t.submit}
                  <ArrowRight className="ml-2 -mr-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            <button
              onClick={() => navigate('/reset-password')}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {t.demo_btn}
            </button>
            <button
              onClick={() => setIsSent(false)}
              className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.retry}
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors">
            <ArrowLeft size={16} />
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
