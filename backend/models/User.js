const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone: { type: String, index: true },
  role: { type: String, default: 'b2b_fleet', enum: ['customer', 'driver', 'admin', 'b2b_fleet', 'b2c_individual', 'bowser_driver'] },
  companyId: { type: String },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'suspended'] },
  google_id: { type: String },
  lastLoginAt: { type: Date }
}, {
  timestamps: true // Automatically creates createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);
