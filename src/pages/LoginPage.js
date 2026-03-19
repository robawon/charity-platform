import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'seller' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, profile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(formData.email, formData.password);
        // Navigation handled by AuthContext listener + useEffect below
      } else {
        await signUp(formData.email, formData.password, formData.name, formData.role);
        setMode('signin');
        setError('');
        alert('Account created! Please sign in.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect after login
  React.useEffect(() => {
    if (profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/seller');
    }
  }, [profile, navigate]);

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    border: '1.5px solid #e2e8f0', borderRadius: '12px',
    fontSize: '0.95rem', color: '#1e293b',
    background: '#fafafa', outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #fff7f0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        input:focus { border-color: #2563eb !important; background: white !important; }
        .tab-btn { transition: all 0.2s; cursor: pointer; }
        .tab-btn.active { background: white; color: #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      `}</style>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '48px', height: '48px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
            }}>
              <Heart size={24} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', fontWeight: 900, color: '#0f2d5e' }}>
              CharityLot
            </span>
          </Link>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.95rem' }}>
            Staff portal — making a difference together
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(15,45,94,0.1)',
          overflow: 'hidden',
        }}>
          {/* Tab toggle */}
          <div style={{ background: '#f1f5f9', padding: '6px', display: 'flex', gap: '4px' }}>
            {['signin', 'signup'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`tab-btn ${mode === m ? 'active' : ''}`}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  border: 'none', fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600, fontSize: '0.9rem',
                  color: mode === m ? '#2563eb' : '#64748b',
                  background: mode === m ? 'white' : 'transparent',
                  cursor: 'pointer',
                }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={{ padding: '32px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', color: '#0f2d5e', marginBottom: '24px', fontWeight: 700 }}>
              {mode === 'signin' ? 'Welcome back 👋' : 'Join our team 🌟'}
            </h2>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                color: '#dc2626', fontSize: '0.875rem',
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                  }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(37,99,235,0.3)',
                transition: 'all 0.2s',
              }}>
                {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In →' : 'Create Account →')}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '20px' }}>
              <Link to="/" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
