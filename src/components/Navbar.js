import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardLink = profile?.role === 'admin' ? '/admin' : '/seller';

  return (
    <nav style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(226,232,240,0.8)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 1.5rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={18} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', fontWeight: 700, color: '#1e3a5f' }}>
            CharityLot
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Welcome, <strong style={{ color: '#1e3a5f' }}>{profile?.name}</strong>
              </span>
              <Link to={dashboardLink} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: '#eff6ff', color: '#2563eb',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                transition: 'all 0.2s',
              }}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button onClick={handleSignOut} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'transparent', border: '1px solid #e2e8f0',
                color: '#64748b', cursor: 'pointer', fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}>
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                padding: '8px 20px', borderRadius: '8px',
                color: '#2563eb', fontWeight: 600, fontSize: '0.875rem',
                textDecoration: 'none',
              }}>Sign In</Link>
              <Link to="/#events" style={{
                padding: '8px 20px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white', fontWeight: 700, fontSize: '0.875rem',
                textDecoration: 'none', boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              }}>Get Tickets ❤️</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
