import React from 'react';
import './components.css';

export default function InputField({ label, type = 'text', icon: Icon, error, ...props }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className={`input-wrapper ${error ? 'has-error' : ''}`}>
        {Icon && <Icon className="input-icon" size={16} />}
        <input type={type} className="input-box" {...props} />
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
