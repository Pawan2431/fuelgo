import React, { useEffect, useRef, useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  MapPin,
  Compass,
  Layers,
  PhoneCall,
  ShieldCheck,
  Zap,
  Clock,
  Gauge,
  Droplets,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  Flame,
  FileText,
  QrCode
} from 'lucide-react';
import L from 'leaflet';

export const LiveBowserMap: React.FC = () => {
  const {
    activeOrder,
    bowserTelemetry,
    startDispensingSimulation,
    completeDispensingSimulation,
    setActiveTab,
    setViewingInvoiceOrder,
    setViewingQrOrder
  } = useOrder();
  const { user } = useAuth();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const bowserMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite'>('dark');
  const [showSosModal, setShowSosModal] = useState(false);
  const [driverCallActive, setDriverCallActive] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = activeOrder?.deliveryAddress.lat || 12.9716;
      const initialLng = activeOrder?.deliveryAddress.lng || 77.5946;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Add dark OpenStreetMap tiles
      const tileUrl =
        mapLayer === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Don't tear down on every render to keep animations smooth
    };
  }, []);

  // Update map tile layer when toggled
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    const tileUrl =
      mapLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);
  }, [mapLayer]);

  // Update Bowser and Destination markers and polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !activeOrder) return;

    const map = mapInstanceRef.current;
    const bowserLat = bowserTelemetry.lat;
    const bowserLng = bowserTelemetry.lng;
    const destLat = activeOrder.deliveryAddress.lat;
    const destLng = activeOrder.deliveryAddress.lng;

    // Custom Truck Marker Icon HTML
    const bowserIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 rounded-full bg-amber-500/20 animate-radar"></div>
        <div class="w-10 h-10 rounded-xl bg-slate-950 border-2 border-amber-500 shadow-xl shadow-amber-500/40 flex items-center justify-center text-amber-400 font-bold transform hover:scale-110 transition-transform">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z"/>
            <circle cx="17" cy="18.5" r="2.5"/>
            <circle cx="7" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <div class="absolute -top-6 bg-slate-900/90 backdrop-blur border border-amber-500/40 text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
          Bowser #09 (${bowserTelemetry.speed} km/h)
        </div>
      </div>
    `;

    const destIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-full bg-emerald-500/20 animate-ping absolute"></div>
        <div class="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white shadow-xl shadow-emerald-500/50 flex items-center justify-center text-white font-bold">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="absolute -top-6 bg-slate-900/90 backdrop-blur border border-emerald-500/40 text-[10px] text-emerald-300 font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
          Target: ${activeOrder.asset.name.split(' ')[0]}
        </div>
      </div>
    `;

    const customBowserIcon = L.divIcon({
      className: 'custom-bowser-marker',
      html: bowserIconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const customDestIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: destIconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // Update or create bowser marker
    if (bowserMarkerRef.current) {
      bowserMarkerRef.current.setLatLng([bowserLat, bowserLng]);
      bowserMarkerRef.current.setIcon(customBowserIcon);
    } else {
      bowserMarkerRef.current = L.marker([bowserLat, bowserLng], { icon: customBowserIcon }).addTo(map);
    }

    // Update or create destination marker
    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng([destLat, destLng]);
      destMarkerRef.current.setIcon(customDestIcon);
    } else {
      destMarkerRef.current = L.marker([destLat, destLng], { icon: customDestIcon }).addTo(map);
    }

    // Update Polyline route
    const routeCoords: [number, number][] = [
      [bowserLat, bowserLng],
      // Simulated realistic turn waypoint
      [(bowserLat + destLat) / 2 + 0.001, (bowserLng + destLng) / 2 - 0.0015],
      [destLat, destLng],
    ];

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(routeCoords);
    } else {
      polylineRef.current = L.polyline(routeCoords, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
    }
  }, [bowserTelemetry, activeOrder]);

  const recenterMap = () => {
    if (!mapInstanceRef.current || !activeOrder) return;
    const group = L.featureGroup([
      L.marker([bowserTelemetry.lat, bowserTelemetry.lng]),
      L.marker([activeOrder.deliveryAddress.lat, activeOrder.deliveryAddress.lng]),
    ]);
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
  };

  if (!activeOrder) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl shadow-xs">
        <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold font-heading text-gray-900">No Active Fuel Dispatches</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 mb-6">
          Order High-Speed Diesel, Petrol, or Mobile EV Fast Charging for your DG gensets, fleets, or equipment.
        </p>
        <button
          onClick={() => setActiveTab('order')}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
        >
          Book Fuel Delivery Now
        </button>
      </div>
    );
  }

  const isCompleted = activeOrder.status === 'completed';
  const isDispensing = activeOrder.status === 'dispensing' || bowserTelemetry.isDispensing;
  const driver = activeOrder.assignedBowser;

  return (
    <div className="space-y-4">
      {/* Top Telemetry Header Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3.5 rounded-2xl shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-500">Estimated Arrival</div>
            <div className="text-lg font-bold text-gray-900 font-heading">
              {isCompleted ? 'Delivered' : isDispensing ? 'On-Site Dispensing' : `${bowserTelemetry.etaMinutes} Mins`}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-2xl shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-500">Remaining Distance</div>
            <div className="text-lg font-bold text-gray-900 font-heading">
              {isCompleted ? '0.0 km' : `${bowserTelemetry.distanceRemainingKm} km`}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-2xl shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-500">Fuel Qty Ordered</div>
            <div className="text-lg font-bold text-gray-900 font-heading">
              {activeOrder.quantity} Litres
            </div>
          </div>
        </div>

        {/* Secure Delivery OTP for Customer Safety */}
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-amber-800">
              <Lock className="w-3.5 h-3.5" />
              <span>Safe Delivery OTP</span>
            </div>
            <div className="text-xl font-bold font-mono tracking-widest text-gray-900 mt-0.5">
              {activeOrder.deliveryOtp}
            </div>
          </div>
          <div className="text-right flex flex-col items-end space-y-1">
            <button
              type="button"
              onClick={() => setViewingQrOrder(activeOrder)}
              className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-300 shadow-2xs transition-all flex items-center space-x-1"
            >
              <QrCode className="w-3.5 h-3.5 text-red-600" />
              <span>Show QR Pass</span>
            </button>
            <span className="text-[9px] text-gray-500 block">PESO Gate Pass</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-gray-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map Control Floating Buttons */}
        <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
          <button
            onClick={recenterMap}
            title="Recenter Map"
            className="p-2.5 bg-white/95 hover:bg-gray-50 text-gray-800 rounded-xl border border-gray-200 backdrop-blur-md shadow-md transition-all"
          >
            <Compass className="w-5 h-5 text-amber-600" />
          </button>
          <button
            onClick={() => setMapLayer(mapLayer === 'dark' ? 'satellite' : 'dark')}
            title="Switch Map Layers"
            className="p-2.5 bg-white/95 hover:bg-gray-50 text-gray-800 rounded-xl border border-gray-200 backdrop-blur-md shadow-md transition-all"
          >
            <Layers className="w-5 h-5 text-indigo-600" />
          </button>
        </div>

        {/* PESO Certification Floating Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-md border border-emerald-200 px-3 py-1.5 rounded-full shadow-md">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">PESO Approved Smart Bowser</span>
          <span className="text-[10px] text-gray-500">| KA-01-MF-8834</span>
        </div>

        {/* Live Dispensing Flow Overlay Modal when active */}
        {isDispensing && (
          <div className="absolute inset-x-4 top-16 z-30 bg-white/95 backdrop-blur-md border border-amber-300 p-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-pulse">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 font-heading">PESO Certified Digital Dispense in Progress</h4>
                  <p className="text-[11px] text-gray-500">Flow Meter Calibrated • Static Earthing Ground Clamped Active</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {bowserTelemetry.flowRateLpm} LPM Flow Rate
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-700">
                  Dispensed: <strong className="text-gray-900 font-mono">{bowserTelemetry.dispensedLitres.toFixed(1)} L</strong> of {activeOrder.quantity} L
                </span>
                <span className="text-amber-700 font-bold">
                  {Math.round((bowserTelemetry.dispensedLitres / activeOrder.quantity) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-300 animate-fuel-flow"
                  style={{ width: `${Math.min(100, (bowserTelemetry.dispensedLitres / activeOrder.quantity) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Floating Control Deck on Map */}
        <div className="absolute inset-x-4 bottom-4 z-20 bg-white/95 backdrop-blur-md border border-gray-200 p-4 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Driver Profile */}
            <div className="flex items-center space-x-3.5">
              <img
                src={driver?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={driver?.name || 'Driver'}
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shadow-sm"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-gray-900 font-heading">{driver?.name || 'Rajesh Kumar Yadav'}</h4>
                  <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center space-x-1 font-semibold">
                    <span>★</span>
                    <span>{driver?.rating || '4.94'}</span>
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center space-x-2 mt-0.5">
                  <span>Bowser: <strong className="text-gray-800">{driver?.bowserRegNo || 'KA-01-MF-8834'}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">{driver?.tripsCompleted || '1,420'}+ safe trips</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {!isCompleted && !isDispensing && (
                <button
                  type="button"
                  onClick={() => startDispensingSimulation(activeOrder.id)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simulate Arrival & Dispense</span>
                </button>
              )}

              {isCompleted && (
                <button
                  type="button"
                  onClick={() => setViewingInvoiceOrder(activeOrder)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Tax Invoice</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDriverCallActive(!driverCallActive)}
                className={`p-2.5 rounded-xl border transition-all ${
                  driverCallActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-gray-100 hover:bg-gray-200/70 text-gray-700 border-gray-200'
                }`}
                title="Call Driver via Masked Number"
              >
                <PhoneCall className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowSosModal(true)}
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
                title="PESO Emergency SOS"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Call Simulator Dropdown */}
          {driverCallActive && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Connecting masked call to Driver Rajesh Yadav (+91 98860 77123)...</span>
              </div>
              <button
                onClick={() => setDriverCallActive(false)}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700"
              >
                End Call
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Destination & Asset Specs Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Destination Location Info */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Delivery Destination</span>
          </div>
          <h4 className="text-base font-bold text-gray-900 font-heading">{activeOrder.deliveryAddress.label}</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            {activeOrder.deliveryAddress.streetAddress}, {activeOrder.deliveryAddress.area}, {activeOrder.deliveryAddress.city} - {activeOrder.deliveryAddress.pincode}
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
            <span className="bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
              Site Contact: <strong className="text-gray-800">{activeOrder.deliveryAddress.siteContactPerson}</strong>
            </span>
            <span className="bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
              Tel: {activeOrder.deliveryAddress.siteContactPhone}
            </span>
          </div>
        </div>

        {/* Target Asset / Genset Fuel Specs */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Target Asset Specs</span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold uppercase">
              {activeOrder.asset.type.replace('_', ' ')}
            </span>
          </div>
          <h4 className="text-base font-bold text-gray-900 font-heading">{activeOrder.asset.name}</h4>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] text-gray-500">Tank Capacity</div>
              <div className="text-xs font-bold text-gray-900">{activeOrder.asset.tankCapacityL} L</div>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] text-gray-500">Reg / Asset ID</div>
              <div className="text-xs font-bold font-mono text-amber-700">{activeOrder.asset.registrationNo}</div>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] text-gray-500">PESO Density</div>
              <div className="text-xs font-bold text-emerald-700">{activeOrder.densityReport?.measuredDensity || 832.4} kg/m³</div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-red-200 rounded-3xl p-6 text-gray-900 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading text-red-600">PESO Emergency Safety Stop</h3>
              <p className="text-xs text-gray-600 mt-1">
                Trigger emergency lockdown for Bowser <strong className="text-gray-900">{driver?.bowserRegNo}</strong>. This immediately signals dispatch control and triggers emergency valve cutoff.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>National Emergency:</span>
                <strong className="text-gray-900">112</strong>
              </div>
              <div className="flex justify-between">
                <span>PESO Disaster Cell:</span>
                <strong className="text-gray-900">1800-233-PESO</strong>
              </div>
              <div className="flex justify-between">
                <span>FuelGo 24x7 Command:</span>
                <strong className="text-amber-700">+91 80 4910 8800</strong>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSosModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  alert('Emergency alert transmitted to FuelGo Command Center & Bowser Driver.');
                  setShowSosModal(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20"
              >
                Confirm SOS Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
