import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, ArrowRight, Ticket, Users, Star } from 'lucide-react';

const HomePage = () => {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8faff', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.4);opacity:0} }
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(249,115,22,0.45)!important}
        .cta-btn{transition:all 0.3s ease}
        .signup-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,99,235,0.4)!important}
        .signup-btn{transition:all 0.3s ease}
      `}</style>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #0f2d5e 0%, #1e4d9a 40%, #2563eb 100%)',
        padding: '100px 1.5rem 120px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99,179,237,0.1)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', filter: 'blur(30px)' }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Live badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50px', padding: '8px 20px', marginBottom: '28px',
            color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600,
            animation: 'fadeUp 0.6s ease forwards',
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#34d399', animation: 'pulse-ring 1.5s ease-out infinite' }} />
            </div>
            Live Charity Raffle — Real Impact
          </div>

          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            fontWeight: 900, color: 'white', lineHeight: 1.1,
            marginBottom: '24px', animation: 'fadeUp 0.6s ease 0.1s both',
          }}>
            Support Our Cause{' '}
            <span style={{ color: '#fb923c', display: 'inline-block', animation: 'float 3s ease-in-out infinite' }}>❤️</span>
          </h1>

          <p style={{
            fontSize: '1.2rem', color: '#bfdbfe', lineHeight: 1.7,
            marginBottom: '40px', fontWeight: 300,
            animation: 'fadeUp 0.6s ease 0.2s both',
          }}>
            Every ticket you buy directly funds lives. Join our raffle, win amazing prizes,<br />
            and make a real difference in your community.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.6s ease 0.3s both' }}>
            <Link to="/login" className="signup-btn" style={{
              padding: '16px 36px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', fontWeight: 700, fontSize: '1.05rem',
              textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              border: '2px solid rgba(255,255,255,0.2)',
            }}>
              <Users size={20} /> Sign Up Now
            </Link>
            <a href="#trust" style={{
              padding: '16px 36px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontWeight: 600, fontSize: '1.05rem',
              textDecoration: 'none', backdropFilter: 'blur(8px)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>
              Learn More <ArrowRight size={18} />
            </a>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '40px', justifyContent: 'center',
            marginTop: '64px', flexWrap: 'wrap',
            animation: 'fadeUp 0.6s ease 0.4s both',
          }}>
            {[
              { icon: <Users size={20} />, value: '2,400+', label: 'Donors' },
              { icon: <Ticket size={20} />, value: '8,200+', label: 'Tickets Sold' },
              { icon: <Heart size={20} fill="currentColor" />, value: 'Birr 92K+', label: 'Raised' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ color: '#93c5fd', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: '#93c5fd', fontSize: '0.85rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAVE */}
      <div style={{ background: '#0f2d5e', lineHeight: 0 }}>
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" style={{ width: '100%', height: '60px', display: 'block' }}>
          <path d="M0,40 C300,80 900,0 1200,40 L1200,80 L0,80 Z" fill="#f8faff" />
        </svg>
      </div>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>How It Works</span>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#0f2d5e', marginTop: '16px', marginBottom: '12px' }}>
            Simple. Fair. Impactful.
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Get your ticket in 3 easy steps.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', icon: <Users size={32} />, title: 'Sign Up', desc: 'Create your account and join the CharityLot community.' },
            { step: '02', icon: <Ticket size={32} />, title: 'Get Your Ticket', desc: 'Contact a seller or scan their QR code to purchase a raffle ticket.' },
            { step: '03', icon: <Heart size={32} fill="currentColor" />, title: 'Support & Win', desc: 'Your purchase supports a great cause and enters you in the raffle.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '20px', padding: '32px 24px',
              boxShadow: '0 4px 20px rgba(15,45,94,0.08)',
              border: '1px solid rgba(226,232,240,0.6)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '16px', right: '20px',
                fontFamily: "'Fraunces', serif", fontSize: '3rem', fontWeight: 900,
                color: '#eff6ff', lineHeight: 1,
              }}>{item.step}</div>
              <div style={{ color: '#2563eb', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', color: '#0f2d5e', fontWeight: 700, marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Sign up CTA */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to="/login" className="signup-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '16px 40px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white', fontWeight: 700, fontSize: '1.1rem',
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
          }}>
            <Users size={20} /> Create Your Account ❤️
          </Link>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section id="trust" style={{ background: 'linear-gradient(135deg, #0f2d5e, #1e4d9a)', padding: '80px 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'white', fontWeight: 700, marginBottom: '16px' }}>
            Why Trust CharityLot?
          </h2>
          <p style={{ color: '#93c5fd', fontSize: '1.05rem', marginBottom: '56px' }}>
            100% of proceeds go directly to charity. No hidden fees. No middlemen.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { icon: <Shield size={32} />, title: 'Fully Transparent', desc: 'Every transaction is tracked and publicly verifiable.' },
              { icon: <Heart size={32} fill="currentColor" />, title: '100% to Charity', desc: 'Every Birr you spend goes directly to the cause.' },
              { icon: <Star size={32} fill="currentColor" />, title: 'Verified Winners', desc: 'Random selection ensures fair outcomes for everyone.' },
              { icon: <Users size={32} />, title: 'Community Driven', desc: 'Powered by volunteers who believe in making a difference.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
                borderRadius: '16px', padding: '32px 24px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <div style={{ color: '#60a5fa', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: '#93c5fd', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '56px', color: '#93c5fd' }}>
            <p style={{ fontSize: '1rem', marginBottom: '8px' }}>Questions? Contact us at:</p>
            <a href="mailto:hello@charitylot.app" style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1.1rem' }}>
              hello@charitylot.app
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#080f20', padding: '32px 1.5rem', textAlign: 'center', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <Heart size={16} fill="#ef4444" color="#ef4444" />
          <span style={{ fontFamily: "'Fraunces', serif", color: '#94a3b8', fontWeight: 600 }}>CharityLot</span>
        </div>
        <p style={{ fontSize: '0.8rem' }}>© {new Date().getFullYear()} CharityLot. Making giving easy, one ticket at a time.</p>
      </footer>
    </div>
  );
};

export default HomePage;
