import React, { createContext, useContext, useState, useEffect } from 'react';
import { FuelOrder, FuelType, IndianCityRate, DeliveryAddress, AssetVehicle, BowserDriver } from '../types';
import { INDIAN_CITIES, INITIAL_ORDERS, DEMO_BOWSERS, FUEL_PRODUCTS } from '../mockData';
import confetti from 'canvas-confetti';

interface OrderContextType {
  selectedCity: IndianCityRate;
  setSelectedCity: (city: IndianCityRate) => void;
  orders: FuelOrder[];
  activeOrder: FuelOrder | null;
  setActiveOrder: (order: FuelOrder | null) => void;
  createOrder: (orderData: Partial<FuelOrder>) => FuelOrder;
  createOrderAPI: (orderData: Partial<FuelOrder>, token: string) => Promise<FuelOrder>;
  cancelOrder: (orderId: string) => void;
  reorder: (order: FuelOrder) => void;
  markOrderPaid: (orderId: string) => void;
  markOrderPaidAPI: (orderId: string, token: string) => Promise<void>;
  
  // Live GPS Tracking & Dispenser simulator
  bowserTelemetry: {
    lat: number;
    lng: number;
    speed: number;
    distanceRemainingKm: number;
    etaMinutes: number;
    dispensedLitres: number;
    isDispensing: boolean;
    flowRateLpm: number;
  };
  startDispensingSimulation: (orderId: string) => void;
  completeDispensingSimulation: (orderId: string) => void;
  selectedFuelType: FuelType;
  setSelectedFuelType: (fuel: FuelType) => void;
  orderWizardOpen: boolean;
  setOrderWizardOpen: (open: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewingInvoiceOrder: FuelOrder | null;
  setViewingInvoiceOrder: (order: FuelOrder | null) => void;
  viewingQrOrder: FuelOrder | null;
  setViewingQrOrder: (order: FuelOrder | null) => void;
}

export type ActiveTab = 'tracking' | 'order' | 'dashboard' | 'driver_view' | 'ai_advisor' | 'nearby_stations';

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<IndianCityRate>(INDIAN_CITIES[0]); // Chennai (default)
  const [orders, setOrders] = useState<FuelOrder[]>(() => {
    const saved = localStorage.getItem('fuelgo_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_ORDERS;
      }
    }
    return INITIAL_ORDERS;
  });

  const [activeOrder, setActiveOrder] = useState<FuelOrder | null>(INITIAL_ORDERS[0]);
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('diesel_hsd');
  const [orderWizardOpen, setOrderWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('order');
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<FuelOrder | null>(null);
  const [viewingQrOrder, setViewingQrOrder] = useState<FuelOrder | null>(null);

  // Telemetry simulation state for the active bowser
  const [bowserTelemetry, setBowserTelemetry] = useState({
    lat: 12.9650,
    lng: 77.6750,
    speed: 38,
    distanceRemainingKm: 2.4,
    etaMinutes: 7,
    dispensedLitres: 0,
    isDispensing: false,
    flowRateLpm: 65,
  });

  useEffect(() => {
    localStorage.setItem('fuelgo_orders', JSON.stringify(orders));
  }, [orders]);

  // Auto-detect closest city on load
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        let closestCity = INDIAN_CITIES[0]; // default to Chennai if GPS fails
        let minDistance = Infinity;

        INDIAN_CITIES.forEach((city) => {
          const R = 6371e3; // metres
          const φ1 = userLat * Math.PI/180;
          const φ2 = city.lat * Math.PI/180;
          const Δφ = (city.lat-userLat) * Math.PI/180;
          const Δλ = (city.lng-userLng) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          if (distance < minDistance) {
            minDistance = distance;
            closestCity = city;
          }
        });

        setSelectedCity(closestCity);
      }, (err) => {
        console.warn("Could not auto-detect city:", err.message);
      }, { timeout: 5000 });
    }
  }, []);

  // Update initial mock order location when selectedCity changes
  useEffect(() => {
    if (activeOrder && activeOrder.id === 'ord-101') {
      const cityLat = selectedCity.lat;
      const cityLng = selectedCity.lng;
      
      const newActiveOrder = {
        ...activeOrder,
        deliveryAddress: {
          ...activeOrder.deliveryAddress,
          lat: cityLat + 0.015,
          lng: cityLng + 0.015,
          city: selectedCity.cityName,
          state: selectedCity.state
        }
      };

      setActiveOrder(newActiveOrder);
      setOrders(prev => prev.map(o => o.id === 'ord-101' ? newActiveOrder : o));
      
      setBowserTelemetry(prev => ({
        ...prev,
        lat: cityLat - 0.02,
        lng: cityLng - 0.02,
        distanceRemainingKm: 4.5,
        etaMinutes: 12
      }));
    }
  }, [selectedCity]);

  // Live GPS movement animation along waypoint toward destination
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'completed' || activeOrder.status === 'cancelled') {
      return;
    }

    const destLat = activeOrder.deliveryAddress.lat;
    const destLng = activeOrder.deliveryAddress.lng;

    const interval = setInterval(() => {
      setBowserTelemetry((prev) => {
        if (prev.isDispensing) {
          // Dispensing simulation
          const targetQty = activeOrder.quantity;
          const increment = 3.5;
          const nextDispensed = Math.min(targetQty, prev.dispensedLitres + increment);
          
          if (nextDispensed >= targetQty && prev.dispensedLitres < targetQty) {
            // Dispensing finished!
            setTimeout(() => {
              completeDispensingSimulation(activeOrder.id);
            }, 1000);
          }

          return {
            ...prev,
            dispensedLitres: nextDispensed,
            flowRateLpm: nextDispensed >= targetQty ? 0 : 68 + Math.floor(Math.random() * 5),
          };
        }

        // Bowser is in transit
        const dLat = destLat - prev.lat;
        const dLng = destLng - prev.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        if (dist < 0.002) {
          // Arrived at customer site!
          return {
            ...prev,
            lat: destLat,
            lng: destLng,
            speed: 0,
            distanceRemainingKm: 0.1,
            etaMinutes: 1,
          };
        }

        const step = 0.00035; // gentle realistic driving step
        const nextLat = prev.lat + (dLat / dist) * step + (Math.random() - 0.5) * 0.00005;
        const nextLng = prev.lng + (dLng / dist) * step + (Math.random() - 0.5) * 0.00005;
        const remainingKm = Math.max(0.2, (dist * 111).toFixed(1) as any * 1);
        const nextEta = Math.max(1, Math.ceil(remainingKm * 2.8));
        const currentSpeed = Math.floor(32 + Math.random() * 12);

        return {
          ...prev,
          lat: nextLat,
          lng: nextLng,
          speed: currentSpeed,
          distanceRemainingKm: remainingKm,
          etaMinutes: nextEta,
        };
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [activeOrder]);

  const startDispensingSimulation = (orderId: string) => {
    setBowserTelemetry((prev) => ({
      ...prev,
      isDispensing: true,
      dispensedLitres: 0,
      flowRateLpm: 68,
    }));
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'dispensing', dispensedStartedAt: new Date().toLocaleTimeString() } : o))
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) => (prev ? { ...prev, status: 'dispensing', dispensedStartedAt: new Date().toLocaleTimeString() } : null));
    }
  };

  const completeDispensingSimulation = (orderId: string) => {
    setBowserTelemetry((prev) => ({
      ...prev,
      isDispensing: false,
      flowRateLpm: 0,
    }));
    
    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const completedTime = new Date().toLocaleTimeString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'completed',
              dispensedCompletedAt: completedTime,
              dispensedQty: o.quantity,
              paymentStatus: 'paid',
            }
          : o
      )
    );

    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              dispensedCompletedAt: completedTime,
              dispensedQty: prev.quantity,
              paymentStatus: 'paid',
            }
          : null
      );
    }
  };

  const createOrder = (orderData: Partial<FuelOrder>): FuelOrder => {
    const fuelProd = FUEL_PRODUCTS.find((p) => p.id === (orderData.fuelType || selectedFuelType)) || FUEL_PRODUCTS[0];
    const qty = orderData.quantity || 100;
    const unitPrice = fuelProd.pricePerUnit;
    const fuelTotal = qty * unitPrice;
    const deliveryFee = 0; // free doorstep delivery promo
    const platformFee = 99;
    const gstAmount = Math.round((fuelTotal + platformFee) * 0.18);
    const totalPayable = fuelTotal + deliveryFee + platformFee + gstAmount;
    
    // Generate random 4-digit secure delivery OTP for PESO compliance
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const assignedDriver: BowserDriver = {
      ...DEMO_BOWSERS[0],
      currentLat: orderData.deliveryAddress ? orderData.deliveryAddress.lat - 0.025 : 12.9650,
      currentLng: orderData.deliveryAddress ? orderData.deliveryAddress.lng - 0.025 : 77.6750,
    };

    const newOrder: FuelOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `FG-IN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      scheduledTimeSlot: orderData.scheduledTimeSlot || 'Express Delivery (Under 45 mins)',
      fuelType: orderData.fuelType || selectedFuelType,
      quantity: qty,
      unitPrice,
      fuelTotal,
      deliveryFee,
      platformFee,
      gstAmount,
      totalPayable,
      status: 'en_route',
      deliveryAddress: orderData.deliveryAddress || ({} as DeliveryAddress),
      asset: orderData.asset || ({} as AssetVehicle),
      paymentMethod: orderData.paymentMethod || 'upi',
      paymentStatus: orderData.paymentMethod === 'credit_line' ? 'credit_authorized' : 'paid',
      deliveryOtp,
      assignedBowser: assignedDriver,
      flowRateLpm: 65,
      densityReport: {
        measuredDensity: 832.4,
        standardDensity: 830.0,
        temperature: 28.5,
        flashPoint: '> 38.0°C'
      },
      pesoSealNumber: `PESO-SEAL-${selectedCity.cityName.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`
    };

    setOrders([newOrder, ...orders]);
    setActiveOrder(newOrder);
    setBowserTelemetry({
      lat: assignedDriver.currentLat,
      lng: assignedDriver.currentLng,
      speed: 36,
      distanceRemainingKm: 3.2,
      etaMinutes: 9,
      dispensedLitres: 0,
      isDispensing: false,
      flowRateLpm: 65,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    return newOrder;
  };

  const createOrderAPI = async (orderData: Partial<FuelOrder>, token: string): Promise<FuelOrder> => {
    // We send station_id: 1 by default per the implementation plan
    const payload = {
      station_id: 1, 
      fuel_type: orderData.fuelType || selectedFuelType,
      quantity_litres: orderData.quantity || 100,
      payment_method: orderData.paymentMethod || 'upi',
      delivery_address: orderData.deliveryAddress?.streetAddress || '',
      delivery_lat: orderData.deliveryAddress?.lat || 12.9734,
      delivery_lng: orderData.deliveryAddress?.lng || 79.9328
    };

    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to place order via API');
    }

    const apiResponse = await response.json();

    // Map the backend response to our frontend FuelOrder type
    const fuelProd = FUEL_PRODUCTS.find((p) => p.id === payload.fuel_type) || FUEL_PRODUCTS[0];
    const unitPrice = fuelProd.pricePerUnit;
    const fuelTotal = payload.quantity_litres * unitPrice;
    const deliveryFee = 0;
    const platformFee = 99;
    const gstAmount = Math.round((fuelTotal + platformFee) * 0.18);
    const totalPayable = fuelTotal + deliveryFee + platformFee + gstAmount;

    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const assignedDriver: BowserDriver = {
      ...DEMO_BOWSERS[0],
      name: apiResponse.agent?.name || 'Ravi Kumar',
      phone: apiResponse.agent?.phone || '9876500402',
      currentLat: apiResponse.agent?.location?.lat || payload.delivery_lat - 0.025,
      currentLng: apiResponse.agent?.location?.lng || payload.delivery_lng - 0.025,
    };

    const newOrder: FuelOrder = {
      id: `ord-${apiResponse.order_id}`,
      orderNumber: `FG-IN-${new Date().getFullYear()}-${apiResponse.order_id}`,
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      scheduledTimeSlot: orderData.scheduledTimeSlot || 'Express Delivery (Under 45 mins)',
      fuelType: payload.fuel_type,
      quantity: payload.quantity_litres,
      unitPrice,
      fuelTotal,
      deliveryFee,
      platformFee,
      gstAmount,
      totalPayable,
      status: 'en_route',
      deliveryAddress: orderData.deliveryAddress || ({} as DeliveryAddress),
      asset: orderData.asset || ({} as AssetVehicle),
      paymentMethod: payload.payment_method as any,
      paymentStatus: payload.payment_method === 'credit_line' ? 'credit_authorized' : 'paid',
      deliveryOtp,
      assignedBowser: assignedDriver,
      flowRateLpm: 65,
      densityReport: {
        measuredDensity: 832.4,
        standardDensity: 830.0,
        temperature: 28.5,
        flashPoint: '> 38.0°C'
      },
      pesoSealNumber: `PESO-SEAL-${selectedCity.cityName.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`
    };

    setOrders([newOrder, ...orders]);
    setActiveOrder(newOrder);
    setBowserTelemetry({
      lat: assignedDriver.currentLat,
      lng: assignedDriver.currentLng,
      speed: 36,
      distanceRemainingKm: 3.2,
      etaMinutes: apiResponse.eta_minutes || 9,
      dispensedLitres: 0,
      isDispensing: false,
      flowRateLpm: 65,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    return newOrder;
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, status: 'cancelled' as const };
        if (activeOrder?.id === orderId) setActiveOrder(updated);
        return updated;
      }
      return o;
    }));
  };

  const markOrderPaid = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, paymentStatus: 'paid' as const };
        if (activeOrder?.id === orderId) setActiveOrder(updated);
        return updated;
      }
      return o;
    }));
  };

  const markOrderPaidAPI = async (orderId: string, token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/pay`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to mark order as paid');
      }
      markOrderPaid(orderId);
    } catch (error) {
      console.error('Error marking order paid:', error);
      throw error;
    }
  };

  const reorder = (order: FuelOrder) => {
    createOrder({
      fuelType: order.fuelType,
      quantity: order.quantity,
      deliveryAddress: order.deliveryAddress,
      asset: order.asset,
      paymentMethod: order.paymentMethod,
    });
  };

  return (
    <OrderContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        orders,
        activeOrder,
        setActiveOrder,
        createOrder,
        createOrderAPI,
        cancelOrder,
        reorder,
        markOrderPaid,
        markOrderPaidAPI,
        
        bowserTelemetry,
        startDispensingSimulation,
        completeDispensingSimulation,
        selectedFuelType,
        setSelectedFuelType,
        orderWizardOpen,
        setOrderWizardOpen,
        activeTab,
        setActiveTab,
        viewingInvoiceOrder,
        setViewingInvoiceOrder,
        viewingQrOrder,
        setViewingQrOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
