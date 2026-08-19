import React from 'react';
import { Fuel, ShieldCheck, Heart, MapPin, Phone, Mail } from 'lucide-react';
import { INDIAN_CITIES } from '../../mockData';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8 mt-12 text-gray-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-gray-950 font-bold">
                <Fuel className="w-4 h-4" />
              </div>
              <span className="font-bold font-heading text-lg text-gray-900">FuelGo India</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              India's leading PESO-licensed on-demand doorstep fuel delivery and smart fleet SaaS cloud. Fueling commercial DG sets, logistics hauler fleets, and construction sites.
            </p>
            <div className="flex items-center space-x-2 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>PESO License #PESO/CC/KR/2024/9912</span>
            </div>
          </div>

          {/* Active Operating Hubs */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 font-heading text-sm">Active City Hubs</h4>
            <ul className="space-y-1.5 text-[11px]">
              {INDIAN_CITIES.map((c) => (
                <li key={c.cityName} className="flex items-center space-x-1.5 text-gray-600">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{c.cityName} ({c.state})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Supported Fuel & Power Products */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 font-heading text-sm">Fuel & Clean Energy</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="text-gray-600">High-Speed Diesel (HSD BS-VI)</li>
              <li className="text-gray-600">Motor Spirit Petrol (Speed E20)</li>
              <li className="text-gray-600">Clean Bio-Diesel B20 (IS 15607)</li>
              <li className="text-gray-600">Mobile EV Fast Charge (120kW DC)</li>
              <li className="text-gray-600">AdBlue DEF Exhaust Fluid</li>
            </ul>
          </div>

          {/* 24x7 Safety Command Center */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 font-heading text-sm">24x7 Command Center</h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-gray-700 font-medium">1800-419-FUEL / +91 80 4910 8800</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-gray-700 font-medium">dispatch@fuelgo.in</span>
              </div>
              <p className="text-gray-400 text-[10px] pt-1">
                Central Operations: Embassy TechVillage, Outer Ring Road, Bengaluru, Karnataka - 560103
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
          <div>
            © {new Date().getFullYear()} FuelGo Technologies India Pvt Ltd. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <span className="hover:text-gray-700 cursor-pointer">PESO Safety Policy</span>
            <span className="hover:text-gray-700 cursor-pointer">GST Compliance Terms</span>
            <span className="hover:text-gray-700 cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
