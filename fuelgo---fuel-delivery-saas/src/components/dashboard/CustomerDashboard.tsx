import React from 'react';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { FuelOrder, AssetVehicle } from '../../types';
import {
  TrendingUp,
  Fuel,
  Truck,
  ShieldCheck,
  FileText,
  RotateCw,
  Plus,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  QrCode
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const {
    orders,
    setActiveOrder,
    setActiveTab,
    reorder,
    setViewingInvoiceOrder,
    setViewingQrOrder
  } = useOrder();
  const { user, switchRole } = useAuth();

  // Metrics math
  const totalFuelLitres = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  const totalSpend = orders.reduce((sum, o) => sum + (o.totalPayable || 0), 0);
  const totalGstCredit = orders.reduce((sum, o) => sum + (o.gstAmount || 0), 0);

  const getStatusBadge = (status: FuelOrder['status']) => {
    switch (status) {
      case 'en_route':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Bowser En Route</span>
          </span>
        );
      case 'dispensing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Dispensing on Site</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center space-x-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered & Verified</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Welcome Banner */}
      <div className="bg-white border border-gray-200 p-6 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-red-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span>{user?.companyName || 'Enterprise Fuel Cloud'}</span>
              <span className="text-gray-300">•</span>
              <span className="text-emerald-700 font-mono">GSTIN: {user?.gstin || '29AAACA8821R1ZK'}</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-gray-900">Fleet & Genset Refueling Hub</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              Monitor real-time DG set fuel reserves, manage automated scheduled dispatches, and track PESO quality delivery challans.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Fuel Dispatch</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai_advisor')}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>AI Fuel Estimator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spend & ESG KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Total Fuel Supplied</span>
            <Fuel className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-heading text-gray-900 font-mono">
            {totalFuelLitres.toLocaleString('en-IN')} L
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
            <span>↑ 18% vs last month</span>
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Total INR Spend</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-heading text-gray-900 font-mono">
            ₹{totalSpend.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-gray-500">Net 30 Corporate Credit</p>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>GST Input Tax Credit</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-700 font-mono">
            ₹{totalGstCredit.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-gray-500">18% ITC claimed automatically</p>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Corporate Credit Limit</span>
            <Building2 className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-heading text-gray-900 font-mono">
            ₹{((user?.creditLimit || 500000) - (user?.creditUsed || 142800)).toLocaleString('en-IN')}
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-red-600 h-full rounded-full" style={{ width: '28%' }}></div>
          </div>
        </div>
      </div>

      {/* DG Gensets & Fleet Asset Fuel Status */}
      <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-gray-900">Registered Machinery & Fuel Levels</h3>
            <p className="text-xs text-gray-500 mt-0.5">Automated telemetry with threshold replenishment alerts.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className="text-xs text-red-600 hover:text-red-700 font-semibold"
          >
            Refuel All Assets →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(user?.savedAssets || []).map((asset) => {
            const isLow = asset.currentFuelLevelPercent <= 20;
            return (
              <div
                key={asset.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isLow ? 'bg-amber-50/60 border-amber-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900 truncate">{asset.name}</span>
                  <span className="text-[10px] font-mono bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                    {asset.registrationNo}
                  </span>
                </div>

                {/* Fuel Level Meter */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Current Level:</span>
                    <strong className={`font-mono ${isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {asset.currentFuelLevelPercent}% ({Math.round((asset.tankCapacityL * asset.currentFuelLevelPercent) / 100)} L)
                    </strong>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${asset.currentFuelLevelPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Tank: {asset.tankCapacityL} L</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('order')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold border border-gray-200 shadow-2xs transition-all"
                  >
                    Refuel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders History & Dispatches Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-gray-900">Fuel Dispatch History & Tax Invoices</h3>
            <p className="text-xs text-gray-500 mt-0.5">Real-time status, PESO density records, and printable GST tax bills.</p>
          </div>
          <span className="text-xs text-gray-500">{orders.length} total dispatches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Order ID & Date</th>
                <th className="px-5 py-3.5">Fuel & Volume</th>
                <th className="px-5 py-3.5">Delivery Site</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Amount (INR)</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-gray-900 font-mono">{ord.orderNumber}</div>
                    <div className="text-[11px] text-gray-500">{ord.createdAt}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-gray-900 font-mono">{ord.quantity} Litres</div>
                    <div className="text-[11px] text-gray-500">{ord.fuelType.replace('_', ' ').toUpperCase()}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900 truncate max-w-[180px]">{ord.deliveryAddress.label}</div>
                    <div className="text-[11px] text-gray-500">{ord.asset.name}</div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(ord.status)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-gray-900 font-mono">₹{ord.totalPayable.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-emerald-700">GST: ₹{ord.gstAmount}</div>
                  </td>
                  <td className="px-5 py-4 text-right space-x-1.5">
                    {ord.status === 'en_route' || ord.status === 'dispensing' ? (
                      <div className="inline-flex space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingQrOrder(ord)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs transition-all border border-red-200 flex items-center space-x-1"
                          title="Show Delivery QR Pass"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveOrder(ord);
                            setActiveTab('tracking');
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                        >
                          Track Live
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingQrOrder(ord)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-all flex items-center space-x-1"
                          title="View Delivery QR Gate Pass"
                        >
                          <QrCode className="w-3.5 h-3.5 text-gray-500" />
                          <span>QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingInvoiceOrder(ord)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-all flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span>Invoice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => reorder(ord)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-red-600 rounded-lg text-xs font-medium border border-gray-200 transition-all flex items-center space-x-1"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
