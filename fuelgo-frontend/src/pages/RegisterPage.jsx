import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Smartphone, Lock, AlertCircle } from 'lucide-react';
import InputField from '../components/InputField';
import { useValidation } from '../hooks/useValidation';
import { API_HOST } from '../api';
import '../styles/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { errors, validate, clearError } = useValidation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    clearError(field);
  };

  const handleRegister = async () => {
    setSubmitError('');
    let hasError = false;

    if (!validate('name', formData.name, 'name')) hasError = true;
    if (!validate('email', formData.email, 'email')) hasError = true;
    if (formData.phone && !validate('phone', formData.phone, 'phone')) hasError = true;
    if (!validate('password', formData.password, 'password')) hasError = true;

    if (formData.password !== formData.confirmPassword) {
      validate('confirmPassword', '', 'password'); // trigger error manually
      setSubmitError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_HOST}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        // Send OTP for 2FA
        const otpRes = await fetch(`${API_HOST}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: formData.email })
        });
        
        if (otpRes.ok) {
          navigate('/2fa', { state: { identifier: formData.email } });
        } else {
          setSubmitError('Account created, but failed to send 2FA code.');
        }
      } else {
        setSubmitError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen" style={{ paddingBottom: '40px' }}>
      <div className="auth-container">
        <div className="auth-header">
          <img src="/FuelGo.png" alt="FuelGo Logo" height="54" style={{ marginBottom: '12px', borderRadius: '12px' }} />
          <h1 className="auth-title">Create Account</h1>
          <div className="auth-sub">Join FuelGo today</div>
        </div>

        <div className="form-card">
          <InputField
            label="Full Name"
            icon={User}
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
          />

          <InputField
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
          />

          <InputField
            label="Mobile Number (Optional)"
            icon={Smartphone}
            placeholder="10-digit mobile"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
          />

          <InputField
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special"
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
          />

          <InputField
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
          />

          {submitError && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          <button 
            className="btn-primary" 
            onClick={handleRegister}
            disabled={isLoading}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
            Already have an account? <Link to="/" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
