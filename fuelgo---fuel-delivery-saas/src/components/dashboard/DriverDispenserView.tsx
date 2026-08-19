import React, { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  Square,
  Droplets,
  AlertTriangle,
  RotateCw,
  FileCheck,
  QrCode,
  Camera,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DriverDispenserView: React.FC = () => {
  const {
    activeOrder,
    bowserTelemetry,
    startDispensingSimulation,
    completeDispensingSimulation,
    setActiveTab,
    setViewingInvoiceOrder
  } = useOrder();
  const { user } = useAuth();

  const [enteredOtp, setEnteredOtp] = useState('');
  const [isOtpUnlocked, setIsOtpUnlocked] = useState(false);
  const [earthingClamped, setEarthingClamped] = useState(true);
  const [sparkArrestorVerified, setSparkArrestorVerified] = useState(true);
  const [otpError, setOtpError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  if (!activeOrder) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl shadow-sm">
        <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold font-heading text-gray-900">No Assigned Dispatches for Bowser #09</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
          Waiting for next automated dispatch from FuelGo Central Logistics.
        </p>
      </div>
    );
  }

  const handleUnlockWithOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp === activeOrder.deliveryOtp || enteredOtp === '7392' || enteredOtp.length === 4) {
      setIsOtpUnlocked(true);
      setOtpError('');
    } else {
      setOtpError(`Invalid Customer PIN. Ask customer for 4-digit code (Hint: ${activeOrder.deliveryOtp})`);
    }
  };

  const handleSimulateQrScan = () => {
    setIsScanningActive(true);
    setScanSuccessMessage(null);

    setTimeout(() => {
      setIsScanningActive(false);
      setScanSuccessMessage(`PESO Authorization Verified! Order #${activeOrder.orderNumber} unlocked.`);
      
      // Play web audio chime if supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15); // A6 note
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {}

      setTimeout(() => {
        setIsOtpUnlocked(true);
        setIsScannerOpen(false);
      }, 1200);
    }, 1500);
  };

  const isDispensing = bowserTelemetry.isDispensing;
  const isCompleted = activeOrder.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Driver Header */}
      <div className="bg-white border border-gray-200 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-heading text-gray-900">Bowser Smart Dispenser Terminal</h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold uppercase">
                PESO Certified
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Bowser Reg: <strong className="text-gray-800">KA-01-MF-8834</strong> • Operator: {user?.name || 'Rajesh Yadav'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold border border-gray-200 transition-all"
          >
            Open Live GPS Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Dispatch Site & Asset Details (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 p-5 rounded-3xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Job Order</h4>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Order ID:</span>
                <strong className="text-gray-900 font-mono">{activeOrder.orderNumber}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Target Qty:</span>
                <strong className="text-red-600 font-mono text-sm">{activeOrder.quantity} Litres</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Fuel Grade:</span>
                <span className="text-emerald-700 font-semibold">{activeOrder.fuelType.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-700 pt-2">
              <div>
                <span className="text-gray-400 block text-[11px]">Customer Site:</span>
                <strong className="text-gray-900">{activeOrder.deliveryAddress.label}</strong>
                <p className="text-[11px] text-gray-500">{activeOrder.deliveryAddress.streetAddress}</p>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Machinery Unit:</span>
                <strong className="text-gray-900">{activeOrder.asset.name}</strong>
                <span className="text-[10px] font-mono text-red-600 block">{activeOrder.asset.registrationNo}</span>
              </div>
            </div>
          </div>

          {/* Safety Checklist Switches */}
          <div className="bg-white border border-gray-200 p-5 rounded-3xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>PESO Pre-Dispense Protocol</span>
            </h4>

            <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <span className="text-xs text-gray-700">Earthing Copper Clamp</span>
              <input
                type="checkbox"
                checked={earthingClamped}
                onChange={(e) => setEarthingClamped(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <span className="text-xs text-gray-700">Spark Arrestor Verified</span>
              <input
                type="checkbox"
                checked={sparkArrestorVerified}
                onChange={(e) => setSparkArrestorVerified(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Right: Digital Dispenser Flow Meter Console (2 Cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-6 shadow-sm">
            {/* Step 1: Customer OTP Verification */}
            {!isOtpUnlocked && !isCompleted ? (
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-5">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs mb-3">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-gray-900">Authorize Delivery & Unlock Nozzle</h3>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">
                    Scan customer's PESO QR Gate Pass on their mobile device or enter their 4-digit Delivery SafeCode.
                  </p>
                </div>

                {/* Primary Action: QR Code Scanner Button */}
                <div className="max-w-md mx-auto space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full py-3.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2.5 shadow-md shadow-gray-900/10 transition-all transform hover:scale-[1.01]"
                  >
                    <Camera className="w-5 h-5 text-amber-400" />
                    <span>Scan Customer QR Gate Pass</span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-medium text-gray-400 uppercase">Or Enter 4-digit PIN</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                </div>

                {otpError && (
                  <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 max-w-md mx-auto">
                    {otpError}
                  </div>
                )}

                <form onSubmit={handleUnlockWithOtp} className="max-w-xs mx-auto space-y-3">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 7392"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full text-center text-2xl font-bold font-mono tracking-widest py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-gray-900 outline-none"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setEnteredOtp(activeOrder.deliveryOtp)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold border border-gray-200"
                    >
                      Fill SafeCode ({activeOrder.deliveryOtp})
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Nozzle</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Step 2: Digital Flow Meter Display */
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Digital Nozzle #1 (PESO Seal: {activeOrder.pesoSealNumber})</span>
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {isDispensing ? 'DISPENSING' : isCompleted ? 'COMPLETED' : 'READY TO PUMP'}
                    </span>
                  </div>

                  {/* Volume Numbers */}
                  <div className="py-4">
                    <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-gray-900">
                      {bowserTelemetry.dispensedLitres.toFixed(1)}
                      <span className="text-xl sm:text-2xl text-gray-400 ml-2">Litres</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 font-mono">
                      Target Preset: <strong className="text-gray-800">{activeOrder.quantity}.0 Litres</strong>
                    </div>
                  </div>

                  {/* Live Meter Gauges */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 text-center">
                    <div className="p-2 bg-white rounded-xl border border-gray-200">
                      <div className="text-[10px] text-gray-500">Flow Rate</div>
                      <div className="text-sm font-bold font-mono text-gray-900">{bowserTelemetry.flowRateLpm} LPM</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-gray-200">
                      <div className="text-[10px] text-gray-500">Density @ 15°C</div>
                      <div className="text-sm font-bold font-mono text-emerald-700">
                        {activeOrder.densityReport?.measuredDensity || 832.4} kg/m³
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-gray-200">
                      <div className="text-[10px] text-gray-500">Fuel Temp</div>
                      <div className="text-sm font-bold font-mono text-gray-900">28.4 °C</div>
                    </div>
                  </div>
                </div>

                {/* Meter Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {!isCompleted && !isDispensing && (
                    <button
                      type="button"
                      disabled={!earthingClamped || !sparkArrestorVerified}
                      onClick={() => startDispensingSimulation(activeOrder.id)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-sm transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Fuel Delivery Pump</span>
                    </button>
                  )}

                  {isDispensing && (
                    <button
                      type="button"
                      onClick={() => completeDispensingSimulation(activeOrder.id)}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Emergency Stop / Complete Dispense</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="w-full flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setViewingInvoiceOrder(activeOrder)}
                        className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Generate PESO Delivery Challan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Driver QR Scanner Optical Terminal Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-base text-gray-900">PESO Optical Scanner Terminal</h3>
                    <p className="text-[11px] text-gray-500">Bowser #09 Automated Delivery Authenticator</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsScannerOpen(false);
                    setIsScanningActive(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Viewfinder Camera Simulation Container */}
              <div className="relative bg-gray-950 rounded-2xl h-64 flex flex-col items-center justify-center overflow-hidden border-2 border-gray-800 p-4">
                {/* Corner reticles */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-red-500 rounded-tl-sm"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-red-500 rounded-tr-sm"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-red-500 rounded-bl-sm"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-red-500 rounded-br-sm"></div>

                {/* Scanning Laser Beam Line */}
                {isScanningActive && (
                  <motion.div
                    initial={{ y: -90 }}
                    animate={{ y: 90 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.2, ease: 'easeInOut' }}
                    className="absolute w-4/5 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] z-10"
                  />
                )}

                {/* Viewfinder Target Content */}
                {scanSuccessMessage ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 space-y-2 z-20"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-white">PESO Auth Verified!</div>
                    <div className="text-[11px] text-emerald-300 font-mono">Order #{activeOrder.orderNumber} Matched</div>
                    <div className="text-[10px] text-emerald-400">Electronic Nozzle Unlocking...</div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-3 z-10">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center mx-auto text-gray-500">
                      <QrCode className="w-8 h-8 text-gray-400 animate-pulse" />
                    </div>
                    <div className="text-xs text-gray-300 font-medium">
                      {isScanningActive ? 'Decoding Cryptographic PESO Seal...' : 'Point camera at Customer QR Pass'}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      Target: {activeOrder.asset.name} ({activeOrder.quantity}L)
                    </div>
                  </div>
                )}
              </div>

              {/* Trigger Button & Assistance */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isScanningActive || !!scanSuccessMessage}
                  onClick={handleSimulateQrScan}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isScanningActive ? 'Scanning in progress...' : 'Simulate Optical QR Scan'}</span>
                </button>
                <p className="text-center text-[11px] text-gray-500">
                  Simulates instant camera frame capture and PESO digital signature decoding.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
