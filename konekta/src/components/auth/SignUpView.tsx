import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, UserPlus, AlertCircle, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../services/translations';
import { FB_LITE_DEFAULT_AVATAR } from '../common/Avatar';
import { OtpService } from '../../services/otp';

export const SignUpView: React.FC = () => {
  const { signup, setAuthView, language, setShowLanguageModal, t } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'lalaki' | 'babae' | 'iba'>('lalaki');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState<'form' | 'pin'>('form');
  const [pin, setPin] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim()) {
      setErrorMessage(t('firstName') + ' is required.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage(t('lastName') + ' is required.');
      return;
    }
    if (!emailOrPhone.trim()) {
      setErrorMessage(t('emailOrPhone') + ' is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    OtpService.send(emailOrPhone.trim()).then((res) => {
      setIsLoading(false);
      if (!res.ok) {
        setErrorMessage(res.error || 'Hindi naipadala ang PIN.');
        return;
      }
      setPin('');
      setCooldown(res.resendIn ?? 60);
      setStep('pin');
    });
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMessage('');
    const res = await OtpService.send(emailOrPhone.trim());
    if (!res.ok) {
      setErrorMessage(res.error || 'Hindi naipadala ang PIN.');
      return;
    }
    setCooldown(res.resendIn ?? 60);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!/^\d{6}$/.test(pin)) {
      setErrorMessage('Ilagay ang 6-digit na PIN.');
      return;
    }
    setIsLoading(true);
    const res = await OtpService.verify(emailOrPhone.trim(), pin);
    if (!res.ok) {
      setIsLoading(false);
      setErrorMessage(res.error || 'Mali ang PIN.');
      return;
    }
    const result = signup({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailOrPhone: emailOrPhone.trim(),
      password: password,
      gender: gender,
      avatar: FB_LITE_DEFAULT_AVATAR,
      coverPhoto: '',
      bio: 'Bago sa Konekta! 👋',
      location: 'Pilipinas'
    });
    setIsLoading(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to register.');
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setAuthView('login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('login')}</span>
          </button>

          <button
            onClick={() => setShowLanguageModal(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700"
          >
            <Globe className="w-3 h-3 text-blue-600" />
            <span>{currentLang?.nativeName}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 py-6 px-5 sm:px-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('signup')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('tagline')}
            </p>
          </div>

          {step === 'pin' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Nagpadala kami ng 6-digit na PIN code sa <b>{emailOrPhone.trim()}</b>. Ilagay ito para ma-verify ang account mo.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="______"
                className="w-full px-3 py-3 text-center text-2xl tracking-[0.5em] font-bold bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading || pin.length !== 6}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
              >
                {isLoading ? '...' : 'I-verify at Gumawa ng Account'}
              </button>
              <div className="flex items-center justify-between text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setErrorMessage(''); }}
                  className="text-gray-600 dark:text-gray-300 hover:underline"
                >
                  Baguhin ang email/number
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-blue-600 dark:text-blue-400 disabled:text-gray-400 hover:underline"
                >
                  {cooldown > 0 ? `Ipadala ulit (${cooldown}s)` : 'Ipadala ulit'}
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('firstName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('lastName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('emailOrPhone')}
              </label>
              <input
                type="text"
                required
                placeholder="09171234567 / name@email.com"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('password')}
              </label>
              <input
                type="password"
                required
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender Picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kasarian / Gender
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['lalaki', 'babae', 'iba'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 px-2 rounded-xl border text-center capitalize font-medium transition-all ${
                      gender === g
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 font-bold'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {g === 'lalaki' ? 'Lalaki (Male)' : g === 'babae' ? 'Babae (Female)' : 'Iba (Other)'}
                  </button>
                ))}
              </div>
            </div>


            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? '...' : 'Magpadala ng PIN'}</span>
            </button>
          </form>
          )}

          <div className="mt-4 pt-3 text-center border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
