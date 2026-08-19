import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('fuelgo_token');
      const response = await fetch('/api/payments/create-payment-intent', { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount }) 
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment.');
      }

      const clientSecret = data.clientSecret;
      
      // Intelligent Fallback: If backend is in simulation mode, simulate success
      if (clientSecret === 'mock_secret_for_testing') {
        setTimeout(() => {
          setProcessing(false);
          onSuccess('mock_pi_success_123');
        }, 1500);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement as any,
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'An error occurred during payment processing.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with payment server.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-sm font-bold text-gray-900">Pay by Credit/Debit Card</h5>
        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">Powered by Stripe</span>
      </div>
      
      <div className="p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
        }} />
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          {processing && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{processing ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}</span>
        </button>
      </div>
    </form>
  );
};
