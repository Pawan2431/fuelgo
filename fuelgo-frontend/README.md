# 🎨 FuelGo Front-End Application

Client-side application for FuelGo fuel delivery service, decoupled for standalone hosting (Vercel, Netlify, GitHub Pages, Firebase Hosting).

## 🚀 Structure
- `index.html`: Responsive Landing Page & Order Engine
- `fuelgo-app.html`: Customer Mobile PWA Application Interface
- `manifest.json`: Web App Manifest for Android/iOS installation
- `sw.js`: Service Worker for offline caching

## ⚡ Supabase Database Connection
Configured with direct Supabase JavaScript Client SDK connecting to:
- **Supabase URL**: `https://feshnblvfdhjvgehklvd.supabase.co`
- **Tables**: `users`, `fuel_prices`, `stations`, `orders`
