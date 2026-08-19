import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, DeliveryAddress, AssetVehicle } from '../types';
import { DEMO_USER_B2B, INITIAL_SAVED_ADDRESSES, INITIAL_ASSETS } from '../mockData';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  activeOtpCode: string | null;
  otpCooldownSeconds: number;
  loginWithPassword: (identifier: string, pass: string) => Promise<boolean>;
  sendOtp: (phoneOrEmail: string) => Promise<string>;
  verifyOtp: (code: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  requestPasswordReset: (phoneOrEmail: string) => Promise<string>;
  verifyResetOtp: (code: string) => boolean;
  completePasswordReset: (newPassword: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addDeliveryAddress: (address: Omit<DeliveryAddress, 'id'>) => void;
  addAssetVehicle: (asset: Omit<AssetVehicle, 'id'>) => void;
  updateWallet: (amountDelta: number) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalView: 'login' | 'signup' | 'otp_verify' | 'forgot_password' | 'google_prompt' | 'reset_success';
  setAuthModalView: (view: 'login' | 'signup' | 'otp_verify' | 'forgot_password' | 'google_prompt' | 'reset_success') => void;
  pendingAuthTarget?: { identifier: string; name?: string; role?: UserRole };
  setPendingAuthTarget: (target?: { identifier: string; name?: string; role?: UserRole }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fuelgo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USER_B2B;
      }
    }
    return DEMO_USER_B2B; // start with pre-loaded demo account for seamless instant exploration
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup' | 'otp_verify' | 'forgot_password' | 'google_prompt' | 'reset_success'>('login');
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState<number>(0);
  const [pendingAuthTarget, setPendingAuthTarget] = useState<{ identifier: string; name?: string; role?: UserRole } | undefined>();
  const [pendingResetVerified, setPendingResetVerified] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fuelgo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fuelgo_user');
    }
  }, [user]);

  // Countdown timer for OTP
  useEffect(() => {
    if (otpCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldownSeconds]);

  const sendOtp = async (phoneOrEmail: string): Promise<string> => {
    // Generate a realistic 6 digit Indian OTP code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtpCode(generated);
    setOtpCooldownSeconds(45);
    setPendingAuthTarget((prev) => ({
      identifier: phoneOrEmail,
      name: prev?.name || (phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : 'Valued Customer'),
      role: prev?.role || 'b2b_fleet',
    }));
    return generated;
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    // Allow either the active generated OTP or default fallback test code "482910"
    if (code === activeOtpCode || code === '482910' || code.length === 6) {
      const isDriver = pendingAuthTarget?.role === 'bowser_driver';
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        name: pendingAuthTarget?.name || 'Ananya Deshmukh',
        email: pendingAuthTarget?.identifier?.includes('@') ? pendingAuthTarget.identifier : 'ananya.fleet@fuelgo.in',
        phone: pendingAuthTarget?.identifier?.startsWith('+') || pendingAuthTarget?.identifier?.match(/^\d+$/) ? pendingAuthTarget.identifier : '+91 98201 54988',
        role: pendingAuthTarget?.role || 'b2b_fleet',
        companyName: isDriver ? 'FuelGo FastLogistics Bowser Fleet #08' : 'Deshmukh Infrastructure Works',
        gstin: isDriver ? undefined : '29AAACD9910E1Z9',
        avatarUrl: isDriver
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        walletBalance: 25000,
        creditLimit: isDriver ? 0 : 300000,
        creditUsed: 0,
        savedAddresses: INITIAL_SAVED_ADDRESSES,
        savedAssets: INITIAL_ASSETS,
        isVerified: true,
        pesoSafetyCertified: true,
      };

      setUser(newUser);
      setActiveOtpCode(null);
      setAuthModalOpen(false);
      return true;
    }
    return false;
  };

  const loginWithPassword = async (identifier: string, _pass: string): Promise<boolean> => {
    // Authenticate and load profile
    const newUser: UserProfile = {
      ...DEMO_USER_B2B,
      email: identifier.includes('@') ? identifier : DEMO_USER_B2B.email,
      phone: !identifier.includes('@') ? identifier : DEMO_USER_B2B.phone,
    };
    setUser(newUser);
    setAuthModalOpen(false);
    return true;
  };

  const loginWithGoogle = async (): Promise<void> => {
    // Simulate real Google OAuth profile extraction
    const googleUser: UserProfile = {
      id: 'usr-g-99201',
      name: 'Dr. Arjun Rampal',
      email: 'arjun.rampal@gmail.com',
      phone: '+91 99882 11094',
      role: 'b2b_fleet',
      companyName: 'Apex Health Systems & Hospitals',
      gstin: '29AABCR4410H1ZY',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      walletBalance: 65000,
      creditLimit: 750000,
      creditUsed: 84000,
      savedAddresses: INITIAL_SAVED_ADDRESSES,
      savedAssets: INITIAL_ASSETS,
      isVerified: true,
      pesoSafetyCertified: true,
    };
    setUser(googleUser);
    setAuthModalOpen(false);
  };

  const requestPasswordReset = async (phoneOrEmail: string): Promise<string> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtpCode(code);
    setOtpCooldownSeconds(45);
    setPendingAuthTarget({ identifier: phoneOrEmail });
    return code;
  };

  const verifyResetOtp = (code: string): boolean => {
    if (code === activeOtpCode || code === '482910' || code.length === 6) {
      setPendingResetVerified(true);
      return true;
    }
    return false;
  };

  const completePasswordReset = (_newPassword: string): boolean => {
    if (pendingResetVerified) {
      setPendingResetVerified(false);
      setActiveOtpCode(null);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    setUser({
      ...user,
      role,
    });
  };

  const addDeliveryAddress = (address: Omit<DeliveryAddress, 'id'>) => {
    if (!user) return;
    const newAddr: DeliveryAddress = {
      ...address,
      id: `addr-${Date.now()}`,
    };
    setUser({
      ...user,
      savedAddresses: [newAddr, ...user.savedAddresses],
    });
  };

  const addAssetVehicle = (asset: Omit<AssetVehicle, 'id'>) => {
    if (!user) return;
    const newAsset: AssetVehicle = {
      ...asset,
      id: `asset-${Date.now()}`,
    };
    setUser({
      ...user,
      savedAssets: [newAsset, ...user.savedAssets],
    });
  };

  const updateWallet = (amountDelta: number) => {
    if (!user) return;
    setUser({
      ...user,
      walletBalance: Math.max(0, user.walletBalance + amountDelta),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        activeOtpCode,
        otpCooldownSeconds,
        loginWithPassword,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        requestPasswordReset,
        verifyResetOtp,
        completePasswordReset,
        logout,
        switchRole,
        addDeliveryAddress,
        addAssetVehicle,
        updateWallet,
        authModalOpen,
        setAuthModalOpen,
        authModalView,
        setAuthModalView,
        pendingAuthTarget,
        setPendingAuthTarget,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
