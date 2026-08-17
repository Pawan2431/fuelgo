/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider, useOrder } from './context/OrderContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { SafetyBanner } from './components/common/SafetyBanner';
import { LiveBowserMap } from './components/map/LiveBowserMap';
import { FuelOrderWizard } from './components/order/FuelOrderWizard';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { DriverDispenserView } from './components/dashboard/DriverDispenserView';
import { SmartFuelAdvisor } from './components/ai/SmartFuelAdvisor';
import { StationFinder } from './components/map/StationFinder';
import { AuthModal } from './components/auth/AuthModal';
import { InvoiceModal } from './components/invoice/InvoiceModal';
import { OrderQrPassModal } from './components/order/OrderQrPassModal';

const MainAppContent: React.FC = () => {
  const { activeTab } = useOrder();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 selection:bg-amber-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Render Active View Tab */}
        {activeTab === 'tracking' && <LiveBowserMap />}
        {activeTab === 'order' && <FuelOrderWizard />}
        {activeTab === 'dashboard' && <CustomerDashboard />}
        {activeTab === 'driver_view' && <DriverDispenserView />}
        {activeTab === 'ai_advisor' && <SmartFuelAdvisor />}
        {activeTab === 'nearby_stations' && <StationFinder />}

        {/* Global Safety Features Strip */}
        <SafetyBanner />
      </main>

      {/* Global Modals */}
      <AuthModal />
      <InvoiceModal />
      <OrderQrPassModal />

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <MainAppContent />
      </OrderProvider>
    </AuthProvider>
  );
}
