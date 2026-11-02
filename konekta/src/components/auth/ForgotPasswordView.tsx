import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { OtpService } from '../../services/otp';

export const ForgotPasswordView: React.FC = () => {
  const { setAuthView, resetPasswordWithProof } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [proof, setProof] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Step 1: send a real PIN to the account's email / mobile number
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!emailOrPhone.trim()) {
      setErrorMessage('Please enter your mobile number or email address.');
      return;
    }
    setIsLoading(true);
    const res = await OtpService.send(emailOrPhone.trim(), 'reset');
    setIsLoading(false);
    if (!res.ok) {
      setErrorMessage(res.error || 'Hindi naipadala ang PIN.');
      return;
    }
    setInputCode('');
    setCooldown(res.resendIn ?? 60);
    setStep(2);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMessage('');
    const res = await OtpService.send(emailOrPhone.trim(), 'reset');
    if (!res.ok) {
      setErrorMessage(res.error || 'Hindi naipadala ang PIN.');
      return;
    }
    setCooldown(res.resendIn ?? 60);
  };

  // Step 2: verify the PIN with the server
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!/^\d{6}$/.test(inputCode.trim())) {
      setErrorMessage('Ilagay ang 6-digit na PIN.');
      return;
    }
    setIsLoading(true);
    const res = await OtpService.verify(emailOrPhone.trim(), inputCode.trim(), 'reset');
    setIsLoading(false);
    if (!res.ok || !res.proof) {
      setErrorMessage(res.error || 'Mali ang PIN. Subukan ulit.');
      return;
    }
    setProof(res.proof);
    setStep(3);
  };

  // Step 3: set the new password (the server checks the verified proof)
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    const res = await resetPasswordWithProof(proof, newPassword);
    setIsLoading(false);
    if (res.success) {
      setIsSuccess(true); // the app logs the user in automatically
    } else {
      setErrorMessage(res.error || 'Hindi napalitan ang password.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => setAuthView('login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Log In</span>
        </button>

        <div className="bg-white dark:bg-gray-900 py-6 px-5 sm:px-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Reset Your Password
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Step {step} of 3: {step === 1 ? 'Find Your Account' : step === 2 ? 'Verify Security Code' : 'Set New Password'}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 mb-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Password Changed Successfully!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically logging into your account...
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: Enter email or phone */}
              {step === 1 && (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Mobile Number or Email Address
                    </label>
                    <input
                      type="text"
                      required
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="e.g. name@email.com or 09171234567"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    We will send a 6-digit verification code to verify your account ownership.
                  </p>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all"
                  >
                    {isLoading ? 'Sandali...' : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {/* STEP 2: Input verification code */}
              {step === 2 && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Nagpadala kami ng 6-digit na PIN sa <b>{emailOrPhone.trim()}</b>.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Enter the 6-digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={inputCode}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 123456"
                      className="w-full px-3 py-2 text-center tracking-widest text-lg font-bold bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all"
                  >
                    {isLoading ? 'Sandali...' : 'Verify Code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="w-full text-xs font-semibold text-blue-600 dark:text-blue-400 disabled:text-gray-400 hover:underline"
                  >
                    {cooldown > 0 ? `Ipadala ulit (${cooldown}s)` : 'Ipadala ulit ang PIN'}
                  </button>
                </form>
              )}

              {/* STEP 3: Enter new password */}
              {step === 3 && (
                <form onSubmit={handleSetNewPassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all"
                  >
                    {isLoading ? 'Sandali...' : 'Save and Log In'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
