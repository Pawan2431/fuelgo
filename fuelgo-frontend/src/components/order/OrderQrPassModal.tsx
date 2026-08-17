import React from 'react';
import { useOrder } from '../../context/OrderContext';
import { SecureDeliveryQrPass } from './SecureDeliveryQrPass';
import { X } from 'lucide-react';

export const OrderQrPassModal: React.FC = () => {
  const { viewingQrOrder, setViewingQrOrder, setActiveTab, setActiveOrder } = useOrder();

  if (!viewingQrOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8">
        <SecureDeliveryQrPass
          order={viewingQrOrder}
          isStandaloneModal={true}
          onClose={() => setViewingQrOrder(null)}
          onTrackOrder={() => {
            setActiveOrder(viewingQrOrder);
            setActiveTab('tracking');
            setViewingQrOrder(null);
          }}
        />
      </div>
    </div>
  );
};
