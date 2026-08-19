const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stationId: { type: Number, required: true }, // Referencing SQLite Station ID
  fuelType: { type: String, required: true },
  quantity: { type: Number, required: true }, // quantity in litres/kg
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  deliveryAddress: { type: String },
  deliveryLat: { type: Number },
  deliveryLng: { type: Number },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'] },
  paymentStatus: { type: String, default: 'pending', enum: ['pending', 'paid', 'failed', 'refunded'] },
  etaMinutes: { type: Number, default: 0 },
  assignedDriver: {
    name: { type: String, default: 'Pawan Teja' },
    phone: { type: String, default: '9876500402' },
    lat: { type: Number, default: 12.9760 },
    lng: { type: Number, default: 79.9360 }
  }
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});

module.exports = mongoose.model('Order', orderSchema);
