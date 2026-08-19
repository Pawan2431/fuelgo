export type FuelType = 'diesel_hsd' | 'petrol_ms' | 'biodiesel_b20' | 'ev_charge' | 'adblue_def';

export interface FuelProduct {
  id: FuelType;
  name: string;
  shortName: string;
  category: 'Liquid Fuel' | 'Green Alternative' | 'Clean Power' | 'Exhaust Fluid';
  description: string;
  pricePerUnit: number; // in INR
  unit: 'Litre' | 'kWh';
  octaneOrGrade: string;
  color: string;
  accentBadge: string;
  minOrderQty: number;
  maxOrderQty: number;
  iconName: string;
  popularFor: string;
}

export type UserRole = 'b2b_fleet' | 'b2c_individual' | 'bowser_driver' | 'station_partner' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  companyName?: string;
  gstin?: string;
  avatarUrl?: string;
  walletBalance: number;
  creditLimit: number;
  creditUsed: number;
  savedAddresses: DeliveryAddress[];
  savedAssets: AssetVehicle[];
  isVerified: boolean;
  pesoSafetyCertified?: boolean;
}

export interface DeliveryAddress {
  id: string;
  label: string; // e.g. "Main Warehousing Hub - Whitefield"
  streetAddress: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  landmark?: string;
  siteContactPerson: string;
  siteContactPhone: string;
  isGatedOrSecured: boolean;
  hasEarthingPoint: boolean;
}

export interface AssetVehicle {
  id: string;
  name: string; // e.g. "Caterpillar 500kVA DG Set" or "Tata Prima 4028.S Truck Fleet #12"
  type: 'dg_genset' | 'fleet_truck' | 'construction_heavy' | 'tractor_agri' | 'passenger_car' | 'marine_boat';
  registrationNo: string; // e.g. "KA-01-MF-7721" or "DG-BLR-PH2-01"
  fuelType: FuelType;
  tankCapacityL: number;
  currentFuelLevelPercent: number;
  consumptionRatePerHour?: number;
  lastRefueledDate?: string;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'bowser_dispatched'
  | 'en_route'
  | 'arrived'
  | 'dispensing'
  | 'completed'
  | 'cancelled';

export interface BowserDriver {
  id: string;
  name: string;
  phone: string;
  photoUrl: string;
  rating: number;
  tripsCompleted: number;
  bowserRegNo: string;
  bowserCapacityLitres: number;
  currentFuelStockL: number;
  pesoLicenseNo: string;
  speedKmh: number;
  currentLat: number;
  currentLng: number;
  dispenserTempC: number;
  isEarthingActive: boolean;
  sparkArrestorVerified: boolean;
}

export interface FuelOrder {
  id: string;
  orderNumber: string; // e.g. "FG-2026-98124"
  createdAt: string;
  scheduledTimeSlot: string;
  fuelType: FuelType;
  quantity: number;
  unitPrice: number;
  fuelTotal: number;
  deliveryFee: number;
  platformFee: number;
  gstAmount: number;
  totalPayable: number;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  asset: AssetVehicle;
  paymentMethod: 'upi' | 'credit_line' | 'wallet' | 'card' | 'cod';
  paymentStatus: 'paid' | 'pending' | 'credit_authorized';
  deliveryOtp: string; // 4-digit code shown to customer for safe dispense
  dispensedQty?: number;
  dispensedStartedAt?: string;
  dispensedCompletedAt?: string;
  flowRateLpm?: number;
  assignedBowser?: BowserDriver;
  invoiceUrl?: string;
  pesoSealNumber?: string;
  densityReport?: {
    measuredDensity: number; // e.g. 832.4 kg/m³
    standardDensity: number; // 830.0 kg/m³
    temperature: number; // 28.5 °C
    flashPoint: string; // >38°C
  };
}

export interface IndianCityRate {
  cityName: string;
  state: string;
  dieselRate: number;
  petrolRate: number;
  biodieselRate: number;
  evRate: number;
  adblueRate: number;
  lat: number;
  lng: number;
  activeBowsersCount: number;
}
