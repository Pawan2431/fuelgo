import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Save, Loader2 } from 'lucide-react';
import L from 'leaflet';

interface LandmarkAddressFormProps {
  onSaveAddress: (addressData: {
    label: string;
    pincode: string;
    streetAddress: string;
    city: string;
    lat: number;
    lng: number;
  }) => void;
  onCancel: () => void;
}

export const LandmarkAddressForm: React.FC<LandmarkAddressFormProps> = ({ onSaveAddress, onCancel }) => {
  const [siteLabel, setSiteLabel] = useState('');
  
  // States for Address
  const [manualStreet, setManualStreet] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualPincode, setManualPincode] = useState('');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Map, default center
    mapInstanceRef.current = L.map(mapRef.current).setView([13.0827, 80.2707], 13); // Default Chennai roughly

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Custom map icon
    const icon = L.divIcon({
      className: 'custom-pin',
      html: '<div style="width: 24px; height: 24px; background-color: #f59e0b; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 2px 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });

    // Map Click handler to drop a pin and reverse geocode
    mapInstanceRef.current.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Update or create marker
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapInstanceRef.current!);
        
        // Listen to dragend
        markerRef.current.on('dragend', (event) => {
          const marker = event.target;
          const position = marker.getLatLng();
          reverseGeocode(position.lat, position.lng);
        });
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
      
      setLocationCoords({ lat, lng });
      mapInstanceRef.current?.setView([lat, lng]); // Pan to clicked point
      reverseGeocode(lat, lng);
    });

    // Attempt to center map on user's current location once
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && !markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 14);
        }
      }, () => {
        // Ignore location errors
      }, { timeout: 5000 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setLocationCoords({ lat, lng });
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const data = await response.json();
      
      if (data && data.address) {
        const { address } = data;
        
        // Construct a reasonable street address
        const streetParts = [address.road, address.suburb, address.neighbourhood, address.village].filter(Boolean);
        const newStreet = streetParts.length > 0 ? streetParts.join(', ') : data.display_name.split(',')[0];
        
        const newCity = address.city || address.town || address.county || address.state_district || '';
        const newPincode = address.postcode || '';

        setManualStreet(newStreet);
        setManualCity(newCity);
        setManualPincode(newPincode);
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!siteLabel || !manualStreet || !manualCity) {
      alert("Please enter a Site Label, Street Address, and City.");
      return;
    }
    if (!locationCoords) {
      alert("Please tap on the map to set the exact pin location for delivery.");
      return;
    }

    onSaveAddress({
      label: siteLabel,
      pincode: manualPincode,
      streetAddress: manualStreet,
      city: manualCity,
      lat: locationCoords.lat,
      lng: locationCoords.lng
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-white border border-gray-200 rounded-3xl space-y-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-amber-600" />
          Add Delivery Site (Smart Map)
        </h5>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 uppercase">Site Label (e.g. Headquarters)</label>
        <input
          type="text"
          required
          placeholder="e.g. Titan Logistics Hub (Main Yard)"
          value={siteLabel}
          onChange={(e) => setSiteLabel(e.target.value)}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-all"
        />
      </div>

      {/* Map Area */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <label className="text-xs font-bold text-gray-700 uppercase">Pin Exact Location</label>
          <span className="text-[10px] text-gray-500">Tap anywhere to drop pin</span>
        </div>
        <div className="w-full h-[250px] rounded-xl overflow-hidden border border-gray-300 shadow-inner relative z-0">
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {isGeocoding && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2 z-[400]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span className="text-[10px] font-bold text-gray-700">Fetching Address...</span>
            </div>
          )}
        </div>
      </div>

      {/* Auto-filled but editable fields */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
            Street Address 
            {locationCoords && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">Auto-filled</span>}
          </label>
          <input
            type="text"
            required
            value={manualStreet}
            onChange={(e) => setManualStreet(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
            <input
              type="text"
              required
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Pincode</label>
            <input
              type="text"
              value={manualPincode}
              onChange={(e) => setManualPincode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-amber-500 outline-none font-mono transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Smart Address
        </button>
      </div>
    </form>
  );
};
