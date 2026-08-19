import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, ShieldAlert } from 'lucide-react';
import './components.css';

export default function AppHeader() {
  const { user, is2FAVerified } = useContext(AuthContext);

  let roleText = 'Login Required';
  let RoleIcon = ShieldAlert;
  let roleColor = 'var(--text-muted)';

  if (user && is2FAVerified) {
    roleText = `${user.name} (2FA)`;
    RoleIcon = Shield;
    roleColor = 'var(--success)';
  } else if (user) {
    roleText = 'Verification Pending';
    roleColor = 'var(--primary)';
  }

  return (
    <header className="app-header">
      <div className="brand-link">
        <img src="/FuelGo.png" alt="FuelGo Logo" height="32" style={{ borderRadius: '6px' }} />
        <div className="brand-logo" style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '20px', color: 'var(--text)' }}>
          Fuel<span className="text-primary">Go</span>
        </div>
      </div>
      <div className="role-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: roleColor, background: 'rgba(0,0,0,0.04)', padding: '6px 12px', borderRadius: '20px' }}>
        <RoleIcon size={14} />
        {roleText}
      </div>
    </header>
  );
}
