import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import InputField from '../components/InputField';
import OtpInput from '../components/OtpInput';
import { useValidation } from '../hooks/useValidation';
import { API_HOST } from '../api';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { errors, validate, clearError } = useValidation();
  
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP & New Password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSendOTP = async () => {
    setMessage({ type: '', text: '' });
    
    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'phone';
    if (!validate('identifier', identifier, type)) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_HOST}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `OTP sent to ${identifier}` });
        setStep(2);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send reset code.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setMessage({ type: '', text: '' });
    let hasError = false;

    const otpStr = otp.join('');
    if (!validate('otp', otpStr, 'otp')) hasError = true;
    if (!validate('newPassword', newPassword, 'password')) hasError = true;

    if (hasError) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_HOST}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          otp: otpStr,
          new_password: newPassword
        })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password reset successfully!' });
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset password.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <div className="auth-sub">
            {step === 1 ? 'Enter your email or mobile to receive an OTP' : 'Enter OTP and new password'}
          </div>
        </div>

        <div className="form-card">
          {message.text && (
            <div className={message.type === 'error' ? 'error-banner' : 'success-banner'}>
              {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              <InputField
                label="Mobile Number / Email"
                icon={Smartphone}
                placeholder="Enter email or 10-digit phone"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  clearError('identifier');
                }}
                error={errors.identifier}
              />
              <button 
                className="btn-primary" 
                onClick={handleSendOTP}
                disabled={isLoading}
                style={{ marginTop: '16px' }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label className="field-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-Digit OTP</label>
                <OtpInput value={otp} onChange={(val) => { setOtp(val); clearError('otp'); }} />
                {errors.otp && <span className="field-error" style={{ textAlign: 'center' }}>{errors.otp}</span>}
              </div>

              <InputField
                label="New Password"
                type="password"
                icon={Lock}
                placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearError('newPassword');
                }}
                error={errors.newPassword}
              />

              <button 
                className="btn-primary" 
                onClick={handleResetPassword}
                disabled={isLoading}
                style={{ marginTop: '16px' }}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
            <Link to="/" className="auth-link">Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
