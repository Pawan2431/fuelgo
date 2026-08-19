import React from 'react';
import '../styles/home.css';

export default function OrderConfirmModal({ isOpen, onClose, onConfirm, orderDetails }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="confirm-card">
        <div className="confirm-title">Confirm Fuel Order</div>

        <div className="confirm-row">
          <span className="confirm-lbl">Delivery Location</span>
          <span className="confirm-val">{orderDetails.address}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-lbl">Station Source</span>
          <span className="confirm-val">{orderDetails.station}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-lbl">Fuel & Quantity</span>
          <span className="confirm-val">{orderDetails.fuel} · {orderDetails.qty} Litres</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-lbl">Estimated Arrival</span>
          <span className="confirm-val text-primary">⚡ 12 Minutes (Ravi Kumar)</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-lbl">Total Payable</span>
          <span className="confirm-val text-success" style={{ fontSize: '16px' }}>₹{orderDetails.total}</span>
        </div>

        <button className="btn-primary" style={{ marginTop: '16px' }} onClick={onConfirm}>
          Confirm & Track Live Delivery
        </button>
        <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={onClose}>
          Back to Edit
        </button>
      </div>
    </div>
  );
}
