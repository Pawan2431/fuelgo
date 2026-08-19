import React from 'react';
import { Home, MapPin, Clock, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './components.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/track', icon: MapPin, label: 'Track' },
    { path: '/history', icon: Clock, label: 'History' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {item.label}
          </button>
        );
      })}
      <button 
        className="tab-item" 
        onClick={() => { logout(); navigate('/'); }}
      >
        <LogOut size={20} />
        Logout
      </button>
    </nav>
  );
}
