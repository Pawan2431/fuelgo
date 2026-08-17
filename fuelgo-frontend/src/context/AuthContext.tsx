import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, DeliveryAddress, AssetVehicle } from '../types';
import { DEMO_USER_B2B, INITIAL_SAVED_ADDRESSES, INITIAL_ASSETS } from '../mockData';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth`;

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  activeOtpCode: string | null;
  otpCooldownSeconds: number;
  loginWithPassword: (identifier: string, pass: string) => Promise<boolean>;
  sendOtp: (phoneOrEmail: string) => Promise<string>;
  verifyOtp: (code: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<void>;
  requestPasswordReset: (phoneOrEmail: string) => Promise<string>;
  verifyResetOtp: (code: string) => boolean;
  completePasswordReset: (newPassword: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addDeliveryAddress: (address: Omit<DeliveryAddress, 'id'>) => void;
  addAssetVehicle: (asset: Omit<AssetVehicle, 'id'>) => void;
  updateWallet: (amountDelta: number) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalView: 'login' | 'signup' | 'otp_verify' | 'forgot_password' | 'google_prompt' | 'reset_success';
  setAuthModalView: (view: 'login' | 'signup' | 'otp_verify' | 'forgot_password' | 'google_prompt' | 'reset_success') => void;
  pendingAuthTarget?: { identifier: string; name?: string; role?: UserRole; password?: string };
  setPendingAuthTarget: (target?: { identifier: string; name?: string; role?: UserRole; password?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fuelgo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup' | 'otp_verify' | 'forgot_password' | 'google_prompt' | 'reset_success'>('login');
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState<number>(0);
  const [pendingAuthTarget, setPendingAuthTarget] = useState<{ identifier: string; name?: string; role?: UserRole; password?: string } | undefined>();
  const [pendingResetVerified, setPendingResetVerified] = useState(false);
  const [resetOtp, setResetOtp] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fuelgo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fuelgo_user');
      localStorage.removeItem('fuelgo_token');
    }
  }, [user]);

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldownSeconds]);

  const mapBackendUser = (backendUser: any, role: UserRole = 'b2b_fleet'): UserProfile => {
    return {
      id: backendUser.id.toString(),
      name: backendUser.name,
      email: backendUser.email,
      phone: backendUser.phone || '',
      role: role,
      companyName: 'Apex Infra Pvt Ltd',
      gstin: '29AAACA8821R1ZK',
      avatarUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(backendUser.name),
      walletBalance: 25000,
      creditLimit: 300000,
      creditUsed: 0,
      savedAddresses: INITIAL_SAVED_ADDRESSES,
      savedAssets: INITIAL_ASSETS,
      isVerified: true,
      pesoSafetyCertified: true,
    };
  };

  const loginWithPassword = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    localStorage.setItem('fuelgo_token', data.token);
    setUser(mapBackendUser(data.user));
    setAuthModalOpen(false);
    return true;
  };

  const sendOtp = async (phoneOrEmail: string): Promise<string> => {
    // If it's a password reset or login OTP
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: phoneOrEmail })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    setActiveOtpCode(data.otp);
    setOtpCooldownSeconds(45);
    setPendingAuthTarget((prev) => ({
      identifier: phoneOrEmail,
      name: prev?.name,
      role: prev?.role || 'b2b_fleet',
      password: prev?.password,
    }));
    return data.otp;
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    if (!pendingAuthTarget) return false;
    
    // Check if it's a registration flow (name is present)
    if (pendingAuthTarget.name) {
       // Mock OTP verification for signup (we use activeOtpCode or fallback)
       if (code === activeOtpCode || code === '482910' || code.length === 6) {
         // Call Register API
         const res = await fetch(`${API_BASE}/register`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             name: pendingAuthTarget.name,
             email: pendingAuthTarget.identifier.includes('@') ? pendingAuthTarget.identifier : pendingAuthTarget.identifier + '@fuelgo.in',
             phone: pendingAuthTarget.identifier.includes('@') ? '' : pendingAuthTarget.identifier,
             password: pendingAuthTarget.password || 'Test@1234',
           })
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error);
         
         localStorage.setItem('fuelgo_token', data.token);
         setUser(mapBackendUser(data.user, pendingAuthTarget.role));
         setActiveOtpCode(null);
         setAuthModalOpen(false);
         return true;
       }
       return false;
    } else {
      // OTP Login flow
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: pendingAuthTarget.identifier, otp: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem('fuelgo_token', data.token);
      setUser(mapBackendUser(data.user, pendingAuthTarget.role));
      setActiveOtpCode(null);
      setAuthModalOpen(false);
      return true;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    localStorage.setItem('fuelgo_token', data.token);
    setUser(mapBackendUser(data.user, 'b2b_fleet'));
    setAuthModalOpen(false);
  };

  const requestPasswordReset = async (phoneOrEmail: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: phoneOrEmail })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    setActiveOtpCode(data.otp);
    setOtpCooldownSeconds(45);
    setPendingAuthTarget({ identifier: phoneOrEmail });
    return data.otp;
  };

  const verifyResetOtp = (code: string): boolean => {
    if (code === activeOtpCode || code === '482910' || code.length === 6) {
      setPendingResetVerified(true);
      setResetOtp(code);
      return true;
    }
    return false;
  };

  const completePasswordReset = async (newPassword: string): Promise<boolean> => {
    if (pendingResetVerified && pendingAuthTarget) {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: pendingAuthTarget.identifier, 
          otp: resetOtp || activeOtpCode || '482916', 
          new_password: newPassword 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPendingResetVerified(false);
      setActiveOtpCode(null);
      setResetOtp(null);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fuelgo_token');
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
