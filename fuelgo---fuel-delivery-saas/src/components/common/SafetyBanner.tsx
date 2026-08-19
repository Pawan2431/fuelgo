import React from 'react';
import { ShieldCheck, Flame, Zap, Award, Sparkles } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 my-6 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-gray-900">PESO Approved Bowsers</h5>
            <p className="text-gray-500 text-[11px] mt-0.5">Static earthing clamp & spark arrestors on every mobile unit.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-gray-900">Zero Pilferage Guarantee</h5>
            <p className="text-gray-500 text-[11px] mt-0.5">Tamper-proof digital flow meter with printed density report.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-gray-900">Express Under 45 Mins</h5>
            <p className="text-gray-500 text-[11px] mt-0.5">Micro-depots across 8+ Tier-1 Indian industrial belts.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-gray-900">18% GST Input Credit</h5>
            <p className="text-gray-500 text-[11px] mt-0.5">Direct automated SAC 9986 compliance invoice generation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
