import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_HOST } from '../../api';
import { Shield, Clock, Activity, Server, AlertCircle } from 'lucide-react';

export const AdminLogs: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'auth' | 'login' | 'activity' | 'system' | 'orders'>('auth');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (type: string) => {
    const token = localStorage.getItem('fuelgo_token');
    if (!token) return;
    setLoading(true);
    setLogs([]);
    
    let endpoint = '';
    switch(type) {
      case 'auth': endpoint = '/api/logs/auth'; break;
      case 'login': endpoint = '/api/logs/login-history'; break;
      case 'activity': endpoint = '/api/logs/activity'; break;
      case 'system': endpoint = '/api/logs/system'; break;
      case 'orders': endpoint = '/api/logs/order-history'; break;
    }

    try {
      const res = await fetch(`${API_HOST}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(`Failed to load ${type} logs`, e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(activeTab);
  }, [activeTab]);

  if (!user || (user.email !== 'admin@fuelgo.com' && user.email !== 'pullagurapawanteja@gmail.com')) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view logs.</p>
      </div>
    );
  }

  const renderAuthLogs = () => (
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-4 py-3 font-semibold text-gray-600">Time</th>
          <th className="px-4 py-3 font-semibold text-gray-600">User / Identifier</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Method</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Event</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {logs.map((log: any, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
            <td className="px-4 py-3">{log.userId?.email || log.identifier}</td>
            <td className="px-4 py-3">{log.loginMethod}</td>
            <td className="px-4 py-3 font-medium">{log.event}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {log.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderLoginHistory = () => (
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-4 py-3 font-semibold text-gray-600">User</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Method</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Login Time</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Logout Time</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {logs.map((log: any, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3">{log.userId?.email || log.identifier}</td>
            <td className="px-4 py-3">{log.loginMethod}</td>
            <td className="px-4 py-3 text-gray-500">{new Date(log.loginTime).toLocaleString()}</td>
            <td className="px-4 py-3 text-gray-500">{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : '-'}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs ${log.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {log.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderActivityLogs = () => (
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-4 py-3 font-semibold text-gray-600">Time</th>
          <th className="px-4 py-3 font-semibold text-gray-600">User</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Module</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Description</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {logs.map((log: any, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
            <td className="px-4 py-3">{log.userId?.email || 'System'}</td>
            <td className="px-4 py-3 font-medium text-gray-700">{log.module}</td>
            <td className="px-4 py-3 font-medium text-blue-600">{log.action}</td>
            <td className="px-4 py-3 text-gray-600">{log.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSystemLogs = () => (
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-4 py-3 font-semibold text-gray-600">Time</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Level</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Service</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Message</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {logs.map((log: any, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs font-bold ${log.level === 'ERROR' || log.level === 'FATAL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {log.level}
              </span>
            </td>
            <td className="px-4 py-3 font-medium">{log.service}</td>
            <td className="px-4 py-3 text-gray-700">{log.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderOrderHistory = () => (
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-4 py-3 font-semibold text-gray-600">Time</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Order ID</th>
          <th className="px-4 py-3 font-semibold text-gray-600">User</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Change</th>
          <th className="px-4 py-3 font-semibold text-gray-600">Notes</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {logs.map((log: any, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
            <td className="px-4 py-3 font-mono">{log.orderId?.substring(0, 8) || '...'}</td>
            <td className="px-4 py-3">{log.userId?.email || 'System'}</td>
            <td className="px-4 py-3 font-medium">
              {log.previousStatus ? `${log.previousStatus} → ` : ''}
              <span className="text-blue-600">{log.newStatus}</span>
            </td>
            <td className="px-4 py-3 text-gray-600">{log.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in pb-24 lg:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Logs & History</h1>
        <p className="text-gray-500 mt-1">Audit trails, authentication history, and application logs</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveTab('auth')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'auth' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
          <Shield className="w-4 h-4" /> Auth Logs
        </button>
        <button onClick={() => setActiveTab('login')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'login' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
          <Clock className="w-4 h-4" /> Login History
        </button>
        <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'activity' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
          <Activity className="w-4 h-4" /> Activity
        </button>
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
          <Server className="w-4 h-4" /> Order History
        </button>
        <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'system' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
          <Server className="w-4 h-4" /> System Logs
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No logs found for this category.</div>
          ) : (
            <>
              {activeTab === 'auth' && renderAuthLogs()}
              {activeTab === 'login' && renderLoginHistory()}
              {activeTab === 'activity' && renderActivityLogs()}
              {activeTab === 'system' && renderSystemLogs()}
              {activeTab === 'orders' && renderOrderHistory()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
