import { useState, useCallback } from 'react';

const VALIDATORS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  password: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
  name: /^[A-Za-z\s]{2,50}$/,
  otp: /^\d{6}$/
};

const ERROR_MESSAGES = {
  email: 'Invalid email address.',
  phone: 'Must be a 10-digit mobile number.',
  password: 'Min 8 chars, 1 uppercase, 1 digit, 1 special char.',
  name: 'Name must be 2-50 letters.',
  otp: 'Must be a 6-digit code.'
};

export function useValidation() {
  const [errors, setErrors] = useState({});

  const validate = useCallback((field, value, type) => {
    if (!VALIDATORS[type]) return true;

    if (!VALIDATORS[type].test(value)) {
      setErrors(prev => ({ ...prev, [field]: ERROR_MESSAGES[type] }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    }
  }, []);

  const clearError = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return { errors, validate, clearError };
}
