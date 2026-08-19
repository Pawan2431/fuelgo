import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_HOST } from '../../api';
import { FuelOrder } from '../../types';
import {
  TrendingUp,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  Settings,
  Save
} from 'lucide-react';

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  activeDeliveries: number;
  pendingUpi: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceMessage, setPriceMessage] = useState('');

  const fetchAdminData = async () => {
    const token = localStorage.getItem('fuelgo_token');
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, ordersRes, pricesRes] = await Promise.all([
        fetch(`${API_HOST}/api/orders/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_HOST}/api/orders/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_HOST}/api/prices`)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (pricesRes.ok) setPrices(await pricesRes.json());
    } catch (e) {
      console.error("Failed to load admin data", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (index: number, value: string) => {
    const newPrices = [...prices];
    newPrices[index].price_per_unit = parseFloat(value) || 0;
    setPrices(newPrices);
  };

  const handleSavePrices = async () => {
    setSavingPrices(true);
    setPriceMessage('');
    try {
      const token = localStorage.getItem('fuelgo_token');
      const res = await fetch(`${API_HOST}/api/prices`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prices })
      });

      const data = await res.json();
      if (res.ok) {
        setPriceMessage('Prices updated successfully!');
        setPrices(data.prices);
      } else {
        setPriceMessage(data.error || 'Failed to update prices.');
      }
    } catch (err) {
      console.error('Error saving prices:', err);
      setPriceMessage('An error occurred while saving.');
    }
    setSavingPrices(false);
    setTimeout(() => setPriceMessage(''), 3000);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const isAdmin = user && (
    user.role === 'admin' ||
    user.email === 'admin@fuelgo.com' ||
    user.email === 'pullagurapawanteja@gmail.com' ||
    user.phone === '+917989154858' ||
    user.phone === '7989154858' ||
    (user.name && user.name.toLowerCase().includes('pawan'))
  );

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Command Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Platform overview and order management</p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats ? formatCurrency(stats.totalRevenue) : '...'}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalOrders || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Deliveries</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activeDeliveries || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending UPI</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.pendingUpi || 0}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Live Fuel Prices Editable Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5" /> Live Fuel Prices
          </h2>
        </div>
        <div className="p-6">
          {priceMessage && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-medium ${
              priceMessage.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {priceMessage.includes('success') ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {priceMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prices.map((p, idx) => (
              <div key={p.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {p.fuel_type} <span className="lowercase text-xs font-normal ml-1">(per {p.unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    value={p.price_per_unit}
                    onChange={(e) => handlePriceChange(idx, e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-lg rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 font-bold"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSavePrices}
            disabled={savingPrices || loading}
            className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPrices ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {savingPrices ? 'Updating...' : 'Publish Live Prices'}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Platform Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Order ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Fuel & Qty</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id || order.id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">#{order._id || order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{order.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{order.userId?.email || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                        {order.fuelType || order.fuel_type}
                      </div>
                      <div className="text-xs text-gray-500">{order.quantity || order.quantity_litres} Litres</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(order.totalPrice || order.total_price)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">{order.paymentMethod || order.payment_method}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}
                      `}>
                        {(order.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt || order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
