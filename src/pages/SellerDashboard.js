import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { Ticket, CheckCircle, XCircle, Clock, ArrowLeft, QrCode, Calendar, RefreshCw, Eye } from 'lucide-react';

const SellerDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [eventsRes, subsRes] = await Promise.all([
        supabase.from('events').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('submissions').select('*, events(title)').eq('seller_id', profile.id).order('created_at', { ascending: false }),
      ]);
      setEvents(eventsRes.data || []);
      setSubmissions(subsRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('submissions-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, () => fetchData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const handleUpdateStatus = async (submissionId, status) => {
    await supabase.from('submissions').update({ payment_status: status }).eq('id', submissionId);
    fetchData();
  };

  const qrUrl = selectedEvent ? `${window.location.origin}/buy/${selectedEvent.id}?seller=${profile?.id}` : '';
  const mySubmissions = selectedEvent ? submissions.filter(s => s.event_id === selectedEvent.id) : submissions;

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#fffbeb', color: '#b45309', icon: <Clock size={12} />, label: 'Pending' },
      approved: { bg: '#f0fdf4', color: '#15803d', icon: <CheckCircle size={12} />, label: 'Approved' },
      rejected: { bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={12} />, label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{s.icon} {s.label}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .event-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(37,99,235,0.12) !important; }
        .event-card { transition: all 0.3s ease; }
        .action-btn:hover { opacity: 0.85; }
        .action-btn { transition: opacity 0.2s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        a { -webkit-tap-highlight-color: transparent; }
        a:active { opacity: 0.8; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedEvent && (
              <button onClick={() => { setSelectedEvent(null); setShowQR(false); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#475569', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem' }}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 700, color: '#0f2d5e' }}>❤️ Seller</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#64748b', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#1e293b' }}>{profile?.name}</strong>
            </span>
            <button onClick={signOut} style={{ padding: '7px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Sign Out</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total', value: submissions.length, icon: <Ticket size={18} />, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Approved', value: submissions.filter(s => s.payment_status === 'approved').length, icon: <CheckCircle size={18} />, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Pending', value: submissions.filter(s => s.payment_status === 'pending').length, icon: <Clock size={18} />, color: '#b45309', bg: '#fffbeb' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '14px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.icon}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 700, color: '#0f2d5e', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {!selectedEvent ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', color: '#0f2d5e', margin: 0 }}>Choose Event</h2>
              <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {events.map(event => {
                  const eventSubs = submissions.filter(s => s.event_id === event.id);
                  const isPast = new Date(event.deadline) < new Date();
                  return (
                    <div key={event.id} className="event-card" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f1f5f9', opacity: isPast ? 0.7 : 1 }}>
                      <div style={{ background: isPast ? '#64748b' : 'linear-gradient(135deg, #1e4d9a, #2563eb)', padding: '16px' }}>
                        <h3 style={{ fontFamily: "'Fraunces', serif", color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{event.title}</h3>
                        {isPast && <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>Event ended</span>}
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Price</div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700, color: '#0f2d5e' }}>Birr {Number(event.ticket_price).toFixed(2)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>My Entries</div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700, color: '#0f2d5e' }}>{eventSubs.length}</div>
                          </div>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '12px' }}>
                          📅 {new Date(event.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <button onClick={() => setSelectedEvent(event)} disabled={isPast} style={{ width: '100%', padding: '11px', background: isPast ? '#f1f5f9' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: isPast ? '#94a3b8' : 'white', border: 'none', borderRadius: '9px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: isPast ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '0.9rem' }}>
                          <QrCode size={15} /> {isPast ? 'Event Ended' : 'Sell Tickets'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p>No active events available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* QR + Submissions stacked on mobile */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

              {/* QR Panel */}
              <div style={{ background: 'white', borderRadius: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '20px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                  <button onClick={() => setShowQR(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '2px solid', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', borderColor: !showQR ? '#2563eb' : '#e2e8f0', background: !showQR ? '#eff6ff' : 'transparent', color: !showQR ? '#2563eb' : '#64748b' }}>📋 Submissions</button>
                  <button onClick={() => setShowQR(true)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '2px solid', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', borderColor: showQR ? '#2563eb' : '#e2e8f0', background: showQR ? '#eff6ff' : 'transparent', color: showQR ? '#2563eb' : '#64748b' }}>📲 QR Code</button>
                </div>

                {showQR ? (
                  <div>
                    <h3 style={{ fontFamily: "'Fraunces', serif", color: '#0f2d5e', fontSize: '1.1rem', marginBottom: '6px' }}>Scan to Buy</h3>
                    <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '16px' }}>Show this QR code to buyers.</p>
                    <div style={{ background: '#f8faff', borderRadius: '14px', padding: '16px', display: 'inline-block', border: '2px dashed #dbeafe' }}>
                      <QRCodeSVG value={qrUrl} size={180} bgColor="transparent" fgColor="#0f2d5e" level="H" />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.68rem', marginTop: '10px', wordBreak: 'break-all' }}>{qrUrl}</p>
                    <div style={{ marginTop: '12px', background: '#eff6ff', borderRadius: '8px', padding: '10px', textAlign: 'left' }}>
                      <p style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>✅ QR includes your seller ID</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontFamily: "'Fraunces', serif", color: '#0f2d5e', fontSize: '1.1rem', marginBottom: '4px' }}>{selectedEvent.title}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '14px' }}>Birr {Number(selectedEvent.ticket_price).toFixed(2)} per ticket</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', fontWeight: 700, color: '#15803d' }}>{mySubmissions.filter(s => s.payment_status === 'approved').length}</div>
                        <div style={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 600 }}>Approved</div>
                      </div>
                      <div style={{ flex: 1, background: '#fffbeb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', fontWeight: 700, color: '#b45309' }}>{mySubmissions.filter(s => s.payment_status === 'pending').length}</div>
                        <div style={{ color: '#d97706', fontSize: '0.72rem', fontWeight: 600 }}>Pending</div>
                      </div>
                    </div>
                    <button onClick={() => setShowQR(true)} style={{ width: '100%', marginTop: '12px', padding: '11px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', border: 'none', borderRadius: '9px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '0.9rem' }}>
                      <QrCode size={16} /> Show QR Code
                    </button>
                  </div>
                )}
              </div>

              {/* Submissions */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', color: '#0f2d5e', margin: 0 }}>Buyer Submissions</h2>
                  <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px', background: '#f1f5f9', border: 'none', borderRadius: '7px', cursor: 'pointer', color: '#475569', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem' }}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>

                {mySubmissions.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: '14px', padding: '36px', textAlign: 'center', color: '#94a3b8', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <QrCode size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem' }}>No submissions yet.</p>
                    <p style={{ fontSize: '0.78rem' }}>Share your QR code!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mySubmissions.map(sub => (
                      <div key={sub.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${sub.payment_status === 'approved' ? '#bbf7d0' : sub.payment_status === 'rejected' ? '#fecaca' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{sub.buyer_name}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '2px' }}>
                              {new Date(sub.created_at).toLocaleDateString()} · {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {statusBadge(sub.payment_status)}
                        </div>

                        {sub.form_data && Object.keys(sub.form_data).length > 0 && (
                          <div style={{ background: '#f8faff', borderRadius: '7px', padding: '8px 10px', marginBottom: '10px' }}>
                            {Object.entries(sub.form_data).map(([key, val]) => (
                              <div key={key} style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', padding: '2px 0' }}>
                                <span style={{ color: '#94a3b8', minWidth: '70px', flexShrink: 0 }}>{key}:</span>
                                <span style={{ color: '#475569', fontWeight: 500 }}>{val}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {sub.payment_status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleUpdateStatus(sub.id, 'approved')} className="action-btn" style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none', borderRadius: '7px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button onClick={() => handleUpdateStatus(sub.id, 'rejected')} className="action-btn" style={{ flex: 1, padding: '9px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '7px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                        {sub.payment_status === 'approved' && (
                          <button
                            onClick={() => navigate(`/ticket/${sub.id}`)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              padding: '14px 16px',
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                              color: 'white', borderRadius: '10px',
                              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem',
                              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                              width: '100%', boxSizing: 'border-box',
                              marginTop: '4px',
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation',
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Eye size={16} style={{ flexShrink: 0 }} />
                            <span>View Ticket</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;