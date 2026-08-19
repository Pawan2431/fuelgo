// api.js
// Dynamically use the current hostname (works for localhost and local network IPs)
// For Android Emulator / Physical Device, we hardcode the local machine IP if it's localhost
export const API_HOST = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://10.205.182.110:3000'
  : (window.location.hostname && window.location.hostname !== 'fuelgo.com') 
    ? `http://${window.location.hostname}:3000` 
    : 'https://fuelgo-backend.onrender.com';
