import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../services/translations';

export const LoginView: React.FC = () => {
  const { login, setAuthView, language, setLanguage, setShowLanguageModal, t } = useApp();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrPhone.trim()) {
      setErrorMessage(t('emailOrPhone') + ' is required.');
      return;
    }
    if (!password) {
      setErrorMessage(t('password') + ' is required.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(emailOrPhone, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid login credentials.');
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      {/* Language Switcher Bar at Top */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-4">
        <button
          onClick={() => setShowLanguageModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs hover:bg-gray-50 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName}</span>
          <span className="text-[10px] text-gray-400 ml-0.5">▼</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
          <span className="text-3xl font-black">K</span>
        </div>
        <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight font-sans">
          {t('appTitle')}
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
          {t('tagline')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-6 px-5 sm:px-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('emailOrPhone')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Email or Mobile Number"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password')}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>...</span>
              ) : (
                <>
                  <span>{t('login')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthView('forgot_password')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('forgotPassword')}
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">•</span>
              </div>
            </div>

            {/* Create New Account Button */}
            <button
              type="button"
              onClick={() => setAuthView('signup')}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all text-center"
            >
              {t('signup')}
            </button>
          </form>
        </div>

        {/* Security & Offline note */}
        <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Konekta Secure Database & Offline Cache</span>
        </div>
      </div>
    </div>
  );
};
