import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, Lock, AlertCircle } from 'lucide-react';
import InputField from '../components/InputField';
import { useValidation } from '../hooks/useValidation';
import { AuthContext } from '../context/AuthContext';
import { API_HOST } from '../api';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { errors, validate, clearError } = useValidation();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleLogin = async () => {
    setSubmitError('');
    let hasError = false;

    // Determine if email or phone
    const isEmail = identifier.includes('@');
    if (isEmail) {
      if (!validate('identifier', identifier, 'email')) hasError = true;
    } else {
      if (!validate('identifier', identifier, 'phone')) hasError = true;
    }

    if (!password) {
      validate('password', '', 'password'); // force error
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_HOST}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        // Successful login, trigger 2FA OTP
        const otpRes = await fetch(`${API_HOST}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier })
        });
        
        if (otpRes.ok) {
          navigate('/2fa', { state: { identifier } });
        } else {
          setSubmitError('Failed to send 2FA code.');
        }
      } else {
        setSubmitError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Placeholder for Google Sign In logic
    setSubmitError('Google Sign-In needs a valid Client ID configuration.');
  };

  return (
    <div className="screen">
      <div className="auth-container">
        <div className="auth-header">
          <img src="/FuelGo.png" alt="FuelGo Logo" height="54" style={{ marginBottom: '12px', borderRadius: '12px' }} />
          <h1 className="auth-title">Sign in to FuelGo</h1>
          <div className="auth-sub">Customer Mobile Account Login</div>
        </div>

        <div className="form-card">
          <button className="btn-google" onClick={handleGoogleSignIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">or</div>

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

          <InputField
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            error={errors.password}
          />
          
          <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>

          {submitError && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          <button 
            className="btn-primary" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Sign In Now'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
            Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
