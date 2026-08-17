import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FuelOrder } from '../../types';
import { useOrder } from '../../context/OrderContext';
import {
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  ExternalLink,
  Printer,
  Share2,
  Lock,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  Flame,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecureDeliveryQrPassProps {
  order: FuelOrder;
  onTrackOrder?: () => void;
  onCreateNewOrder?: () => void;
  isStandaloneModal?: boolean;
  onClose?: () => void;
}

export const SecureDeliveryQrPass: React.FC<SecureDeliveryQrPassProps> = ({
  order,
  onTrackOrder,
  onCreateNewOrder,
  isStandaloneModal = false,
  onClose,
}) => {
  const { setActiveTab, setActiveOrder } = useOrder();
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Generate standardized PESO Fuel Delivery Authorization Payload
  const qrPayload = JSON.stringify({
    protocol: 'FUELGO_PESO_DISPATCH_V1',
    orderId: order.id,
    orderNumber: order.orderNumber,
    deliveryOtp: order.deliveryOtp,
    pesoSealNumber: order.pesoSealNumber || 'PESO-SEAL-KA-88129',
    assetReg: order.asset.registrationNo,
    assetName: order.asset.name,
    fuelType: order.fuelType,
    quantityL: order.quantity,
    siteLabel: order.deliveryAddress.label,
    pincode: order.deliveryAddress.pincode,
    authSignature: `PESO-SEC-${order.id.slice(-6).toUpperCase()}-${order.deliveryOtp}`,
    createdAt: order.createdAt,
  });

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(order.deliveryOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleSharePass = () => {
    const shareText = `FuelGo Delivery Gate Pass for Order ${order.orderNumber}\nFuel: ${order.quantity}L ${order.fuelType.replace('_', ' ').toUpperCase()}\nDelivery PIN: ${order.deliveryOtp}\nPESO Seal: ${order.pesoSealNumber || 'PESO-SEAL-KA-88129'}`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handlePrintPass = () => {
    window.print();
  };

  const handleSimulateDriverScan = () => {
    setActiveOrder(order);
    setActiveTab('driver_view');
    if (onClose) onClose();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-gray-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">PESO Security Pass</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Encrypted & Signed
              </span>
            </div>
            <h3 className="text-xl font-bold font-heading text-gray-900 mt-0.5">
              Secure Delivery Authorization QR Pass
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSharePass}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold border border-gray-200 flex items-center space-x-1.5 transition-all"
            title="Share or Copy Gate Pass Text"
          >
            {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedShare ? 'Copied Pass' : 'Share Pass'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPass}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold border border-gray-200 flex items-center space-x-1.5 transition-all"
            title="Print Delivery Pass"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>
          {isStandaloneModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Main QR Code & Instructions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* QR Code Presentation Box (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-200 relative overflow-hidden group">
          {/* Subtle QR Reticle Corner Accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-sm"></div>
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-sm"></div>
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-sm"></div>
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-sm"></div>

          {/* QR Code Frame */}
          <div
            onClick={() => setIsZoomed(!isZoomed)}
            className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm transition-all cursor-pointer transform hover:scale-[1.02] flex flex-col items-center ${
              isZoomed ? 'scale-105' : ''
            }`}
          >
            <QRCodeSVG
              value={qrPayload}
              size={isZoomed ? 240 : 190}
              level="H"
              includeMargin={false}
              fgColor="#111827"
              bgColor="#ffffff"
            />
          </div>

          <div className="mt-3 flex items-center justify-between w-full px-2 text-[11px] text-gray-500">
            <span className="font-mono text-gray-700">{order.orderNumber}</span>
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1"
            >
              {isZoomed ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isZoomed ? 'Normal View' : 'Enlarge QR'}</span>
            </button>
          </div>
        </div>

        {/* Instructions & SafeCode PIN Block (7 cols) */}
        <div className="md:col-span-7 space-y-5">
          {/* 4-Digit PIN SafeCode Card */}
          <div className="p-4 sm:p-5 bg-red-50/50 rounded-2xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-red-700">
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span>Alternative Delivery PIN SafeCode</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Driver can also type this 4-digit code into their console
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="px-4 py-2 bg-white rounded-xl border border-red-200 shadow-2xs font-mono font-extrabold text-2xl tracking-widest text-gray-900">
                {order.deliveryOtp}
              </div>
              <button
                type="button"
                onClick={handleCopyOtp}
                className="p-2.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 shadow-2xs transition-all"
                title="Copy Delivery SafeCode"
              >
                {copiedOtp ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Workflow Steps Explanation */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>How On-Site Driver Verification Works:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center">1</span>
                <p className="font-semibold text-gray-900">Bowser Arrives</p>
                <p className="text-[11px] text-gray-500">Bowser pulls up to your site and clamps safety earthing.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center">2</span>
                <p className="font-semibold text-gray-900">Driver Scans QR</p>
                <p className="text-[11px] text-gray-500">Driver scans this QR pass with their Smart Dispenser Terminal.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center">3</span>
                <p className="font-semibold text-gray-900">Nozzle Unlocks</p>
                <p className="text-[11px] text-gray-500">Electronic valve unlocks and dispenses exact ordered volume.</p>
              </div>
            </div>
          </div>

          {/* Assigned Bowser & Destination Snapshot */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-gray-500 block text-[10px]">Assigned Bowser:</span>
              <strong className="text-gray-900 font-mono">{order.assignedBowser?.bowserRegNo || 'KA-01-MF-8834'}</strong>
              <span className="text-gray-500 text-[11px]"> ({order.assignedBowser?.name || 'Rajesh Yadav'})</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Target Asset:</span>
              <strong className="text-gray-900">{order.asset.name}</strong>
              <span className="text-red-600 font-mono text-[11px] block">{order.asset.registrationNo}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Fuel Volume:</span>
              <strong className="text-gray-900 font-mono">{order.quantity} Litres</strong>
              <span className="text-emerald-700 text-[11px] block">{order.fuelType.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          
          {/* Support and Payment Info */}
          <div className="p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">Order Placed Successfully</span>
                <span className="text-sm font-bold text-gray-900 block">Payment Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Wallet'}</span>
                <span className="text-[11px] text-gray-600">Please pay the delivery executive when your fuel is delivered.</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs text-center">
                 <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-0.5">Amount to Pay</span>
                 <strong className="text-emerald-700 font-mono text-xl">₹{order.totalPayable.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <div className="border-t border-emerald-100 pt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Need help with your order?</span>
              <a href={`tel:${import.meta.env.VITE_FUELGO_CONTACT_NUMBER}`} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-colors">
                 Call FuelGo: {import.meta.env.VITE_FUELGO_CONTACT_NUMBER}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {onCreateNewOrder && (
            <button
              type="button"
              onClick={onCreateNewOrder}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold border border-gray-200 transition-all text-center"
            >
              Book Another Order
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Driver View Simulator trigger button */}
          <button
            type="button"
            onClick={handleSimulateDriverScan}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all"
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Driver QR Scan</span>
          </button>

          {/* Live Track Button */}
          <button
            type="button"
            onClick={() => {
              if (onTrackOrder) onTrackOrder();
              else {
                setActiveOrder(order);
                setActiveTab('tracking');
              }
              if (onClose) onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 flex items-center justify-center space-x-1.5 transition-all"
          >
            <span>Track Bowser Live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
