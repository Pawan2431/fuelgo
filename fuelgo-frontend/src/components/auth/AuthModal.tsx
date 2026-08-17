import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { GoogleLogin } from '@react-oauth/google';
import {
  X,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Building2,
  Truck,
  User,
  KeyRound,
  CheckCircle2,
  RotateCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalView,
    setAuthModalView,
    sendOtp,
    verifyOtp,
    loginWithPassword,
    loginWithGoogle,
    requestPasswordReset,
    verifyResetOtp,
    completePasswordReset,
    activeOtpCode,
    otpCooldownSeconds,
    setPendingAuthTarget,
  } = useAuth();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [role, setRole] = useState<UserRole>('b2b_fleet');
  
  // OTP inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot password states
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  useEffect(() => {
    if (authModalOpen) {
      setErrorMessage('');
      setSuccessBanner('');
      if (authModalView === 'otp_verify') {
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      }
    }
  }, [authModalOpen, authModalView]);

  if (!authModalOpen) return null;

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Pasted full OTP code
      const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) updated[i] = char;
      });
      setOtpDigits(updated);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = val.slice(-1);
    setOtpDigits(updated);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorMessage('Please enter your email or mobile number');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await loginWithPassword(identifier, password);
    } catch (err: any) {
      setErrorMessage('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpFlow = async (isSignup = false) => {
    if (!identifier) {
      setErrorMessage('Please enter mobile number or email');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      setPendingAuthTarget({
        identifier,
        name: isSignup ? name : undefined,
        role: isSignup ? role : 'b2b_fleet',
      });
      const generatedOtp = await sendOtp(identifier);
      setSuccessBanner(`SMS OTP sent: ${generatedOtp}`);
      setOtpDigits(['', '', '', '', '', '']);
      setAuthModalView('otp_verify');
    } catch (e) {
      setErrorMessage('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const ok = await verifyOtp(code);
      if (!ok) {
        setErrorMessage('Invalid OTP code. Please enter the code shown in the banner.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password step handlers
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (resetStep === 1) {
      if (!identifier) {
        setErrorMessage('Please enter your registered email or phone number');
        return;
      }
      setLoading(true);
      const code = await requestPasswordReset(identifier);
      setSuccessBanner(`Reset OTP generated: ${code}`);
      setResetStep(2);
      setLoading(false);
    } else if (resetStep === 2) {
      const code = otpDigits.join('');
      if (code.length < 6) {
        setErrorMessage('Enter the 6-digit reset code');
        return;
      }
      const ok = verifyResetOtp(code);
      if (ok) {
        setResetStep(3);
        setErrorMessage('');
      } else {
        setErrorMessage('Invalid Reset OTP code');
      }
    } else if (resetStep === 3) {
      if (newPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return;
      }
      setLoading(true);
      try {
        await completePasswordReset(newPassword);
        setAuthModalView('reset_success');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  };

  const fillTestOtp = () => {
    const code = activeOtpCode || '482910';
    setOtpDigits(code.split(''));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden text-gray-900 my-8"
      >
        {/* Header Ribbon */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-sm">
              <span className="font-bold text-white font-heading text-lg">FG</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold font-heading text-lg tracking-tight text-gray-900">FuelGo</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 uppercase tracking-wider">PESO Compliant</span>
              </div>
              <p className="text-xs text-gray-500">Doorstep Fuel Delivery & Fleet Cloud</p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Notification / OTP Alert Banner */}
        {activeOtpCode && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              <span>
                Simulated SMS/WhatsApp OTP: <strong className="text-gray-900 text-sm font-mono tracking-widest bg-amber-100 px-2 py-0.5 rounded border border-amber-300">{activeOtpCode}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={fillTestOtp}
              className="text-[11px] font-semibold bg-amber-600 text-white px-2.5 py-1 rounded hover:bg-amber-700 transition-colors"
            >
              Auto Fill
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Content Areas */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* 1. LOGIN VIEW */}
            {authModalView === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold font-heading text-gray-900">Welcome back to FuelGo</h2>
                  <p className="text-xs text-gray-500 mt-1">Access your enterprise fuel account, live bowser fleet, and GST tax invoices.</p>
                </div>

                {/* Google Sign In Button */}
                <div className="w-full flex items-center justify-center">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        loginWithGoogle(credentialResponse.credential).catch(err => {
                          setErrorMessage(err.message || 'Google Login Failed');
                        });
                      }
                    }}
                    onError={() => {
                      setErrorMessage('Google Login Failed');
                    }}
                    useOneTap
                  />
                </div>

                <div className="flex items-center space-x-3 my-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">or email / mobile</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email or +91 Mobile Number</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. logistics@indiatrans.com or 9820045910"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep(1);
                          setAuthModalView('forgot_password');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Sign In with Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* OTP Alternative Button */}
                  <button
                    type="button"
                    onClick={() => handleSendOtpFlow(false)}
                    className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-all flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Login with Instant Mobile OTP</span>
                  </button>
                </form>

                {/* Quick Demo Personas */}
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-2">⚡ Quick 1-Click Demo Login</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        loginWithPassword('vikram.singhania@indialogistics.co.in', 'demo123');
                      }}
                      className="p-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-400 rounded-lg transition-all"
                    >
                      <div className="text-xs font-semibold text-gray-900 flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-red-600" />
                        <span>B2B Fleet Manager</span>
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">Apex Logistics Pvt Ltd</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPendingAuthTarget({
                          identifier: '+91 98860 77123',
                          name: 'Rajesh Kumar Yadav',
                          role: 'bowser_driver',
                        });
                        verifyOtp('482910');
                      }}
                      className="p-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-400 rounded-lg transition-all"
                    >
                      <div className="text-xs font-semibold text-gray-900 flex items-center space-x-1">
                        <Truck className="w-3 h-3 text-emerald-600" />
                        <span>Bowser Driver / Operator</span>
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">KA-01-MF-8834 Bowser</div>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2 text-xs text-gray-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalView('signup')}
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Register New Enterprise
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. SIGN UP VIEW */}
            {authModalView === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold font-heading text-gray-900">Create FuelGo Account</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Automated doorstep fueling with PESO safety assurance and 18% input GST credit.</p>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 border border-gray-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('b2b_fleet')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                      role === 'b2b_fleet'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Fleet / DG Enterprise</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('bowser_driver')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                      role === 'bowser_driver'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bowser Partner Driver</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Company / Organization</label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Infra Pvt Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Mobile (+91 Indian)</label>
                      <input
                        type="tel"
                        placeholder="+91 98200 45910"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="29AAACA8821R1ZK"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none"
                    />
                  </div>

                  {/* PESO Compliance Checkbox */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      I agree to Petroleum & Explosives Safety Organisation (<strong className="text-gray-900">PESO</strong>) site earthing and storage compliance rules for doorstep refueling.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendOtpFlow(true)}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Verify Phone with OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center text-xs text-gray-500 pt-1">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalView('login')}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    Log In
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. OTP VERIFICATION VIEW */}
            {authModalView === 'otp_verify' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 text-center"
              >
                <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto text-red-600">
                  <KeyRound className="w-6 h-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold font-heading text-gray-900">Enter 6-Digit OTP</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the code sent to <strong className="text-gray-900">{identifier || '+91 98200 45910'}</strong>
                  </p>
                </div>

                {/* 6 Digit Input Boxes */}
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
                  <div className="flex justify-center items-center space-x-2 sm:space-x-3">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-xl font-bold font-mono bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10 rounded-xl text-gray-900 outline-none transition-all"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                    <button
                      type="button"
                      onClick={() => setAuthModalView('login')}
                      className="hover:text-gray-900 transition-colors"
                    >
                      ← Change number
                    </button>
                    {otpCooldownSeconds > 0 ? (
                      <span className="text-gray-400">Resend OTP in {otpCooldownSeconds}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtpFlow(false)}
                        className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {/* 4. FORGOT PASSWORD VIEW (3-STEP WIZARD) */}
            {authModalView === 'forgot_password' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold font-heading text-gray-900">Reset Account Password</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {resetStep === 1 && 'Step 1: Enter your registered mobile or enterprise email.'}
                    {resetStep === 2 && 'Step 2: Enter the 6-digit security code sent to you.'}
                    {resetStep === 3 && 'Step 3: Create a strong new password for your account.'}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center space-x-2">
                  <div className={`flex-1 h-1.5 rounded-full ${resetStep >= 1 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 h-1.5 rounded-full ${resetStep >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 h-1.5 rounded-full ${resetStep >= 3 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  {resetStep === 1 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Registered Mobile or Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. fleet.ops@titan.com or 9845012891"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {resetStep === 2 && (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-gray-700 text-center">6-Digit Reset Code</label>
                      <div className="flex justify-center items-center space-x-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-10 h-12 text-center text-lg font-bold font-mono bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-gray-900 outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {resetStep === 3 && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-sm text-gray-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:bg-white rounded-xl text-sm text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <span>
                      {resetStep === 1 && 'Send Reset Code'}
                      {resetStep === 2 && 'Verify Code'}
                      {resetStep === 3 && 'Update Password'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setAuthModalView('login')}
                      className="text-xs text-gray-500 hover:text-gray-800"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 5. RESET SUCCESS VIEW */}
            {authModalView === 'reset_success' && (
              <motion.div
                key="reset_success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-3"
              >
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading text-gray-900">Password Updated Successfully!</h3>
                  <p className="text-xs text-gray-500 mt-1">Your password has been changed. You can now login with your new credentials.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalView('login')}
                  className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all"
                >
                  Proceed to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
