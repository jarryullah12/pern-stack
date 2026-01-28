
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, WifiOff } from 'lucide-react';
import { loginSuccess } from '../store/authSlice';
import { api } from '../services/api';
import { RootState } from '../store/store';
import { translations } from '../translations';
import { setLanguage } from '../store/languageSlice';

const SignupView: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: lang } = useSelector((state: RootState) => state.language);
  const t = translations[lang].auth.signup;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    general?: string;
    isNetworkError?: boolean;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      const response = await api.signup({ name: name.trim(), email: email.trim(), password });
      dispatch(loginSuccess(response));
      navigate('/');
    } catch (err: any) {
      const isNetwork = err.message.includes('server is not running') || err.message.includes('unreachable');
      setErrors({ 
        general: err.message || 'Signup failed. Please try again.',
        isNetworkError: isNetwork
      });
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

      <div className="max-w-lg w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <img 
            src="https://i.postimg.cc/KvkHSw-wb/Screenshot-20260119-094110.png" 
            alt="Spedition Askari" 
            className="mx-auto h-20 w-auto mb-6"
          />
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {t.subtitle}
          </p>
        </div>

        {errors.general && (
          <div className={`border p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${errors.isNetworkError ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'}`}>
            {errors.isNetworkError ? <WifiOff className="text-orange-500 shrink-0 mt-0.5" size={18} /> : <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />}
            <div>
              <p className={`text-xs font-bold leading-relaxed ${errors.isNetworkError ? 'text-orange-700' : 'text-red-600'}`}>
                {errors.general}
              </p>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">{t.name_label}</label>
            <div className="relative">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <input
                type="text"
                value={name}
                autoComplete="name"
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                className={`appearance-none block w-full pl-12 pr-4 py-3 border ${errors.name ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'} placeholder-gray-400 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm font-medium`}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">{t.email_label}</label>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={`appearance-none block w-full pl-12 pr-4 py-3.5 border ${errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'} placeholder-gray-400 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm font-medium`}
                placeholder="johndoe@example.com"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">{t.password_label}</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <input
                type="password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`appearance-none block w-full pl-12 pr-4 py-3.5 border ${errors.password ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'} placeholder-gray-400 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm font-medium`}
                placeholder="Min. 8 characters"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
          <ShieldCheck size={14} className="text-green-500" />
          <span>{t.db_integrated}</span>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 font-medium">
            {t.has_account} <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">{t.login_link}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupView;
