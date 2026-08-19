import React, { useRef } from 'react';
import './components.css';

export default function OtpInput({ length = 6, value, onChange }) {
  const inputRefs = useRef([]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1].focus();
        const newVal = value.slice();
        newVal[index - 1] = '';
        onChange(newVal);
      }
    }
  };

  const handleInput = (e, index) => {
    const val = e.target.value;
    if (val) {
      const newVal = value.slice();
      newVal[index] = val.slice(-1); // Take only the last character entered
      onChange(newVal);
      if (index < length - 1) {
        inputRefs.current[index + 1].focus();
      }
    } else {
      const newVal = value.slice();
      newVal[index] = '';
      onChange(newVal);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === length && /^\d+$/.test(pasteData)) {
      onChange(pasteData.split(''));
      inputRefs.current[length - 1].focus();
    }
  };

  return (
    <div className="otp-container">
      {value.map((char, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={char || ''}
          onChange={(e) => handleInput(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`otp-box ${char ? 'filled' : ''}`}
        />
      ))}
    </div>
  );
}
