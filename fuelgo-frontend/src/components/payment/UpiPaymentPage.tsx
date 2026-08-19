import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone, CheckCircle2, XCircle, Clock, Copy, Upload, AlertCircle,
  Shield, ChevronRight, RefreshCw, IndianRupee
} from 'lucide-react';

interface UpiPaymentPageProps {
  orderId: number;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentStatus = 'PAYMENT_PENDING' | 'PAYMENT_VERIFICATION_PENDING' | 'PAID' | 'PAYMENT_REJECTED';

interface MerchantConfig {
  merchant_name: string;
  merchant_upi_id: string;
  merchant_qr_data: string | null;
}

export const UpiPaymentPage: React.FC<UpiPaymentPageProps> = ({ orderId, amount, onSuccess, onCancel }) => {
  const [merchant, setMerchant] = useState<MerchantConfig>({ merchant_name: 'FuelGo India', merchant_upi_id: 'fuelgo@upi', merchant_qr_data: null });
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('PAYMENT_PENDING');
  const [rejectionReason, setRejectionReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build UPI deep-link QR string
  const upiQrString = `upi://pay?pa=${merchant.merchant_upi_id}&pn=${encodeURIComponent(merchant.merchant_name)}&am=${amount.toFixed(2)}&cu=INR&tn=FuelGo+Order+${orderId}`;

  useEffect(() => {
    // Load merchant config
    fetch('/api/upi-payments/merchant-config')
      .then(r => r.json())
      .then(data => { if (data.merchant_upi_id) setMerchant(data); })
      .catch(() => {});
  }, []);

  // Poll status after submission
  useEffect(() => {
    if (status !== 'PAYMENT_VERIFICATION_PENDING') {
      if (pollInterval.current) clearInterval(pollInterval.current);
      return;
    }
    pollInterval.current = setInterval(() => {
      const token = localStorage.getItem('fuelgo_token');
      fetch(`/api/upi-payments/status/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.payment_status === 'PAID') {
            setStatus('PAID');
            clearInterval(pollInterval.current!);
            setTimeout(onSuccess, 2000);
          } else if (data.payment_status === 'PAYMENT_REJECTED') {
            setStatus('PAYMENT_REJECTED');
            setRejectionReason(data.rejection_reason || '');
            clearInterval(pollInterval.current!);
          }
          setPollingCount(c => c + 1);
        })
        .catch(() => {});
    }, 8000); // poll every 8 seconds

    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, [status, orderId, onSuccess]);

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(merchant.merchant_upi_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Screenshot must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUtr = utrNumber.trim();
    if (cleanUtr.length < 6) {
      setError('Please enter a valid UTR / UPI Transaction ID (minimum 6 characters).');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('fuelgo_token');
      const res = await fetch('/api/upi-payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: orderId, amount, utr_number: cleanUtr, screenshot_base64: screenshot })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setStatus('PAYMENT_VERIFICATION_PENDING');
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STATUS: PAID ──
  if (status === 'PAID') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
        <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center animate-pulse">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">Payment Verified! ✅</h2>
        <p className="text-gray-600 text-sm max-w-xs">Your UPI payment has been confirmed by our admin. Your fuel order is now confirmed!</p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 w-full">
          <p className="text-emerald-800 font-semibold text-sm">Order #{orderId} — ₹{amount.toFixed(2)}</p>
          <p className="text-emerald-600 text-xs mt-1">Status: PAID & CONFIRMED</p>
        </div>
      </div>
    );
  }

  // ── STATUS: REJECTED ──
  if (status === 'PAYMENT_REJECTED') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
        <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 font-heading">Payment Rejected</h2>
        {rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 w-full text-left">
            <p className="text-xs font-semibold text-red-700 mb-1">Admin Reason:</p>
            <p className="text-sm text-red-800">{rejectionReason}</p>
          </div>
        )}
        <p className="text-gray-500 text-sm">Please verify the UTR and try again, or contact support.</p>
        <button
          onClick={() => { setStatus('PAYMENT_PENDING'); setUtrNumber(''); setError(''); }}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Submit Correct Payment Details</span>
        </button>
      </div>
    );
  }

  // ── STATUS: VERIFICATION_PENDING ──
  if (status === 'PAYMENT_VERIFICATION_PENDING') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-5 text-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-60" />
          <div className="relative w-20 h-20 bg-amber-50 border-2 border-amber-300 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 font-heading">Verification Pending</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 w-full text-left space-y-2">
          <p className="text-sm font-semibold text-amber-900">✅ Payment submitted successfully!</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Our admin is verifying your payment of <strong>₹{amount.toFixed(2)}</strong> in our UPI account.
            This usually takes <strong>15 minutes to 2 hours</strong>.
          </p>
          <p className="text-xs text-amber-700">You will be notified as soon as it's confirmed.</p>
        </div>
        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-left">
          <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Status Timeline</p>
          <div className="space-y-2">
            {[
              { label: 'Payment Pending', done: true },
              { label: 'UTR Submitted', done: true },
              { label: 'Admin Verification', done: false, active: true },
              { label: 'Order Confirmed', done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center space-x-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-emerald-500' : step.active ? 'bg-amber-400 animate-pulse' : 'bg-gray-200'
                }`}>
                  {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  {step.active && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={`text-xs font-medium ${step.done ? 'text-emerald-700' : step.active ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-400">Auto-checking status... (check #{pollingCount})</p>
        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-800 underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ── MAIN PAYMENT FORM ──
  return (
    <div className="space-y-5">
      {/* Amount Header */}
      <div className="text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Total Amount to Pay</p>
        <div className="flex items-center justify-center space-x-1">
          <IndianRupee className="w-7 h-7 text-amber-400" />
          <span className="text-4xl font-extrabold font-heading text-amber-400">{amount.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Order #{orderId}</p>
      </div>

      {/* QR Code + UPI ID */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scan & Pay with Any UPI App</p>

        {/* QR Code - auto-generated from UPI ID + amount */}
        <div className="flex justify-center">
          <div className="p-3 bg-white border-2 border-gray-100 rounded-2xl shadow-sm inline-block">
            <QRCodeSVG
              value={upiQrString}
              size={180}
              bgColor="#ffffff"
              fgColor="#111827"
              level="M"
              includeMargin={false}
            />
          </div>
        </div>

        {/* UPI ID with copy button */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">UPI ID</p>
            <p className="text-sm font-bold text-gray-900 font-mono">{merchant.merchant_upi_id}</p>
            <p className="text-[11px] text-gray-500">{merchant.merchant_name}</p>
          </div>
          <button
            onClick={handleCopyUpiId}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Supported apps */}
        <div className="flex items-center justify-center space-x-3 text-gray-500">
          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
            <span key={app} className="text-[10px] bg-gray-100 px-2 py-1 rounded-full font-semibold">{app}</span>
          ))}
        </div>
      </div>

      {/* Step-by-step instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Payment Instructions</p>
        {[
          'Open Google Pay, PhonePe, Paytm or any UPI app',
          `Scan the QR code above OR enter UPI ID: ${merchant.merchant_upi_id}`,
          `Pay exactly ₹${amount.toFixed(2)} — do not change the amount`,
          'After payment, note your UTR / Transaction ID',
          'Come back here and enter the UTR below',
        ].map((step, i) => (
          <div key={i} className="flex items-start space-x-2">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-xs text-blue-800 leading-relaxed">{step}</p>
          </div>
        ))}
      </div>

      {/* UTR Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5">
            UTR / UPI Transaction Reference ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={utrNumber}
            onChange={e => setUtrNumber(e.target.value.toUpperCase())}
            placeholder="e.g. 421234567890 or T2408181234"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 rounded-xl text-sm font-mono text-gray-900 placeholder-gray-400 outline-none transition-all uppercase"
          />
          <p className="text-[11px] text-gray-500 mt-1">Found in your UPI app under "Transaction History" after payment.</p>
        </div>

        {/* Optional screenshot upload */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Payment Screenshot <span className="text-gray-400">(optional, helps admin verify faster)</span>
          </label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
          {screenshot ? (
            <div className="relative">
              <img src={screenshot} alt="screenshot" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >×</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl text-xs text-gray-500 flex items-center justify-center space-x-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Tap to upload screenshot (max 2MB)</span>
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Security notice */}
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <strong>Important:</strong> Your payment will NOT be automatically confirmed. Our admin will manually verify the UTR in our UPI account before marking your order as paid.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !utrNumber.trim()}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Submitting...</span></>
          ) : (
            <><Smartphone className="w-4 h-4" /><span>Submit Payment for Verification</span><ChevronRight className="w-4 h-4" /></>
          )}
        </button>

        <button type="button" onClick={onCancel} className="w-full text-xs text-gray-500 hover:text-gray-800 py-2 transition-colors">
          Cancel & go back
        </button>
      </form>
    </div>
  );
};
