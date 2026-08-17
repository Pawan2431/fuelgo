import React from 'react';
import { useOrder } from '../../context/OrderContext';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Building2
} from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const { viewingInvoiceOrder, setViewingInvoiceOrder } = useOrder();

  if (!viewingInvoiceOrder) return null;

  const order = viewingInvoiceOrder;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden text-gray-900 my-8">
        {/* Header Ribbon */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-red-600" />
            <h3 className="font-bold font-heading text-gray-900">PESO Tax Invoice & Delivery Challan</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-gray-200 shadow-2xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => setViewingInvoiceOrder(null)}
              className="p-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 space-y-6 text-xs bg-white" id="printable-invoice">
          {/* Company & Bill Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold font-heading text-lg text-gray-900">FuelGo India</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold uppercase">
                  PESO Certified
                </span>
              </div>
              <p className="text-gray-600 mt-1">FuelGo Energy Technologies Private Limited</p>
              <p className="text-gray-500">Embassy TechVillage, Bellandur, Bengaluru - 560103</p>
              <p className="text-gray-500 font-mono mt-0.5">GSTIN: 29AAACF4912J1ZK | SAC: 9986</p>
              <p className="text-gray-500 font-mono">PESO License: PESO/CC/KR/2024/9912</p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-sm font-bold text-red-600 font-mono">{order.orderNumber}</div>
              <div className="text-gray-500">Date: {order.createdAt}</div>
              <div className="text-gray-500">Delivery SafeCode: <strong className="text-gray-900 font-mono">{order.deliveryOtp}</strong></div>
              <div className="text-emerald-700 font-semibold">Payment: PAID (Credit Line)</div>
            </div>
          </div>

          {/* Consignee / Buyer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-200 pb-5">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Billed To (Customer):</span>
              <strong className="text-gray-900 text-sm block">Apex Translog India Pvt Ltd</strong>
              <p className="text-gray-500">Plot 44-B, EPIP Industrial Area, Whitefield</p>
              <p className="text-gray-500">Bengaluru, Karnataka - 560066</p>
              <p className="text-gray-500 font-mono mt-1">Buyer GSTIN: 29AAACA8821R1ZK</p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Delivery Bowser & Vessel:</span>
              <p className="text-gray-700">Bowser Reg: <strong className="text-gray-900 font-mono">{order.assignedBowser?.bowserRegNo || 'KA-01-MF-8834'}</strong></p>
              <p className="text-gray-700">Target Asset: <strong className="text-gray-900">{order.asset.name}</strong></p>
              <p className="text-gray-700">Asset Reg: <span className="font-mono text-red-600">{order.asset.registrationNo}</span></p>
              <p className="text-gray-700">PESO Seal ID: <span className="font-mono text-emerald-700">{order.pesoSealNumber || 'PESO-SEAL-KA-99128'}</span></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-y border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">SAC Code</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-3">
                    <strong className="text-gray-900">{order.fuelType.replace('_', ' ').toUpperCase()}</strong>
                    <div className="text-[10px] text-gray-500">Commercial Doorstep Refueling BS-VI</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-gray-600">9986</td>
                  <td className="py-3 px-3 font-mono font-bold text-gray-900">{order.quantity} Litres</td>
                  <td className="py-3 px-3 font-mono text-gray-600">₹{order.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-right text-gray-900 font-semibold">₹{order.fuelTotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-gray-600">PESO Dispenser Calibration & Earthing Fee</td>
                  <td className="py-2.5 px-3 font-mono text-gray-600">9986</td>
                  <td className="py-2.5 px-3 font-mono text-gray-600">1 Service</td>
                  <td className="py-2.5 px-3 font-mono text-gray-600">₹{order.platformFee}</td>
                  <td className="py-2.5 px-3 font-mono text-right text-gray-900 font-semibold">₹{order.platformFee}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Calculation & PESO Density Certificate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-[11px]">
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>On-Site PESO Density Quality Certificate</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Measured Density @ 15°C:</span>
                <strong className="text-gray-900 font-mono">{order.densityReport?.measuredDensity || 832.4} kg/m³</strong>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Standard Reference Density:</span>
                <span className="text-gray-700 font-mono">820.0 - 845.0 kg/m³</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Flash Point:</span>
                <span className="text-emerald-700 font-mono">&gt; 38.0°C (PASS)</span>
              </div>
            </div>

            <div className="space-y-1.5 text-right text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span className="font-mono text-gray-900 font-semibold">₹{(order.fuelTotal + order.platformFee).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>CGST (9%):</span>
                <span className="font-mono text-gray-700">₹{Math.round(order.gstAmount / 2).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>SGST (9%):</span>
                <span className="font-mono text-gray-700">₹{Math.round(order.gstAmount / 2).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-900">
                <span>Total Invoice Value:</span>
                <span className="text-red-600 font-mono text-base">₹{order.totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
