import React, { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_CITIES } from '../../mockData';
import {
  Fuel,
  MapPin,
  Truck,
  Zap,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  User,
  LogOut,
  Building2,
  Lock,
  Phone,
  Sparkles
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    selectedCity,
    setSelectedCity,
    activeTab,
    setActiveTab,
    activeOrder,
  } = useOrder();

  const {
    user,
    isAuthenticated,
    logout,
    setAuthModalOpen,
    setAuthModalView,
    switchRole,
  } = useAuth();

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isOrderActive = activeOrder && (activeOrder.status === 'en_route' || activeOrder.status === 'dispensing');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xs">
      {/* 1. Live Indian Fuel Rates Ticker */}
      <div className="bg-gray-100/90 border-b border-gray-200 px-4 py-1.5 text-[11px] text-gray-600 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-4 min-w-max">
          <div className="flex items-center space-x-1.5 text-amber-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Fuel Rates ({selectedCity.cityName}):</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-700 font-mono">
            <span>HSD Diesel: <strong className="text-gray-900">₹{selectedCity.dieselRate.toFixed(2)}/L</strong></span>
            <span className="text-gray-300">|</span>
            <span>Petrol (MS): <strong className="text-gray-900">₹{selectedCity.petrolRate.toFixed(2)}/L</strong></span>
            <span className="text-gray-300">|</span>
            <span>Bio-Diesel B20: <strong className="text-emerald-700">₹{selectedCity.biodieselRate.toFixed(2)}/L</strong></span>
            <span className="text-gray-300">|</span>
            <span>Mobile EV Fast: <strong className="text-cyan-700">₹{selectedCity.evRate.toFixed(2)}/kWh</strong></span>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3 text-[10px] text-gray-500 min-w-max pl-4">
          <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Govt. PESO Approved (Govt of India)</span>
          </span>
          <span className="text-gray-300">•</span>
          <span>Zero Pilferage Certified</span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & City Selector */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className="flex items-center space-x-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Fuel className="w-5 h-5 text-gray-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold font-heading text-lg tracking-tight text-gray-900">FuelGo</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                    INDIA
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium -mt-0.5">Doorstep Fuel Cloud</p>
              </div>
            </button>

            {/* City Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>{selectedCity.cityName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 z-50">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-3 py-1 block">
                    Select Active Hub
                  </span>
                  {INDIAN_CITIES.map((city) => (
                    <button
                      key={city.cityName}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-colors ${
                        selectedCity.cityName === city.cityName
                          ? 'bg-amber-500 text-gray-950 font-bold'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span>{city.cityName}</span>
                      <span className="text-[10px] opacity-75">{city.activeBowsersCount} Bowsers</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'order'
                  ? 'bg-gray-900 text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Fuel className="w-4 h-4" />
              <span>Order Fuel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all relative ${
                activeTab === 'tracking'
                  ? 'bg-gray-900 text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Live Bowser GPS</span>
              {isOrderActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gray-900 text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Fleet & DG Hub</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('driver_view')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'driver_view'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Driver Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai_advisor')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'ai_advisor'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Advisor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nearby_stations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'nearby_stations'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Station Finder</span>
            </button>
          </nav>

          {/* User Profile / Auth Button */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pl-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-gray-900 leading-tight">{user.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-amber-600 font-medium capitalize">
                      {user.role === 'bowser_driver' ? 'Bowser Operator' : 'B2B Fleet Lead'}
                    </div>
                  </div>
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover border border-amber-500/50"
                  />
                </button>

                {/* Profile Popup Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-50 space-y-3">
                    <div className="border-b border-gray-100 pb-2.5">
                      <h4 className="text-xs font-bold text-gray-900">{user.name}</h4>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold mt-1 inline-block">
                        GST: {user.gstin || '29AAACA8821R1ZK'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Switch Platform Role</span>
                      <button
                        type="button"
                        onClick={() => {
                          switchRole('b2b_fleet');
                          setActiveTab('dashboard');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-center space-x-2 transition-colors ${
                          user.role === 'b2b_fleet' ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>B2B Fleet / DG Enterprise</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          switchRole('bowser_driver');
                          setActiveTab('driver_view');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-center space-x-2 transition-colors ${
                          user.role === 'bowser_driver' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bowser Driver / Operator</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalView('forgot_password');
                          setAuthModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="text-[11px] text-gray-500 hover:text-gray-900"
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalView('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200/70 text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold transition-all"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalView('signup');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="flex md:hidden items-center justify-around bg-white border-t border-gray-200 py-2 px-1 text-[10px]">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${activeTab === 'order' ? 'text-amber-600 font-bold' : 'text-gray-500'}`}
        >
          <Fuel className="w-4 h-4" />
          <span>Order</span>
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg relative ${activeTab === 'tracking' ? 'text-amber-600 font-bold' : 'text-gray-500'}`}
        >
          <Truck className="w-4 h-4" />
          <span>Live GPS</span>
          {isOrderActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-0 right-2"></span>}
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${activeTab === 'dashboard' ? 'text-amber-600 font-bold' : 'text-gray-500'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Fleet Hub</span>
        </button>
        <button
          onClick={() => setActiveTab('driver_view')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${activeTab === 'driver_view' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
        >
          <Truck className="w-4 h-4 text-emerald-600" />
          <span>Driver</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_advisor')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${activeTab === 'ai_advisor' ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('nearby_stations')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${activeTab === 'nearby_stations' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
        >
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Stations</span>
        </button>
      </div>
    </header>
  );
};
