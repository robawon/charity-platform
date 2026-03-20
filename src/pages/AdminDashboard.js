import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Calendar, Users, Trophy,
  Plus, Edit2, Trash2, Save, Shuffle, X,
  CheckCircle, XCircle, Clock, UserCheck, UserX, Shield, Menu
} from 'lucide-react';

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: '', description: '', ticket_price: '', deadline: '',
    fields: [{ label: 'Full Name', field_type: 'text', is_required: true }]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, subsRes, sellersRes, winnersRes] = await Promise.all([
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('submissions').select('*, events(title), users!seller_id(name)').order('created_at', { ascending: false }),
        supabase.from('users').select('*').eq('role', 'seller').order('created_at', { ascending: false }),
        supabase.from('winners').select('*, events(title), submissions(buyer_name, form_data)'),
      ]);
      setEvents(eventsRes.data || []);
      setSubmissions(subsRes.data || []);
      setSellers(sellersRes.data || []);
      setWinners(winnersRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = submissions
    .filter(s => s.payment_status === 'approved')
    .reduce((sum, s) => {
      const event = events.find(e => e.id === s.event_id);
      return sum + (event?.ticket_price || 0);
    }, 0);

  const filteredSubmissions = submissions.filter(s => {
    if (selectedEvent !== 'all' && s.event_id !== selectedEvent) return false;
    if (selectedSeller !== 'all' && s.seller_id !== selectedSeller) return false;
    if (selectedStatus !== 'all' && s.payment_status !== selectedStatus) return false;
    return true;
  });

  const handleToggleSellerStatus = async (seller) => {
    const newStatus = seller.status === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} ${seller.name}?`)) return;
    await supabase.from('users').update({ status: newStatus }).eq('id', seller.id);
    fetchData();
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.ticket_price || !eventForm.deadline) {
      alert('Please fill all required fields'); return;
    }
    try {
      let eventId;
      if (editingEvent) {
        const { data } = await supabase.from('events').update({
          title: eventForm.title, description: eventForm.description,
          ticket_price: parseFloat(eventForm.ticket_price), deadline: eventForm.deadline,
        }).eq('id', editingEvent.id).select().single();
        eventId = data.id;
        await supabase.from('form_fields').delete().eq('event_id', eventId);
      } else {
        const { data } = await supabase.from('events').insert([{
          title: eventForm.title, description: eventForm.description,
          ticket_price: parseFloat(eventForm.ticket_price), deadline: eventForm.deadline,
          created_by: profile.id,
        }]).select().single();
        eventId = data.id;
      }
      if (eventForm.fields.length > 0) {
        await supabase.from('form_fields').insert(
          eventForm.fields.map((f, i) => ({ ...f, event_id: eventId, sort_order: i }))
        );
      }
      setShowEventModal(false); setEditingEvent(null); resetEventForm(); fetchData();
    } catch (err) { alert('Error saving event: ' + err.message); }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? This will also delete all submissions.')) return;
    await supabase.from('events').delete().eq('id', eventId);
    fetchData();
  };

 const handlePickWinner = async (eventId) => {
  // Check if winner already exists — if so, block re-picking
  const existing = winners.find(w => w.event_id === eventId);
  if (existing) {
    alert('⚠️ A winner has already been selected for this event and cannot be changed.');
    return;
  }

  // Check if there are approved submissions
  const approved = submissions.filter(s => s.event_id === eventId && s.payment_status === 'approved');
  if (approved.length === 0) {
    alert('No approved submissions for this event!');
    return;
  }

  // Confirm before picking
  if (!window.confirm(`Pick a winner from ${approved.length} approved submission(s)? This cannot be undone.`)) return;

  // Randomly select winner
  const winner = approved[Math.floor(Math.random() * approved.length)];
  await supabase.from('winners').insert([{ event_id: eventId, submission_id: winner.id }]);
  fetchData();
  setActiveTab('winners');
};

  const resetEventForm = () => setEventForm({
    title: '', description: '', ticket_price: '', deadline: '',
    fields: [{ label: 'Full Name', field_type: 'text', is_required: true }]
  });

  const openEditEvent = async (event) => {
    const { data: fields } = await supabase.from('form_fields').select('*').eq('event_id', event.id).order('sort_order');
    setEditingEvent(event);
    setEventForm({ title: event.title, description: event.description || '', ticket_price: event.ticket_price, deadline: event.deadline.slice(0, 16), fields: fields || [] });
    setShowEventModal(true);
  };

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#fffbeb', color: '#b45309', icon: <Clock size={12} />, label: 'Pending' },
      approved: { bg: '#f0fdf4', color: '#15803d', icon: <CheckCircle size={12} />, label: 'Approved' },
      rejected: { bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={12} />, label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{s.icon} {s.label}</span>;
  };

  const sidebarItems = [
    { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Overview' },
    { id: 'events', icon: <Calendar size={18} />, label: 'Events' },
    { id: 'sellers', icon: <Users size={18} />, label: 'Sellers' },
    { id: 'submissions', icon: <Shield size={18} />, label: 'Submissions' },
    { id: 'winners', icon: <Trophy size={18} />, label: 'Winners' },
  ];

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#f8faff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .sidebar-item:hover { background: rgba(37,99,235,0.08) !important; }
        .sidebar-item.active { background: linear-gradient(135deg, #eff6ff, #dbeafe) !important; color: #2563eb !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .action-btn { transition: all 0.2s; }
        tr:hover td { background: #f8faff !important; }

        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important;
            left: ${sidebarOpen ? '0' : '-260px'} !important;
            top: 0 !important;
            height: 100vh !important;
            z-index: 200 !important;
            transition: left 0.3s ease !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.15) !important;
          }
          .sidebar-overlay {
            display: ${sidebarOpen ? 'block' : 'none'} !important;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 199;
          }
          .admin-main { margin-left: 0 !important; }
          .mobile-header { display: flex !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (min-width: 769px) {
          .mobile-header { display: none !important; }
          .admin-sidebar { position: sticky !important; top: 0 !important; height: 100vh !important; }
        }
      `}</style>

      {/* Sidebar overlay for mobile */}
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}
      <aside className="admin-sidebar" style={{ width: '240px', minWidth: '240px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 700, color: '#0f2d5e' }}>❤️ CharityLot</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>Admin Panel</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="mobile-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'none' }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '12px' }}>
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 16px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: activeTab === item.id ? 600 : 500, fontSize: '0.9rem', color: activeTab === item.id ? '#2563eb' : '#64748b', marginBottom: '4px', textAlign: 'left' }}>
              {item.icon} {item.label}
              {item.id === 'sellers' && sellers.filter(s => s.status === 'suspended').length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#fef2f2', color: '#dc2626', borderRadius: '50px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {sellers.filter(s => s.status === 'suspended').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '10px' }}>Administrator</div>
          <button onClick={signOut} style={{ width: '100%', padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="admin-main">
        {/* Mobile header */}
        <div className="mobile-header" style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 16px', height: '56px', alignItems: 'center', justifyContent: 'space-between', display: 'none' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}>
            <Menu size={24} />
          </button>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 700, color: '#0f2d5e' }}>
            {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
          </span>
          <div style={{ width: '32px' }} />
        </div>

        <main style={{ flex: 1, overflow: 'auto', padding: '20px 16px' }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0f2d5e', marginBottom: '6px' }}>Dashboard Overview</h1>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.9rem' }}>Here's what's happening with your charity events.</p>

              <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {[
                  { icon: <Calendar size={22} />, label: 'Total Events', value: events.length, color: '#2563eb', bg: '#eff6ff' },
                  { icon: <Users size={22} />, label: 'Active Sellers', value: sellers.filter(s => s.status === 'active').length, color: '#7c3aed', bg: '#f5f3ff' },
                  { icon: <CheckCircle size={22} />, label: 'Approved Tickets', value: submissions.filter(s => s.payment_status === 'approved').length, color: '#15803d', bg: '#f0fdf4' },
                  { icon: <span style={{ fontSize: '1.1rem' }}>₮</span>, label: 'Total Revenue', value: `Birr ${totalRevenue.toFixed(2)}`, color: '#b45309', bg: '#fffbeb' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>{stat.icon}</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', fontWeight: 700, color: '#0f2d5e', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {sellers.filter(s => s.status === 'suspended').length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserX size={22} color="#dc2626" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>{sellers.filter(s => s.status === 'suspended').length} seller(s) waiting for activation</div>
                      <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>New seller accounts are suspended by default</div>
                    </div>
                  </div>
                  <button onClick={() => handleTabChange('sellers')} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    Manage Sellers →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SELLERS TAB */}
          {activeTab === 'sellers' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0f2d5e', marginBottom: '6px' }}>Seller Management</h1>
              <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>Activate or suspend seller accounts.</p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { icon: <UserCheck size={18} color="#15803d" />, count: sellers.filter(s => s.status === 'active').length, label: 'Active', bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
                  { icon: <UserX size={18} color="#dc2626" />, count: sellers.filter(s => s.status === 'suspended').length, label: 'Suspended', bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '130px' }}>
                    {s.icon}
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
                      <div style={{ color: s.color, fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sellers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p>No sellers registered yet.</p>
                  </div>
                )}
                {sellers.map(seller => (
                  <div key={seller.id} style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${seller.status === 'active' ? '#bbf7d0' : '#fecaca'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: seller.status === 'active' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #94a3b8, #64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                          {seller.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{seller.name}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{seller.email}</div>
                          <span style={{ background: seller.status === 'active' ? '#f0fdf4' : '#fef2f2', color: seller.status === 'active' ? '#15803d' : '#dc2626', padding: '2px 8px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                            {seller.status === 'active' ? <><CheckCircle size={9} /> Active</> : <><XCircle size={9} /> Suspended</>}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tickets sold</div>
                          <div style={{ fontWeight: 700, color: '#0f2d5e', fontSize: '0.9rem' }}>{submissions.filter(s => s.seller_id === seller.id && s.payment_status === 'approved').length}</div>
                        </div>
                        <button onClick={() => handleToggleSellerStatus(seller)} className="action-btn" style={{ padding: '8px 14px', background: seller.status === 'active' ? '#fef2f2' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: seller.status === 'active' ? '#dc2626' : 'white', border: seller.status === 'active' ? '1px solid #fecaca' : 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                          {seller.status === 'active' ? <><UserX size={14} /> Suspend</> : <><UserCheck size={14} /> Activate</>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0f2d5e', margin: 0 }}>Events</h1>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>Manage your charity raffle events.</p>
                </div>
                <button onClick={() => { resetEventForm(); setEditingEvent(null); setShowEventModal(true); }} className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  <Plus size={16} /> New Event
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {events.map(event => {
                  const eventSubs = submissions.filter(s => s.event_id === event.id);
                  const approved = eventSubs.filter(s => s.payment_status === 'approved').length;
                  const hasWinner = winners.find(w => w.event_id === event.id);
                  const isPast = new Date(event.deadline) < new Date();
                  return (
                    <div key={event.id} style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.05rem', color: '#0f2d5e', margin: 0 }}>{event.title}</h3>
                            {isPast && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 600 }}>ENDED</span>}
                            {hasWinner && <span style={{ background: '#fef9c3', color: '#b45309', padding: '2px 8px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 600 }}>🏆 WINNER</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>💰 Birr {Number(event.ticket_price).toFixed(2)}</span>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>📅 {new Date(event.deadline).toLocaleDateString()}</span>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>🎫 {eventSubs.length} ({approved} approved)</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
  {approved > 0 && !hasWinner && (
    <button onClick={() => handlePickWinner(event.id)} className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
      <Shuffle size={14} /> Pick Winner
    </button>
  )}
  {hasWinner && (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fef9c3', color: '#b45309', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #fde68a' }}>
      🏆 Winner Picked
    </span>
  )}
  <button onClick={() => openEditEvent(event)} className="action-btn" style={{ padding: '8px 12px', background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#475569' }}><Edit2 size={15} /></button>
  <button onClick={() => handleDeleteEvent(event.id)} className="action-btn" style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={15} /></button>
</div>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p>No events yet. Create your first charity event!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBMISSIONS */}
          {activeTab === 'submissions' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0f2d5e', marginBottom: '6px' }}>Submissions</h1>
              <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.9rem' }}>All buyer submissions across events.</p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Event', value: selectedEvent, onChange: setSelectedEvent, options: [{ value: 'all', label: 'All Events' }, ...events.map(e => ({ value: e.id, label: e.title }))] },
                  { label: 'Seller', value: selectedSeller, onChange: setSelectedSeller, options: [{ value: 'all', label: 'All Sellers' }, ...sellers.map(s => ({ value: s.id, label: s.name }))] },
                  { label: 'Status', value: selectedStatus, onChange: setSelectedStatus, options: [{ value: 'all', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] },
                ].map(filter => (
                  <select key={filter.label} value={filter.value} onChange={e => filter.onChange(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', flex: '1', minWidth: '120px' }}>
                    {filter.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ))}
              </div>

              {/* Mobile cards view */}
              <div className="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredSubmissions.map(sub => (
                  <div key={sub.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{sub.buyer_name}</div>
                      {statusBadge(sub.payment_status)}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#64748b', fontSize: '0.78rem' }}>📋 {sub.events?.title || '—'}</span>
                      <span style={{ color: '#64748b', fontSize: '0.78rem' }}>👤 {sub.users?.name || '—'}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>📅 {new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {filteredSubmissions.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No submissions match your filters.</div>}
              </div>
            </div>
          )}

          {/* WINNERS */}
          {activeTab === 'winners' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0f2d5e', marginBottom: '6px' }}>🏆 Winners</h1>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.9rem' }}>Randomly selected winners from approved submissions.</p>
              {winners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  <Trophy size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No winners selected yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {winners.map(winner => (
                    <div key={winner.id} style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '2px solid #f59e0b', borderRadius: '18px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>🏆</div>
                      <div>
                        <div style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{winner.events?.title}</div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 700, color: '#78350f' }}>{winner.submissions?.buyer_name}</div>
                        <div style={{ color: '#92400e', fontSize: '0.8rem', marginTop: '4px' }}>Selected on {new Date(winner.selected_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* EVENT MODAL */}
      {showEventModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', color: '#0f2d5e', margin: 0 }}>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowEventModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
            </div>

            {[
              { label: 'Event Title *', key: 'title', type: 'text', placeholder: 'e.g. Spring Charity Raffle 2025' },
              { label: 'Description', key: 'description', type: 'textarea', placeholder: 'Describe the event...' },
              { label: 'Ticket Price (Birr) *', key: 'ticket_price', type: 'number', placeholder: '10.00' },
              { label: 'Deadline *', key: 'deadline', type: 'datetime-local', placeholder: '' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea value={eventForm[field.key]} onChange={e => setEventForm({ ...eventForm, [field.key]: e.target.value })} placeholder={field.placeholder} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', fontSize: '0.9rem' }} />
                ) : (
                  <input type={field.type} value={eventForm[field.key]} onChange={e => setEventForm({ ...eventForm, [field.key]: e.target.value })} placeholder={field.placeholder} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', fontSize: '0.9rem' }} />
                )}
              </div>
            ))}

            <div style={{ marginTop: '20px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Form Fields</label>
                <button onClick={() => setEventForm({ ...eventForm, fields: [...eventForm.fields, { label: '', field_type: 'text', is_required: true }] })} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.78rem' }}>
                  <Plus size={13} /> Add Field
                </button>
              </div>
              {eventForm.fields.map((field, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                  <input type="text" placeholder="Field label" value={field.label} onChange={e => { const f = [...eventForm.fields]; f[idx].label = e.target.value; setEventForm({ ...eventForm, fields: f }); }} style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }} />
                  <select value={field.field_type} onChange={e => { const f = [...eventForm.fields]; f[idx].field_type = e.target.value; setEventForm({ ...eventForm, fields: f }); }} style={{ padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="tel">Phone</option>
                    <option value="textarea">Textarea</option>
                  </select>
                  <button onClick={() => setEventForm({ ...eventForm, fields: eventForm.fields.filter((_, i) => i !== idx) })} style={{ padding: '8px', background: '#fef2f2', border: 'none', borderRadius: '7px', cursor: 'pointer', color: '#dc2626' }}><X size={14} /></button>
                </div>
              ))}
            </div>

            <button onClick={handleSaveEvent} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={16} /> {editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;