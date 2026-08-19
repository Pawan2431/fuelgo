// api.js
// Dynamically use the current hostname (works for localhost and local network IPs like 192.168.x.x)
export const API_HOST = (window.location.hostname && window.location.hostname !== 'fuelgo.com') 
  ? `http://${window.location.hostname}:3000` 
  : 'https://fuelgo-backend.onrender.com';
