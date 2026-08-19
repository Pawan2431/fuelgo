import React, { useState, useEffect, useContext } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { AuthContext } from '../context/AuthContext';
import { API_HOST } from '../api';
import '../styles/history.css';

export default function HistoryPage() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalLitres: 0, totalOrders: 0 });

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_HOST}/api/orders/history/${user.id}`)
        .then(r => r.json())
        .then(data => {
          setOrders(data.orders || []);
          
          // Calculate stats
          const totalLitres = data.orders?.reduce((sum, o) => sum + o.quantity_litres, 0) || 0;
          setStats({
            totalLitres,
            totalOrders: data.orders?.length || 0
          });
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <div className="screen">
      <AppHeader />
      
      <div className="history-banner">
        <div className="history-title">My Orders</div>
        <div className="history-stats">
          <div className="stat-card">
            <div className="stat-card-val">{stats.totalLitres}L</div>
            <div className="stat-card-lbl">Total Fuel Ordered</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-val">{stats.totalOrders}</div>
            <div className="stat-card-lbl">Deliveries</div>
          </div>
        </div>
      </div>

      <div className="order-list section-padding">
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
            No past orders found.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-id">#ORD-{1000 + order.id}</div>
                  <div className="order-date">{new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="status-badge">Delivered</div>
              </div>
              <div className="order-body">
                <div>
                  <div className="order-fuel">{order.fuel_type}</div>
                  <div className="order-qty">{order.quantity_litres} Litres • {order.payment_method}</div>
                </div>
                <div className="order-price">₹{order.total_price}</div>
              </div>
              <div className="order-actions">
                <button className="btn-secondary">Download Invoice</button>
                <button className="btn-primary" style={{background: 'var(--primary-soft)', color: 'var(--primary)'}}>Reorder</button>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
