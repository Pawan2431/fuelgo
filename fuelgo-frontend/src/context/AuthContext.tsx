import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, DeliveryAddress, AssetVehicle } from '../types';
import { DEMO_USER_B2B, INITIAL_SAVED_ADDRESSES, INITIAL_ASSETS } from '../mockData';
// Firebase removed for MSG91

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://10.205.182.110:3000'}/api/auth`;

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

  const [authModalOpen, setAuthModalOpen] = useState(() => {
    return localStorage.getItem('fuelgo_user') ? false : true;
  });
  const [authModalView, setAuthModalView] = useState<'login' | 'signup' | 'otp_verify' | 'forgot_password' | 'google_prompt' | 'reset_success'>('login');
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState<number>(0);
  const [pendingAuthTarget, setPendingAuthTarget] = useState<{ identifier: string; name?: string; role?: UserRole; password?: string } | undefined>();
  const [pendingResetVerified, setPendingResetVerified] = useState(false);
  const [resetOtp, setResetOtp] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fuelgo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fuelgo_user');
      localStorage.removeItem('fuelgo_token');
      setAuthModalOpen(true);
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
      role: backendUser.role || role,
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
    // ── Demo credential bypass (no backend needed) ──
    const DEMO_USERS: Record<string, UserProfile> = {
      'vikram.singhania@indialogistics.co.in': {
        id: 'demo-b2b-1',
        name: 'Vikram Singhania',
        email: 'vikram.singhania@indialogistics.co.in',
        phone: '9820045910',
        role: 'b2b_fleet',
        companyName: 'Apex Logistics Pvt Ltd',
        gstin: '29AAACA8821R1ZK',
        avatarUrl: 'https://ui-avatars.com/api/?name=Vikram+Singhania&background=f59e0b&color=000',
        walletBalance: 25000,
        creditLimit: 300000,
        creditUsed: 0,
        savedAddresses: INITIAL_SAVED_ADDRESSES,
        savedAssets: INITIAL_ASSETS,
        isVerified: true,
        pesoSafetyCertified: true,
      },
      'rajesh.driver@fuelgo.in': {
        id: 'demo-driver-1',
        name: 'Rajesh Kumar Yadav',
        email: 'rajesh.driver@fuelgo.in',
        phone: '9886077123',
        role: 'bowser_driver',
        companyName: 'FuelGo Bowser Fleet',
        gstin: '',
        avatarUrl: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=10b981&color=fff',
        walletBalance: 5000,
        creditLimit: 0,
        creditUsed: 0,
        savedAddresses: INITIAL_SAVED_ADDRESSES,
        savedAssets: INITIAL_ASSETS,
        isVerified: true,
        pesoSafetyCertified: true,
      },
      'admin@fuelgo.com': {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@fuelgo.com',
        phone: '7989154858',
        role: 'admin',
        companyName: 'FuelGo HQ',
        gstin: '',
        avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=dc2626&color=fff',
        walletBalance: 0,
        creditLimit: 0,
        creditUsed: 0,
        savedAddresses: INITIAL_SAVED_ADDRESSES,
        savedAssets: INITIAL_ASSETS,
        isVerified: true,
        pesoSafetyCertified: true,
      },
    };
    if (DEMO_USERS[identifier] && (pass === 'demo123' || pass === 'Demo@123' || pass === 'password123')) {
      localStorage.setItem('fuelgo_token', 'mock_token_' + Date.now());
      setUser(DEMO_USERS[identifier]);
      setAuthModalOpen(false);
      return true;
    }

    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password: pass })
    });
    const text = await res.text();
    if (!text) throw new Error('Server did not respond. Please try again.');
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || 'Invalid credentials.');

    localStorage.setItem('fuelgo_token', data.token);
    setUser(mapBackendUser(data.user));
    setAuthModalOpen(false);
    return true;
  };


  const sendOtp = async (phoneOrEmail: string): Promise<string> => {
    // We expect a phone number since MSG91 operates on mobile numbers, but now we support emails too
    const isEmail = phoneOrEmail.includes('@');
    const phone = isEmail ? phoneOrEmail : (phoneOrEmail.includes('+') ? phoneOrEmail : `+91${phoneOrEmail}`);
    
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phone })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP via SMS provider");
      }
      
      setOtpCooldownSeconds(30);
      
      return "Sent";
    } catch (error: any) {
      console.error("Error during sendOtp", error);
      throw new Error(error.message || "Failed to send OTP via SMS provider");
    }
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    if (!pendingAuthTarget) return false;
    
    try {
      const phone = pendingAuthTarget.identifier;

      // ── Demo OTP bypass (no backend needed) ──
      const DEMO_USERS: Record<string, UserProfile> = {
        'vikram.singhania@indialogistics.co.in': {
          id: 'demo-b2b-1', name: 'Vikram Singhania', email: 'vikram.singhania@indialogistics.co.in', phone: '9820045910', role: 'b2b_fleet', companyName: 'Apex Logistics Pvt Ltd', gstin: '29AAACA8821R1ZK', avatarUrl: 'https://ui-avatars.com/api/?name=Vikram+Singhania', walletBalance: 25000, creditLimit: 300000, creditUsed: 0, savedAddresses: INITIAL_SAVED_ADDRESSES, savedAssets: INITIAL_ASSETS, isVerified: true, pesoSafetyCertified: true,
        },
        'rajesh.driver@fuelgo.in': {
          id: 'demo-driver-1', name: 'Rajesh Kumar Yadav', email: 'rajesh.driver@fuelgo.in', phone: '9886077123', role: 'bowser_driver', companyName: 'FuelGo Bowser Fleet', gstin: '', avatarUrl: 'https://ui-avatars.com/api/?name=Rajesh+Kumar', walletBalance: 5000, creditLimit: 0, creditUsed: 0, savedAddresses: INITIAL_SAVED_ADDRESSES, savedAssets: INITIAL_ASSETS, isVerified: true, pesoSafetyCertified: true,
        },
        'admin@fuelgo.com': {
          id: 'admin-1', name: 'Admin User', email: 'admin@fuelgo.com', phone: '7989154858', role: 'admin', companyName: 'FuelGo HQ', gstin: '', avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User', walletBalance: 0, creditLimit: 0, creditUsed: 0, savedAddresses: INITIAL_SAVED_ADDRESSES, savedAssets: INITIAL_ASSETS, isVerified: true, pesoSafetyCertified: true,
        }
      };

      if (DEMO_USERS[phone]) {
        const userToLogin = DEMO_USERS[phone];
        localStorage.setItem('fuelgo_token', 'mock_token_' + Date.now());
        setUser(userToLogin);
        setActiveOtpCode(null);
        setConfirmationResult(null);
        setAuthModalOpen(false);
        return true;
      }

      // 1. Verify OTP with Backend (which calls MSG91)
      const verifyRes = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phone, otp: code })
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Invalid OTP or code expired.");
      }

      // 2. If it's a new user and we are in registration flow
      if (verifyData.isNewUser && pendingAuthTarget.name) {
         // Call Backend Register API
         const res = await fetch(`${API_BASE}/register`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             name: pendingAuthTarget.name,
             email: pendingAuthTarget.identifier.includes('@') ? pendingAuthTarget.identifier : pendingAuthTarget.identifier + '@fuelgo.in',
             phone: pendingAuthTarget.identifier.includes('@') ? '' : phone.replace('+91', ''),
             password: pendingAuthTarget.password || 'Test@1234', // Needs a valid password
             role: pendingAuthTarget.role || 'b2b_fleet'
           })
         });
         const data = await res.json();
         if (!res.ok) {
            throw new Error(data.error);
         }
         
         // Successfully registered and received token
         localStorage.setItem('fuelgo_token', data.token);
         setUser(mapBackendUser(data.user, pendingAuthTarget.role));
         setActiveOtpCode(null);
         setConfirmationResult(null);
         setAuthModalOpen(false);
         return true;
      }
      
      // 3. If it's a login flow and user is found
      if (verifyData.success && verifyData.user) {
        localStorage.setItem('fuelgo_token', verifyData.token);
        setUser(mapBackendUser(verifyData.user, pendingAuthTarget.role));
        setActiveOtpCode(null);
        setConfirmationResult(null);
        setAuthModalOpen(false);
        return true;
      }

      // 4. If login flow but user is not registered
      if (verifyData.isNewUser && !pendingAuthTarget.name) {
         throw new Error("No account found. Please register first.");
      }

      return false;

    } catch (error: any) {
      console.error("OTP Verification failed:", error);
      // Don't mask backend validation errors
      throw new Error(error.message || "Invalid OTP or code expired.");
    }
  };

  const loginWithGoogle = async (credential: string): Promise<void> => {
    // Try backend verification first
    try {
      const res = await fetch(`${API_BASE}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      // Only parse JSON if there is content
      const text = await res.text();
      if (!text) throw new Error('Empty response from server');
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || 'Google login failed');

      localStorage.setItem('fuelgo_token', data.token);
      setUser(mapBackendUser(data.user, 'b2b_fleet'));
      setAuthModalOpen(false);
      return;
    } catch (_backendErr) {
      // Backend failed — decode Google JWT payload client-side as fallback
    }

    // Client-side fallback: decode the Google ID token (it's a JWT, just base64)
    try {
      const payloadBase64 = credential.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      const googleUser: UserProfile = {
        id: `google-${payload.sub}`,
        name: payload.name || payload.email?.split('@')[0] || 'Google User',
        email: payload.email || '',
        phone: '',
        role: 'b2b_fleet',
        companyName: 'My Company',
        gstin: '',
        avatarUrl: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'User')}&background=4285F4&color=fff`,
        walletBalance: 25000,
        creditLimit: 300000,
        creditUsed: 0,
        savedAddresses: INITIAL_SAVED_ADDRESSES,
        savedAssets: INITIAL_ASSETS,
        isVerified: true,
        pesoSafetyCertified: true,
      };
      localStorage.setItem('fuelgo_token', 'google_jwt_' + Date.now());
      setUser(googleUser);
      setAuthModalOpen(false);
    } catch (_decodeErr) {
      throw new Error('Google Sign-In failed. Please use the Quick Demo Login below.');
    }
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
