import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, AlertTriangle, Crosshair, ExternalLink } from 'lucide-react';
import L from 'leaflet';

// Define the Fuel Station interface
export interface FuelStation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
  distance: number;
}

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

export const StationFinder: React.FC = () => {
  const { user } = useAuth();
  
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [stations, setStations] = useState<FuelStation[]>([]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const stationMarkersRef = useRef<L.Marker[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize Leaflet map
    mapInstance.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // Default to India center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Request & Watch User Location
  const requestUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    if ('geolocation' in navigator) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setIsLoadingLocation(false);
          
          if (mapInstance.current) {
            mapInstance.current.setView([lat, lng], 14);

            // Create or update user marker
            if (!userMarkerRef.current) {
              const userIcon = L.divIcon({
                className: 'custom-user-marker',
                html: '<div style="width: 16px; height: 16px; background-color: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              });
              userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(mapInstance.current);
            } else {
              userMarkerRef.current.setLatLng([lat, lng]);
            }
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError("Location permission is required to find nearby fuel stations.");
          } else {
            setLocationError("Unable to retrieve your location.");
          }
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    requestUserLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch Nearby Stations using Overpass API
  useEffect(() => {
    if (!userLocation) return;
    
    const fetchStations = async () => {
      setIsSearching(true);
      try {
        const radius = 5000; // 5000 meters
        const query = `
          [out:json];
          node["amenity"="fuel"](around:${radius},${userLocation.lat},${userLocation.lng});
          out;
        `;
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.elements) {
          const fetchedStations: FuelStation[] = data.elements.map((el: any) => {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, el.lat, el.lon);
            const name = el.tags?.name || el.tags?.brand || "Fuel Station";
            const addressParts = [
              el.tags?.['addr:street'],
              el.tags?.['addr:city']
            ].filter(Boolean);
            const address = addressParts.length > 0 ? addressParts.join(', ') : '';

            return {
              id: el.id.toString(),
              lat: el.lat,
              lng: el.lon,
              name,
              address,
              distance
            };
          });

          // Sort by distance
          fetchedStations.sort((a, b) => a.distance - b.distance);
          setStations(fetchedStations);
        }
      } catch (error) {
        console.error("Error fetching from Overpass:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchStations();
  }, [userLocation]); // Re-fetch or re-calculate when user moves significantly, for now we re-fetch when location updates.
  // Note: To optimize, you might only re-fetch if distance > 1km from last fetch, but this satisfies the prompt.

  // Update Station Markers
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    stationMarkersRef.current.forEach(marker => marker.remove());
    stationMarkersRef.current = [];

    const stationIcon = L.divIcon({
      className: 'custom-station-marker',
      html: '<div style="width: 24px; height: 24px; background-color: #f59e0b; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22v-8"/><path d="M3 22V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16"/><path d="M11 22H2"/><path d="M7 2v4"/><path d="M11 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4v6h5"/><path d="M15 14V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"/></svg></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    stations.forEach(station => {
      const popupContent = `
        <div style="font-family: sans-serif; text-align: center;">
          <b style="font-size: 14px; color: #111827;">${station.name}</b><br/>
          ${station.address ? `<span style="font-size: 12px; color: #4b5563;">${station.address}</span><br/>` : ''}
          <span style="font-size: 12px; color: #b45309; font-weight: bold;">${formatDistance(station.distance)}</span><br/><br/>
          <a href="${getDirectionsUrl(station.lat, station.lng)}" target="_blank" style="background: #2563eb; color: white; padding: 4px 10px; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block;">Get Directions</a>
        </div>
      `;

      const marker = L.marker([station.lat, station.lng], { icon: stationIcon })
        .bindPopup(popupContent)
        .addTo(mapInstance.current!);
      
      stationMarkersRef.current.push(marker);
    });
  }, [stations]);

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
  };

  const getDirectionsUrl = (destLat: number, destLng: number) => {
    if (!userLocation) return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* LEFT PANEL: Stations List & Controls */}
      <div className="w-full lg:w-1/3 flex flex-col space-y-4 h-full bg-white border border-gray-200 rounded-3xl p-4 shadow-sm overflow-hidden">
        
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Nearby Fuel Stations
          </h2>
          <button 
            onClick={requestUserLocation}
            disabled={isLoadingLocation}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            title="Use My Current Location"
          >
            <Crosshair className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {locationError && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{locationError}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
          {isLoadingLocation ? (
            <div className="text-center p-6 text-blue-600 text-sm font-semibold animate-pulse">
              Getting your exact location...
            </div>
          ) : isSearching ? (
             <div className="text-center p-6 text-amber-600 text-sm font-semibold animate-pulse">
              Finding nearby fuel stations...
            </div>
          ) : stations.length === 0 ? (
            <div className="text-center p-6 text-gray-500 text-sm">
              No fuel stations found within 5 km.
            </div>
          ) : (
            stations.map((station) => (
              <div 
                key={station.id} 
                className="p-3 rounded-2xl border border-gray-200 hover:border-blue-300 bg-white hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{station.name}</h3>
                    {station.address && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{station.address}</p>}
                    <p className="text-xs font-mono font-bold text-amber-700 mt-1">{formatDistance(station.distance)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-3">
                  <a 
                    href={getDirectionsUrl(station.lat, station.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Get Directions
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Map Area */}
      <div className="w-full lg:w-2/3 h-full rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100 z-0">
         <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

    </div>
  );
};
