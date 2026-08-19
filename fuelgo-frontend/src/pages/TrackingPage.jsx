import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Phone, MessageCircle, ChevronLeft } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { API_HOST } from '../api';
import '../styles/tracking.css';

const CENTER = [12.9734, 79.9328]; // Delivery location
const AGENT = [12.9760, 79.9360]; // Agent location

export default function TrackingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetch(`${API_HOST}/api/orders/${orderId}`)
        .then(r => r.json())
        .then(data => setOrder(data.order))
        .catch(console.error);
    } else {
      // Mock order if navigated directly
      setOrder({
        agent_name: 'Ravi Kumar',
        agent_phone: '9876500402',
        status: 'confirmed',
        eta_minutes: 12
      });
    }
  }, [orderId]);

  return (
    <div className="screen" style={{ background: 'var(--surface)' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft />
        </button>
      </div>

      <div className="track-map-container">
        <MapContainer center={CENTER} zoom={15} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <Marker position={CENTER}><Popup>Delivery Location</Popup></Marker>
          <Marker position={AGENT}><Popup>Delivery Agent</Popup></Marker>
        </MapContainer>
      </div>

      <div className="track-info-card">
        <div className="eta-row">
          <div>
            <div className="eta-sub">Estimated Arrival</div>
            <div className="eta-time">{order?.eta_minutes || 12} <span style={{fontSize: 16}}>min</span></div>
          </div>
          <div className="order-pill">#ORD-9928</div>
        </div>

        <div className="driver-card">
          <div className="driver-avatar">👨🏽‍✈️</div>
          <div>
            <div className="driver-name">{order?.agent_name || 'Ravi Kumar'}</div>
            <div className="driver-vehicle">TN-09-CQ-2894 • Mini Truck</div>
          </div>
          <div className="action-btns">
            <a href={`tel:${order?.agent_phone || '9876500402'}`} className="action-btn call"><Phone size={18} /></a>
            <button className="action-btn"><MessageCircle size={18} /></button>
          </div>
        </div>

        <div className="timeline">
          <div className="timeline-item done">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Order Confirmed</div>
              <div className="timeline-sub">10:42 AM</div>
            </div>
          </div>
          <div className="timeline-item active">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Agent Assigned</div>
              <div className="timeline-sub">Ravi Kumar is heading to the station</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Fuel Filled</div>
              <div className="timeline-sub">Pending</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Delivered</div>
              <div className="timeline-sub">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
