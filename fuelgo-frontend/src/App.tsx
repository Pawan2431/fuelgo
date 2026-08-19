/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { AdminPaymentVerification } from './components/payment/AdminPaymentVerification';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AdminLogs } from './components/dashboard/AdminLogs';
const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useOrder();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'admin') {
      // Admins should default to admin dashboard
      if (activeTab === 'order' || activeTab === 'dashboard') {
        setActiveTab('admin_dashboard');
      }
    } else if (user.role === 'bowser_driver') {
      // Drivers should default to driver view
      if (activeTab === 'order' || activeTab.startsWith('admin_')) {
        setActiveTab('driver_view');
      }
    } else {
      // Regular customers should default to order view if on admin tabs
      if (activeTab.startsWith('admin_')) {
        setActiveTab('order');
      }
    }
  }, [user?.role, activeTab, setActiveTab]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModal />
      </div>
    );
  }

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
        {activeTab === 'admin_payments' && <AdminPaymentVerification />}
        {activeTab === 'admin_dashboard' && <AdminDashboard />}
        {activeTab === 'admin_logs' && <AdminLogs />}

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
