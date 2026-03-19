import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Clock, DollarSign, Shield, ArrowRight, Ticket, Users, Star } from 'lucide-react';

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('deadline', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (!error) setEvents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDeadline = (dt) => {
    const d = new Date(dt);
    const now = new Date();
    const diff = d - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today!';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8faff', minHeight: '100vh' }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .event-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(37,99,235,0.12) !important; }
        .event-card { transition: all 0.3s ease; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249,115,22,0.45) !important; }
        .cta-btn { transition: all 0.3s ease; }
      `}</style>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #0f2d5e 0%, #1e4d9a 40%, #2563eb 100%)',
        padding: '100px 1.5rem 120px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99,179,237,0.1)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', filter: 'blur(30px)' }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
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
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: '24px',
            animation: 'fadeUp 0.6s ease 0.1s both',
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

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.6s ease 0.3s both' }}>
            <a href="#events" className="cta-btn" style={{
              padding: '16px 36px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: 'white', fontWeight: 700, fontSize: '1.05rem',
              textDecoration: 'none', boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>
              <Ticket size={20} /> Get Your Ticket
            </a>
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

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '40px', justifyContent: 'center',
            marginTop: '64px', flexWrap: 'wrap',
            animation: 'fadeUp 0.6s ease 0.4s both',
          }}>
            {[
              { icon: <Users size={20} />, value: '2,400+', label: 'Donors' },
              { icon: <Ticket size={20} />, value: '8,200+', label: 'Tickets Sold' },
              { icon: <Heart size={20} fill="currentColor" />, value: '$92K+', label: 'Raised' },
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

      {/* EVENTS */}
      <section id="events" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            background: '#eff6ff', color: '#2563eb', padding: '6px 16px',
            borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>Active Raffles</span>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700,
            color: '#0f2d5e', marginTop: '16px', marginBottom: '12px',
          }}>Choose Your Cause</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Every entry goes toward something that matters.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
            <Ticket size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: '1.1rem' }}>No active events yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {events.map((event) => (
              <div key={event.id} className="event-card" style={{
                background: 'white', borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(15,45,94,0.08)',
                overflow: 'hidden', border: '1px solid rgba(226,232,240,0.6)',
              }}>
                {/* Card header */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e4d9a, #2563eb)',
                  padding: '28px 24px 24px',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.15)', borderRadius: '50px',
                    padding: '4px 12px', fontSize: '0.75rem', color: 'white', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}>
                    <Clock size={12} /> {formatDeadline(event.deadline)}
                  </div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', color: 'white', fontWeight: 700, margin: 0 }}>
                    {event.title}
                  </h3>
                  {event.description && (
                    <p style={{ color: '#bfdbfe', fontSize: '0.875rem', marginTop: '8px', lineHeight: 1.5 }}>
                      {event.description.substring(0, 100)}{event.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>

                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Price</span>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 700, color: '#0f2d5e' }}>
                        ${Number(event.ticket_price).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</span>
                      <div style={{ color: '#475569', fontSize: '0.875rem', fontWeight: 600 }}>
                        {new Date(event.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <Link to={`/buy/${event.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: 'white', borderRadius: '12px', fontWeight: 700,
                    textDecoration: 'none', fontSize: '0.95rem',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
                    transition: 'all 0.2s',
                  }}>
                    <Ticket size={18} /> Buy Ticket ❤️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
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
              { icon: <Heart size={32} fill="currentColor" />, title: '100% to Charity', desc: 'Every dollar you spend goes directly to the cause.' },
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
            <a href="mailto:hello@charitylot.org" style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1.1rem' }}>
              hello@charitylot.org
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
