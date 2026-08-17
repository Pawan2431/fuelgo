import React, { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { FuelType, AssetVehicle, DeliveryAddress, FuelOrder } from '../../types';
import { FUEL_PRODUCTS } from '../../mockData';
import { SecureDeliveryQrPass } from './SecureDeliveryQrPass';
import { LandmarkAddressForm } from './LandmarkAddressForm';
import {
  Fuel,
  Droplets,
  Zap,
  Flame,
  Leaf,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Truck,
  Sparkles,
  Info,
  QrCode,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FuelOrderWizard: React.FC = () => {
  const {
    selectedCity,
    createOrder,
    createOrderAPI,
    selectedFuelType,
    setSelectedFuelType,
    setActiveTab,
    activeOrder,
    setActiveOrder,
  } = useOrder();
  const { user, addDeliveryAddress, addAssetVehicle } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmedOrder, setConfirmedOrder] = useState<FuelOrder | null>(null);
  const [quantity, setQuantity] = useState<number>(250);
  const [selectedAsset, setSelectedAsset] = useState<AssetVehicle>(
    user?.savedAssets[0] || {
      id: 'ast-default',
      name: 'Cummins 500kVA Industrial Genset',
      type: 'dg_genset',
      registrationNo: 'DG-MAIN-01',
      fuelType: 'diesel_hsd',
      tankCapacityL: 1000,
      currentFuelLevelPercent: 20,
    }
  );
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress>(
    user?.savedAddresses[0] || {
      id: 'addr-default',
      label: 'Main Facility Site',
      streetAddress: 'Plot 12, Industrial Area',
      area: 'Whitefield',
      city: selectedCity.cityName,
      state: selectedCity.state,
      pincode: '560066',
      lat: selectedCity.lat,
      lng: selectedCity.lng,
      siteContactPerson: 'Security Control Room',
      siteContactPhone: '+91 98450 11223',
      isGatedOrSecured: true,
      hasEarthingPoint: true,
    }
  );

  const [deliverySlot, setDeliverySlot] = useState<string>('Express Delivery (Under 45 mins)');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet'>('cod');
  const [pesoEarthingChecked, setPesoEarthingChecked] = useState(true);
  const [pesoFireExtChecked, setPesoFireExtChecked] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  // New Address form states
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrPincode, setNewAddrPincode] = useState('');
  const [newAddrContact, setNewAddrContact] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');

  // New Asset form states
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetReg, setNewAssetReg] = useState('');
  const [newAssetCapacity, setNewAssetCapacity] = useState('500');

  const selectedFuel = FUEL_PRODUCTS.find((f) => f.id === selectedFuelType) || FUEL_PRODUCTS[0];
  
  // Pricing math in INR
  const unitPrice = selectedFuel.pricePerUnit;
  const fuelTotal = quantity * unitPrice;
  const deliveryFee = 0; // free doorstep delivery promo
  const platformFee = 99;
  const gstAmount = Math.round((fuelTotal + platformFee) * 0.18);
  const totalPayable = fuelTotal + deliveryFee + platformFee + gstAmount;

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet || !newAddrPincode) return;
    const added: DeliveryAddress = {
      id: `addr-${Date.now()}`,
      label: newAddrLabel || 'New Site Location',
      streetAddress: newAddrStreet,
      area: 'Industrial Belt',
      city: selectedCity.cityName,
      state: selectedCity.state,
      pincode: newAddrPincode,
      lat: selectedCity.lat + (Math.random() - 0.5) * 0.04,
      lng: selectedCity.lng + (Math.random() - 0.5) * 0.04,
      siteContactPerson: newAddrContact || 'Site Supervisor',
      siteContactPhone: newAddrPhone || '+91 98000 00000',
      isGatedOrSecured: true,
      hasEarthingPoint: true,
    };
    addDeliveryAddress(added);
    setSelectedAddress(added);
    setIsAddingAddress(false);
  };

  const handleSaveNewAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName || !newAssetReg) return;
    const added: AssetVehicle = {
      id: `ast-${Date.now()}`,
      name: newAssetName,
      type: 'dg_genset',
      registrationNo: newAssetReg,
      fuelType: selectedFuelType,
      tankCapacityL: parseInt(newAssetCapacity) || 500,
      currentFuelLevelPercent: 25,
    };
    addAssetVehicle(added);
    setSelectedAsset(added);
    setIsAddingAsset(false);
  };

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const token = localStorage.getItem('fuelgo_token');
      if (!token) {
        alert("You must be logged in to place an order.");
        setIsPlacingOrder(false);
        return;
      }
      
      const placed = await createOrderAPI({
        fuelType: selectedFuelType,
        quantity,
        deliveryAddress: selectedAddress,
        asset: selectedAsset,
        scheduledTimeSlot: deliverySlot,
        paymentMethod,
      }, token);
      
      setConfirmedOrder(placed);
    } catch (error: any) {
      alert(error.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getFuelIcon = (id: FuelType) => {
    switch (id) {
      case 'diesel_hsd':
        return <Fuel className="w-5 h-5 text-emerald-400" />;
      case 'petrol_ms':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'biodiesel_b20':
        return <Leaf className="w-5 h-5 text-teal-400" />;
      case 'ev_charge':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'adblue_def':
        return <Droplets className="w-5 h-5 text-indigo-400" />;
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Order Confirmed Banner */}
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Order Dispatched</span>
                <span className="text-emerald-300">•</span>
                <span className="text-xs font-mono font-bold text-emerald-900">{confirmedOrder.orderNumber}</span>
              </div>
              <h2 className="text-xl font-bold font-heading text-emerald-950 mt-0.5">
                PESO Fuel Bowser is En Route!
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setStep(1);
              }}
              className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold border border-emerald-200 shadow-2xs transition-all"
            >
              Book Another Order
            </button>
          </div>
        </div>

        {/* Secure QR Code Pass Component */}
        <SecureDeliveryQrPass
          order={confirmedOrder}
          onCreateNewOrder={() => {
            setConfirmedOrder(null);
            setStep(1);
          }}
          onTrackOrder={() => {
            setActiveOrder(confirmedOrder);
            setActiveTab('tracking');
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header Ribbon */}
      <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">PESO Doorstep Refueling</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500">Serving {selectedCity.cityName}, {selectedCity.state}</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-gray-900 mt-0.5">Book Fuel Bowser Delivery</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeOrder && activeOrder.status !== 'completed' && activeOrder.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => setConfirmedOrder(activeOrder)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition-all shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-red-600" />
              <span>Show Active QR Pass</span>
            </button>
          )}

          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            {[
              { num: 1, label: 'Fuel & Qty' },
              { num: 2, label: 'Asset & Site' },
              { num: 3, label: 'Slot & Safety' },
              { num: 4, label: 'Pay & Review' },
            ].map((s) => (
              <div key={s.num} className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setStep(s.num as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    step === s.num
                      ? 'bg-amber-500 text-gray-950 font-bold shadow-xs'
                      : step > s.num
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  <span>{s.num}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {s.num < 4 && <div className="w-2 h-px bg-gray-200 hidden sm:block"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Step Form Area (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: FUEL & QUANTITY */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold font-heading text-gray-900">1. Select Fuel Type & Grade</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    All deliveries are 100% density verified and PESO sealed before dispensing.
                  </p>
                </div>

                {/* Fuel Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FUEL_PRODUCTS.map((prod) => {
                    const isSelected = selectedFuelType === prod.id;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => setSelectedFuelType(prod.id)}
                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'bg-amber-50/50 border-amber-500 shadow-xs'
                            : 'bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/20 rounded-bl-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-amber-700" />
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                            {getFuelIcon(prod.id)}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                            {prod.accentBadge}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 font-heading">{prod.shortName}</h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{prod.description}</p>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">{prod.octaneOrGrade}</span>
                          <span className="text-sm font-bold text-amber-700 font-mono">
                            ₹{prod.pricePerUnit.toFixed(2)}/{prod.unit === 'kWh' ? 'kWh' : 'L'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quantity Selector */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900 font-heading">
                      Delivery Volume ({selectedFuel.unit === 'kWh' ? 'Units (kWh)' : 'Litres'})
                    </label>
                    <div className="text-lg font-bold font-mono text-amber-700">
                      {quantity} {selectedFuel.unit === 'kWh' ? 'kWh' : 'Litres'}
                    </div>
                  </div>

                  {/* Quantity Slider */}
                  <input
                    type="range"
                    min={selectedFuel.minOrderQty}
                    max={selectedFuel.maxOrderQty}
                    step={selectedFuel.unit === 'kWh' ? 5 : 25}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(selectedFuel.unit === 'kWh' ? [20, 40, 60, 100, 150] : [50, 100, 250, 500, 1000, 3000]).map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQuantity(preset)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            quantity === preset
                              ? 'bg-amber-500 text-gray-950 font-bold shadow-xs'
                              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {preset} {selectedFuel.unit === 'kWh' ? 'kWh' : 'L'}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center space-x-2 transition-all"
                  >
                    <span>Next: Select Asset & Yard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ASSET & DESTINATION SITE */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold font-heading text-gray-900">2. Select Target Machinery & Delivery Yard</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the specific DG set, fleet vehicle, or add a new job site.
                  </p>
                </div>

                {/* Asset Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Target Asset / DG Genset</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingAsset(!isAddingAsset)}
                      className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Asset</span>
                    </button>
                  </div>

                  {isAddingAsset && (
                    <form onSubmit={handleSaveNewAsset} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                      <h5 className="text-xs font-bold text-gray-900">Add Machinery / Fleet Unit</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Asset Name (e.g. Volvo 350kVA DG)"
                          value={newAssetName}
                          onChange={(e) => setNewAssetName(e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500"
                        />
                        <input
                          type="text"
                          placeholder="Reg / ID (e.g. DG-YARD-09)"
                          value={newAssetReg}
                          onChange={(e) => setNewAssetReg(e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none font-mono focus:border-amber-500"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <input
                          type="number"
                          placeholder="Tank Capacity in Litres (e.g. 800)"
                          value={newAssetCapacity}
                          onChange={(e) => setNewAssetCapacity(e.target.value)}
                          className="w-1/2 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-amber-500 text-gray-950 font-bold rounded-xl text-xs shadow-xs"
                        >
                          Save Asset
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(user?.savedAssets || []).map((asset) => {
                      const isSelected = selectedAsset.id === asset.id;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => setSelectedAsset(asset)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-amber-50/50 border-amber-500 shadow-xs'
                              : 'bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-900 truncate">{asset.name}</span>
                            <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              {asset.registrationNo}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center justify-between mt-2">
                            <span>Capacity: {asset.tankCapacityL} L</span>
                            <span className="text-emerald-700 font-semibold">{asset.currentFuelLevelPercent}% current</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Address Selection */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Delivery Site / Yard Location</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(!isAddingAddress)}
                      className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Site</span>
                    </button>
                  </div>

                  {isAddingAddress && (
                    <LandmarkAddressForm 
                      onSaveAddress={(addressData) => {
                        const added: DeliveryAddress = {
                          id: `addr-${Date.now()}`,
                          label: addressData.label,
                          streetAddress: addressData.streetAddress,
                          area: 'Unknown', // Not used heavily
                          city: addressData.city,
                          state: selectedCity.state,
                          pincode: addressData.pincode,
                          lat: addressData.lat,
                          lng: addressData.lng,
                          siteContactPerson: 'Site Supervisor', // Default for now
                          siteContactPhone: '+91 98000 00000',
                          isGatedOrSecured: true,
                          hasEarthingPoint: true,
                        };
                        addDeliveryAddress(added);
                        setSelectedAddress(added);
                        setIsAddingAddress(false);
                      }}
                      onCancel={() => setIsAddingAddress(false)}
                    />
                  )}

                  {!isAddingAddress && (
                    <div className="space-y-2">
                    {(user?.savedAddresses || []).map((addr) => {
                      const isSelected = selectedAddress.id === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => setSelectedAddress(addr)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start space-x-3 ${
                            isSelected
                              ? 'bg-amber-50/50 border-amber-500 shadow-xs'
                              : 'bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                          }`}
                        >
                          <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-amber-700' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-gray-900">{addr.label}</h5>
                              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Earthing Verified
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {addr.streetAddress}, {addr.city} - {addr.pincode}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center space-x-2 transition-all"
                  >
                    <span>Next: Slot & PESO Safety</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DELIVERY TIME SLOT & PESO SAFETY PROTOCOL */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold font-heading text-gray-900">3. Choose Delivery Window & Safety Protocol</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Select express or scheduled time. Safety confirmation is mandatory under PESO guidelines.
                  </p>
                </div>

                {/* Delivery Slot Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'Express Delivery (Under 45 mins)',
                      title: 'Express Instant',
                      time: 'Under 45 Mins',
                      tag: 'Live Bowser Dispatch',
                      badgeColor: 'amber',
                    },
                    {
                      id: 'Scheduled Morning (06:00 AM - 09:00 AM)',
                      title: 'Early Morning Slot',
                      time: '06:00 AM - 09:00 AM',
                      tag: 'Pre-Shift Fueling',
                      badgeColor: 'emerald',
                    },
                    {
                      id: 'Scheduled Night (10:00 PM - 04:00 AM)',
                      title: 'Night Auto-Refuel',
                      time: '10:00 PM - 04:00 AM',
                      tag: 'Zero Downtime',
                      badgeColor: 'indigo',
                    },
                  ].map((slot) => {
                    const isSelected = deliverySlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setDeliverySlot(slot.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-50/50 border-amber-500 shadow-xs'
                            : 'bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                        }`}
                      >
                        <Clock className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-700' : 'text-gray-400'}`} />
                        <h5 className="text-xs font-bold text-gray-900">{slot.title}</h5>
                        <p className="text-[11px] text-gray-600 font-mono mt-0.5">{slot.time}</p>
                        <span className="text-[10px] mt-2 inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                          {slot.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* PESO Safety Checklist */}
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>PESO Doorstep Fuel Safety Checklist</span>
                  </div>

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pesoEarthingChecked}
                      onChange={(e) => setPesoEarthingChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      Delivery site has an accessible grounding/earthing copper clamp point for static discharge protection.
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pesoFireExtChecked}
                      onChange={(e) => setPesoFireExtChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      Dry chemical powder (DCP) 10kg fire extinguisher is maintained on-site near the generator/machinery area.
                    </span>
                  </label>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    disabled={!pesoEarthingChecked || !pesoFireExtChecked}
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-gray-950 font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center space-x-2 transition-all"
                  >
                    <span>Next: Payment & GST</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PAYMENT METHOD & REVIEW */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold font-heading text-gray-900">4. Payment & Tax Compliance</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Select payment method. GST tax invoice with SAC code 9986 will be generated automatically.
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'wallet',
                      name: 'FuelGo Prepaid Fleet Wallet',
                      desc: `Balance: ₹${(user?.walletBalance || 48500).toLocaleString('en-IN')}`,
                      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
                    },
                    {
                      id: 'cod',
                      name: 'Cash on Delivery',
                      desc: '💵 Pay when your fuel arrives. No online payment required.',
                      icon: <Zap className="w-5 h-5 text-emerald-600" />,
                    },
                  ].map((p) => {
                    const isSelected = paymentMethod === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id as any)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-50/50 border-amber-500 shadow-xs'
                            : 'bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 mb-1">
                          {p.icon}
                          <span className="text-xs font-bold text-gray-900">{p.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* GSTIN Preview */}
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500">GSTIN for Input Tax Credit: </span>
                    <strong className="text-gray-900 font-mono">{user?.gstin || '29AAACA8821R1ZK'}</strong>
                  </div>
                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    18% GST Eligible
                  </span>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className={`px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-extrabold rounded-xl text-sm shadow-md shadow-amber-500/30 flex items-center space-x-2 transition-all transform hover:scale-[1.01] ${isPlacingOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isPlacingOrder ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                       <Truck className="w-4 h-4" />
                    )}
                    <span>{isPlacingOrder ? 'Processing...' : paymentMethod === 'cod' ? 'Place COD Order' : 'Confirm Order & Dispatch Bowser'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary & Live Bill Sidebar (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-xs space-y-4 sticky top-24">
            <h3 className="text-base font-bold font-heading text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-amber-700 font-mono">PESO Seal #DL-8810</span>
            </h3>

            {/* Chosen Product & Qty */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Fuel Grade:</span>
                <strong className="text-gray-900">{selectedFuel.shortName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Quantity:</span>
                <strong className="text-amber-700 font-mono">
                  {quantity} {selectedFuel.unit === 'kWh' ? 'kWh' : 'L'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Rate per Unit:</span>
                <span className="text-gray-900 font-mono">₹{unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Fuel Subtotal:</span>
                <span className="text-gray-900 font-mono">₹{fuelTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Doorstep Bowser Dispatch:</span>
                <span className="text-emerald-700 font-semibold">FREE (Intro Promo)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">PESO Meter Calibration Fee:</span>
                <span className="text-gray-900 font-mono">₹{platformFee}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">GST (18% Input Credit):</span>
                <span className="text-gray-900 font-mono">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total Payable Box */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <div className="text-[11px] text-gray-500">Total Payable (INR)</div>
              <div className="text-2xl font-extrabold font-mono text-gray-900">
                ₹{totalPayable.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>Zero-pilferage digital nozzle with electronic tamper-proof seal and density report provided on site.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
