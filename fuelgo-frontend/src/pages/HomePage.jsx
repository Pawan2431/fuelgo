import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Droplets, Wallet, Bell, Crosshair } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import OrderConfirmModal from '../components/OrderConfirmModal';
import { AuthContext } from '../context/AuthContext';
import { API_HOST } from '../api';
import '../styles/home.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const DEFAULT_CENTER = [12.9734, 79.9328];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [stations, setStations] = useState([]);
  const [fuelPrices, setFuelPrices] = useState([]);
  
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedFuel, setSelectedFuel] = useState(null);
  const [qty, setQty] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_HOST}/api/orders/stations`)
      .then(r => r.json())
      .then(setStations)
      .catch(console.error);

    fetch(`${API_HOST}/api/orders/fuel-prices`)
      .then(r => r.json())
      .then(setFuelPrices)
      .catch(console.error);
  }, []);

  const handleDecreaseQty = () => setQty(q => (q > 1 ? q - 1 : 1));
  const handleIncreaseQty = () => setQty(q => q + 1);

  const calculateTotal = () => {
    if (!selectedFuel) return 0;
    const price = fuelPrices.find(f => f.fuel_type === selectedFuel)?.price_per_unit || 0;
    return (price * qty).toFixed(2);
  };

  const handleOrderClick = () => {
    if (!selectedStation || !selectedFuel) {
      alert('Please select a station and fuel type.');
      return;
    }
    setIsConfirmOpen(true);
  };

  const confirmOrder = async () => {
    setIsConfirmOpen(false);
    try {
      const res = await fetch(`${API_HOST}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 1,
          station_id: selectedStation.id,
          fuel_type: selectedFuel,
          quantity_litres: qty,
          payment_method: 'UPI',
          delivery_address: 'Chetipedu Center'
        })
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/track', { state: { orderId: data.orderId } });
      } else {
        alert(data.error || 'Failed to place order.');
      }
    } catch (e) {
      alert('Network error placing order.');
    }
  };

  return (
    <div className="screen">
      <AppHeader />
      
      <div className="home-banner">
        <div className="user-greeting">
          <div>
            <div className="greeting-text">Good Morning,</div>
            <div className="greeting-name">{user ? user.name.split(' ')[0] : 'Guest'} 👋</div>
          </div>
          <div className="location-pill">
            <MapPin size={12} color="var(--primary)" /> Chetipedu
          </div>
        </div>
        
        <div className="live-card">
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 600 }}>LIVE FUEL PRICES</div>
          <div className="stats-grid">
            {fuelPrices.map(fp => (
              <div key={fp.id} className="stat-box">
                <div className="stat-val">₹{fp.price_per_unit.toFixed(2)}</div>
                <div className="stat-lbl">{fp.fuel_type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-padding">
        <div className="sec-title">Set Delivery Location</div>
        <div className="map-container">
          <MapContainer center={DEFAULT_CENTER} zoom={14} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={DEFAULT_CENTER}>
              <Popup>Chetipedu Dropoff</Popup>
            </Marker>
            {stations.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]}>
                <Popup>{s.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="sec-title">Select Nearby Station</div>
        <div className="station-list">
          {stations.map(s => (
            <div 
              key={s.id} 
              className={`station-item ${selectedStation?.id === s.id ? 'active' : ''}`}
              onClick={() => setSelectedStation(s)}
            >
              <div>
                <div className="station-name">{s.emoji} {s.name}</div>
                <div className="station-sub">{s.city} • Open Now</div>
              </div>
              <div className="station-dist">{s.distance_km} km</div>
            </div>
          ))}
        </div>

        <div className="sec-title">Select Fuel</div>
        <div className="fuel-grid" style={{ marginBottom: '24px' }}>
          {fuelPrices.map(fp => (
            <div 
              key={fp.id} 
              className={`fuel-btn ${selectedFuel === fp.fuel_type ? 'active' : ''}`}
              onClick={() => setSelectedFuel(fp.fuel_type)}
            >
              <span className="fuel-btn-icon">{fp.fuel_type === 'Petrol' ? '⛽' : fp.fuel_type === 'Diesel' ? '🛢️' : '⚡'}</span>
              <div className="fuel-btn-name">{fp.fuel_type}</div>
              <div className="fuel-btn-price">₹{fp.price_per_unit}</div>
            </div>
          ))}
        </div>

        <div className="sec-title">Quantity (Litres)</div>
        <div className="qty-row" style={{ marginBottom: '24px' }}>
          <button className="qty-btn" onClick={handleDecreaseQty}>-</button>
          <div className="qty-val">{qty}L</div>
          <button className="qty-btn" onClick={handleIncreaseQty}>+</button>
        </div>

        <div className="summary-banner">
          <div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '2px' }}>Total Amount</div>
            <div className="summary-price">₹{calculateTotal()}</div>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: 'auto', padding: '12px 24px' }}
            onClick={handleOrderClick}
          >
            Review Order
          </button>
        </div>
      </div>

      <OrderConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmOrder}
        orderDetails={{
          address: 'Chetipedu Center',
          station: selectedStation?.name,
          fuel: selectedFuel,
          qty,
          total: calculateTotal()
        }}
      />
      <BottomNav />
    </div>
  );
}
