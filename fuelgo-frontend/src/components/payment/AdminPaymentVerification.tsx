import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw,
  Search, Filter, IndianRupee, User, CalendarDays, Hash,
  ShieldCheck, Settings, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

type PaymentStatus = 'PAYMENT_PENDING' | 'PAYMENT_VERIFICATION_PENDING' | 'PAID' | 'PAYMENT_REJECTED';

interface UpiPayment {
  id: number;
  order_id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  utr_number: string;
  payment_status: PaymentStatus;
  rejection_reason?: string;
  submitted_at: string;
  verified_at?: string;
  verified_by_name?: string;
  screenshot_base64?: string;
  fuel_type?: string;
  quantity_litres?: number;
  delivery_address?: string;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: React.FC<any> }> = {
  PAYMENT_PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
  PAYMENT_VERIFICATION_PENDING: { label: 'Verify Required', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  PAID: { label: 'Paid ✓', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  PAYMENT_REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

export const AdminPaymentVerification: React.FC = () => {
  const [payments, setPayments] = useState<UpiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('PAYMENT_VERIFICATION_PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<UpiPayment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showMerchantConfig, setShowMerchantConfig] = useState(false);
  const [merchantForm, setMerchantForm] = useState({ merchant_name: '', merchant_upi_id: '' });
  const [merchantSaving, setMerchantSaving] = useState(false);

  const token = localStorage.getItem('fuelgo_token');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'ALL'
        ? '/api/upi-payments/admin/list'
        : `/api/upi-payments/admin/list?status=${filterStatus}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, token]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    fetch('/api/upi-payments/merchant-config')
      .then(r => r.json())
      .then(d => setMerchantForm({ merchant_name: d.merchant_name, merchant_upi_id: d.merchant_upi_id }))
      .catch(() => {});
  }, []);

  const handleVerify = async (paymentId: number) => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/upi-payments/admin/verify/${paymentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess(`✅ Payment #${paymentId} verified and marked PAID.`);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (paymentId: number) => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setActionError('Please provide a rejection reason (min 5 characters).');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/upi-payments/admin/reject/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess(`❌ Payment #${paymentId} rejected.`);
      setSelectedPayment(null);
      setRejectReason('');
      fetchPayments();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMerchant = async () => {
    setMerchantSaving(true);
    try {
      const res = await fetch('/api/upi-payments/merchant-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(merchantForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess('Merchant config updated!');
      setShowMerchantConfig(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setMerchantSaving(false);
    }
  };

  const filtered = payments.filter(p =>
    !searchTerm ||
    p.utr_number.includes(searchTerm.toUpperCase()) ||
    p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.order_id).includes(searchTerm)
  );

  const formatDate = (dt?: string) => dt ? new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>UPI Payment Verification</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Manually verify UTR numbers against your UPI account</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPayments}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setShowMerchantConfig(v => !v)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Merchant Config</span>
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="ml-auto text-emerald-600">×</button>
        </div>
      )}
      {actionError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="ml-auto text-red-600">×</button>
        </div>
      )}

      {/* Merchant Config Panel */}
      {showMerchantConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-blue-900 text-sm flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Merchant UPI Configuration</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-blue-800 mb-1">Merchant Name</label>
              <input
                type="text"
                value={merchantForm.merchant_name}
                onChange={e => setMerchantForm(f => ({ ...f, merchant_name: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                placeholder="FuelGo India"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-800 mb-1">UPI ID</label>
              <input
                type="text"
                value={merchantForm.merchant_upi_id}
                onChange={e => setMerchantForm(f => ({ ...f, merchant_upi_id: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 font-mono"
                placeholder="yourname@upi"
              />
            </div>
          </div>
          <p className="text-[11px] text-blue-700">The QR code on the customer payment screen will auto-update when you save a new UPI ID.</p>
          <button
            onClick={handleSaveMerchant}
            disabled={merchantSaving}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors"
          >
            {merchantSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search UTR, Order ID, or Customer name..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex items-center space-x-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
          {(['PAYMENT_VERIFICATION_PENDING', 'PAID', 'PAYMENT_REJECTED', 'ALL'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === s ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {s === 'PAYMENT_VERIFICATION_PENDING' ? 'Pending' : s === 'ALL' ? 'All' : s === 'PAID' ? 'Paid' : 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* Payment List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-3" />
          <span className="text-sm">Loading payments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No payments found</p>
          <p className="text-gray-400 text-xs">There are no UPI payments matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary row */}
          <div className="text-xs text-gray-500 font-semibold px-1">
            Showing {filtered.length} payment{filtered.length !== 1 ? 's' : ''}
            {filtered.filter(p => p.payment_status === 'PAYMENT_VERIFICATION_PENDING').length > 0 && (
              <span className="ml-2 text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                {filtered.filter(p => p.payment_status === 'PAYMENT_VERIFICATION_PENDING').length} need verification
              </span>
            )}
          </div>

          {filtered.map(payment => {
            const statusConf = STATUS_CONFIG[payment.payment_status] || STATUS_CONFIG.PAYMENT_PENDING;
            const isSelected = selectedPayment?.id === payment.id;
            const isPending = payment.payment_status === 'PAYMENT_VERIFICATION_PENDING';

            return (
              <div
                key={payment.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  isPending ? 'border-amber-300 shadow-sm shadow-amber-100' : 'border-gray-200'
                }`}
              >
                {/* Payment Row */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Order + Amount */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-500">Order #{payment.order_id}</span>
                        <span className="text-lg font-extrabold text-gray-900 font-heading">
                          ₹{payment.amount.toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>
                      {/* Customer */}
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{payment.customer_name || 'Unknown'}</span>
                        {payment.customer_phone && <span className="text-gray-400">• {payment.customer_phone}</span>}
                      </div>
                      {/* UTR */}
                      <div className="flex items-center space-x-1 text-xs">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                          UTR: {payment.utr_number}
                        </span>
                      </div>
                      {/* Dates */}
                      <div className="flex items-center space-x-1 text-[11px] text-gray-400">
                        <CalendarDays className="w-3 h-3" />
                        <span>Submitted: {formatDate(payment.submitted_at)}</span>
                        {payment.verified_at && (
                          <span>• Verified: {formatDate(payment.verified_at)} by {payment.verified_by_name}</span>
                        )}
                      </div>
                      {/* Rejection reason */}
                      {payment.rejection_reason && (
                        <div className="text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded-lg mt-1">
                          Rejected: {payment.rejection_reason}
                        </div>
                      )}
                    </div>
                    {/* Action button */}
                    <button
                      onClick={() => setSelectedPayment(isSelected ? null : payment)}
                      className={`shrink-0 flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isPending
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Close' : 'Review'}</span>
                      {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Action Panel */}
                {isSelected && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                    {/* Screenshot preview */}
                    {payment.screenshot_base64 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Payment Screenshot</p>
                        <img
                          src={payment.screenshot_base64}
                          alt="Payment screenshot"
                          className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                    )}

                    {/* Verify instructions */}
                    {isPending && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                        <p className="font-bold">Before verifying, check your UPI account:</p>
                        <p>1. Open your UPI app (GPay / PhonePe / Paytm)</p>
                        <p>2. Find transaction with UTR: <strong className="font-mono">{payment.utr_number}</strong></p>
                        <p>3. Confirm the amount is <strong>₹{payment.amount.toFixed(2)}</strong></p>
                        <p>4. Only then click Verify Payment below</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {isPending && (
                      <>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleVerify(payment.id)}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>VERIFY PAYMENT</span>
                          </button>
                        </div>
                        {/* Reject section */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-700">Rejection Reason (required to reject)</label>
                          <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            rows={2}
                            placeholder="e.g. UTR not found in our account / Amount mismatch / Invalid transaction..."
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-red-400 resize-none"
                          />
                          <button
                            onClick={() => handleReject(payment.id)}
                            disabled={actionLoading || rejectReason.trim().length < 5}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>REJECT PAYMENT</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
