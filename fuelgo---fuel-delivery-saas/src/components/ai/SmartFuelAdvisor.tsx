import React, { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import {
  Sparkles,
  Zap,
  Fuel,
  TrendingDown,
  Building2,
  Truck,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const SmartFuelAdvisor: React.FC = () => {
  const { selectedCity, setSelectedFuelType, setActiveTab } = useOrder();

  const [advisorMode, setAdvisorMode] = useState<'dg_genset' | 'fleet_logistics'>('dg_genset');

  // DG Genset states
  const [gensetKva, setGensetKva] = useState<number>(500);
  const [runningHoursDaily, setRunningHoursDaily] = useState<number>(4);
  const [loadPercentage, setLoadPercentage] = useState<number>(75);
  const [daysPerMonth, setDaysPerMonth] = useState<number>(26);

  // Fleet states
  const [fleetCount, setFleetCount] = useState<number>(12);
  const [kmPerVehicleDaily, setKmPerVehicleDaily] = useState<number>(180);
  const [vehicleMileage, setVehicleMileage] = useState<number>(4.2); // km per litre

  // DG Genset fuel math based on standard diesel engine specific fuel consumption (SFC ~ 0.22 - 0.25 L/kVA-hr)
  const ltrPerHour = (gensetKva * 0.22 * (loadPercentage / 100)).toFixed(1) as any * 1;
  const dgDailyLitres = Math.round(ltrPerHour * runningHoursDaily);
  const dgMonthlyLitres = Math.round(dgDailyLitres * daysPerMonth);
  const dgMonthlyCostInr = Math.round(dgMonthlyLitres * selectedCity.dieselRate);
  const dgGstCreditInr = Math.round(dgMonthlyCostInr * 0.18);

  // Fleet math
  const fleetDailyLitres = Math.round((fleetCount * kmPerVehicleDaily) / vehicleMileage);
  const fleetMonthlyLitres = Math.round(fleetDailyLitres * daysPerMonth);
  const fleetMonthlyCostInr = Math.round(fleetMonthlyLitres * selectedCity.dieselRate);
  // Doorstep delivery eliminates 5% retail pump pilferage + 45 mins idle waiting time
  const pilferageSavedInr = Math.round(fleetMonthlyCostInr * 0.05);
  const driverHoursSaved = Math.round(fleetCount * daysPerMonth * 0.75);

  const applyGensetToOrder = () => {
    setSelectedFuelType('diesel_hsd');
    setActiveTab('order');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 p-6 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-red-600 mb-1">
          <Sparkles className="w-4 h-4" />
          <span>AI Fuel Estimation & Cost Optimizer</span>
        </div>
        <h2 className="text-2xl font-bold font-heading text-gray-900">Smart Fuel Requirement Planner</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xl">
          Calculate precise diesel requirements for commercial DG sets or logistics fleets based on Indian industrial duty cycles.
        </p>

        {/* Mode Switcher */}
        <div className="flex space-x-2 mt-4">
          <button
            type="button"
            onClick={() => setAdvisorMode('dg_genset')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              advisorMode === 'dg_genset'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Industrial DG Gensets Planner</span>
          </button>
          <button
            type="button"
            onClick={() => setAdvisorMode('fleet_logistics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              advisorMode === 'fleet_logistics'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Fleet Logistics Savings Calculator</span>
          </button>
        </div>
      </div>

      {advisorMode === 'dg_genset' ? (
        /* DG GENSET ESTIMATOR */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-3xl space-y-5 shadow-sm">
            <h3 className="text-base font-bold font-heading text-gray-900">Configure Generator Parameters</h3>

            {/* kVA Rating */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-700">Genset Capacity Rating (kVA):</span>
                <strong className="text-red-600 font-mono text-sm">{gensetKva} kVA</strong>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[125, 250, 500, 750, 1000, 1500, 2000, 2500].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setGensetKva(k)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      gensetKva === k
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {k} kVA
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Backup Hours */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-700">Daily Running / Outage Hours:</span>
                <strong className="text-gray-900 font-mono">{runningHoursDaily} Hours/Day</strong>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                value={runningHoursDaily}
                onChange={(e) => setRunningHoursDaily(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            {/* Load Factor */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-700">Average Electrical Load Factor:</span>
                <strong className="text-gray-900 font-mono">{loadPercentage}% Load</strong>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[50, 75, 100].map((load) => (
                  <button
                    key={load}
                    type="button"
                    onClick={() => setLoadPercentage(load)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      loadPercentage === load
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {load}% Standard Load
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold font-heading text-gray-900 border-b border-gray-200 pb-3">
              Estimated Fuel Requirement
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Hourly Consumption Rate</span>
                <div className="text-xl font-bold font-mono text-emerald-700">{ltrPerHour} L/Hour</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Monthly Diesel Requirement</span>
                <div className="text-xl font-bold font-mono text-gray-900">{dgMonthlyLitres.toLocaleString('en-IN')} Litres</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Estimated Monthly Spend ({selectedCity.cityName})</span>
                <div className="text-2xl font-extrabold font-mono text-red-600">
                  ₹{dgMonthlyCostInr.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-700">Includes ₹{dgGstCreditInr.toLocaleString('en-IN')} Input GST</span>
              </div>
            </div>

            <button
              type="button"
              onClick={applyGensetToOrder}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <span>Schedule DG Refueling</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* FLEET LOGISTICS SAVINGS ESTIMATOR */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-3xl space-y-5 shadow-sm">
            <h3 className="text-base font-bold font-heading text-gray-900">Fleet Operations Parameters</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-medium">Active Fleet Size (Vehicles):</label>
                <input
                  type="number"
                  value={fleetCount}
                  onChange={(e) => setFleetCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 rounded-xl text-sm font-mono text-gray-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-medium">Avg KM Run / Day / Truck:</label>
                <input
                  type="number"
                  value={kmPerVehicleDaily}
                  onChange={(e) => setKmPerVehicleDaily(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 rounded-xl text-sm font-mono text-gray-900 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <label className="text-xs text-gray-700 font-medium">Average Vehicle Mileage (km/L):</label>
              <input
                type="number"
                step="0.1"
                value={vehicleMileage}
                onChange={(e) => setVehicleMileage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-gray-900 rounded-xl text-sm font-mono text-gray-900 outline-none"
              />
            </div>
          </div>

          {/* Fleet Savings Output */}
          <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold font-heading text-gray-900 border-b border-gray-200 pb-3">
              Doorstep Efficiency ROI
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block text-[11px] font-medium">Zero-Pilferage Monthly Savings</span>
                <div className="text-2xl font-extrabold font-mono text-emerald-700">
                  ₹{pilferageSavedInr.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-gray-500">Eliminates 5% retail pump discrepancy</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Fleet Driver Time Saved</span>
                <div className="text-xl font-bold font-mono text-gray-900">{driverHoursSaved} Hours / Month</div>
                <span className="text-[10px] text-gray-500">No highway petrol pump queues</span>
              </div>
            </div>

            <button
              type="button"
              onClick={applyGensetToOrder}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <span>Setup Fleet Auto-Refueling</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
