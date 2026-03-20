import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Calendar, Users, Trophy,
  Plus, Edit2, Trash2, Save, Shuffle, X,
  CheckCircle, XCircle, Clock, UserCheck, UserX, Shield
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    const action = newStatus === 'active' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${seller.name}?`)) return;
    await supabase.from('users').update({ status: newStatus }).eq('id', seller.id);
    fetchData();
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.ticket_price || !eventForm.deadline) {
      alert('Please fill all required fields');
      return;
    }
    try {
      let eventId;
      if (editingEvent) {
        const { data } = await supabase.from('events').update({
          title: eventForm.title,
          description: eventForm.description,
          ticket_price: parseFloat(eventForm.ticket_price),
          deadline: eventForm.deadline,
        }).eq('id', editingEvent.id).select().single();
        eventId = data.id;
        await supabase.from('form_fields').delete().eq('event_id', eventId);
      } else {
        const { data } = await supabase.from('events').insert([{
          title: eventForm.title,
          description: eventForm.description,
          ticket_price: parseFloat(eventForm.ticket_price),
          deadline: eventForm.deadline,
          created_by: profile.id,
        }]).select().single();
        eventId = data.id;
      }
      if (eventForm.fields.length > 0) {
        await supabase.from('form_fields').insert(
          eventForm.fields.map((f, i) => ({ ...f, event_id: eventId, sort_order: i }))
        );
      }
      setShowEventModal(false);
      setEditingEvent(null);
      resetEventForm();
      fetchData();
    } catch (err) {
      alert('Error saving event: ' + err.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? This will also delete all submissions.')) return;
    await supabase.from('events').delete().eq('id', eventId);
    fetchData();
  };

  const handlePickWinner = async (eventId) => {
    const approved = submissions.filter(s => s.event_id === eventId && s.payment_status === 'approved');
    if (approved.length === 0) { alert('No approved submissions for this event!'); return; }
    const existing = winners.find(w => w.event_id === eventId);
    if (existing && !window.confirm('A winner already exists. Pick a new one?')) return;
    if (existing) await supabase.from('winners').delete().eq('event_id', eventId);
    const winner = approved[Math.floor(Math.random() * approved.length)];
    await supabase.from('winners').insert([{ event_id: eventId, submission_id: winner.id }]);
    fetchData();
    setActiveTab('winners');
  };

  const resetEventForm = () => {
    setEventForm({
      title: '', description: '', ticket_price: '', deadline: '',
      fields: [{ label: 'Full Name', field_type: 'text', is_required: true }]
    });
  };

  const openEditEvent = async (event) => {
    const { data: fields } = await supabase.from('form_fields').select('*').eq('event_id', event.id).order('sort_order');
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      ticket_price: event.ticket_price,
      deadline: event.deadline.slice(0, 16),
      fields: fields || [],
    });
    setShowEventModal(true);
  };

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#fffbeb', color: '#b45309', icon: <Clock size={12} />, label: 'Pending' },
      approved: { bg: '#f0fdf4', color: '#15803d', icon: <CheckCircle size={12} />, label: 'Approved' },
      rejected: { bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={12} />, label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {s.icon} {s.label}
      </span>
    );
  };

  const sidebarItems = [
    { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Overview' },
    { id: 'events', icon: <Calendar size={18} />, label: 'Events' },
    { id: 'sellers', icon: <Users size={18} />, label: 'Sellers' },
    { id: 'submissions', icon: <Shield size={18} />, label: 'Submissions' },
    { id: 'winners', icon: <Trophy size={18} />, label: 'Winners' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#f8faff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .sidebar-item:hover { background: rgba(37,99,235,0.08) !important; }
        .sidebar-item.active { background: linear-gradient(135deg, #eff6ff, #dbeafe) !important; color: #2563eb !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .action-btn { transition: all 0.2s; }
        tr:hover td { background: #f8faff !important; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: '240px', minWidth: '240px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700, color: '#0f2d5e' }}>❤️ CharityLot</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Admin Panel</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
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

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>{profile?.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>Administrator</div>
          <button onClick={signOut} style={{ width: '100%', padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '32px' }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#0f2d5e', marginBottom: '8px' }}>Dashboard Overview</h1>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Here's what's happening with your charity events.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {[
                  { icon: <Calendar size={24} />, label: 'Total Events', value: events.length, color: '#2563eb', bg: '#eff6ff' },
                  { icon: <Users size={24} />, label: 'Active Sellers', value: sellers.filter(s => s.status === 'active').length, color: '#7c3aed', bg: '#f5f3ff' },
                  { icon: <CheckCircle size={24} />, label: 'Approved Tickets', value: submissions.filter(s => s.payment_status === 'approved').length, color: '#15803d', bg: '#f0fdf4' },
                  { icon: <span style={{ fontSize: '1.2rem' }}>₮</span>, label: 'Total Revenue', value: `Birr ${totalRevenue.toFixed(2)}`, color: '#b45309', bg: '#fffbeb' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>{stat.icon}</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 700, color: '#0f2d5e' }}>{stat.value}</div>
                    <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {sellers.filter(s => s.status === 'suspended').length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <UserX size={24} color="#dc2626" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.95rem' }}>{sellers.filter(s => s.status === 'suspended').length} seller(s) waiting for activation</div>
                      <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>New seller accounts are suspended by default</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('sellers')} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.875rem' }}>
                    Manage Sellers →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SELLERS TAB */}
          {activeTab === 'sellers' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#0f2d5e', marginBottom: '8px' }}>Seller Management</h1>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Activate or suspend seller accounts. New accounts start as suspended.</p>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserCheck size={20} color="#15803d" />
                  <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 700, color: '#15803d' }}>{sellers.filter(s => s.status === 'active').length}</div>
                    <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>Active Sellers</div>
                  </div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserX size={20} color="#dc2626" />
                  <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{sellers.filter(s => s.status === 'suspended').length}</div>
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>Suspended</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sellers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>No sellers registered yet.</p>
                  </div>
                )}
                {sellers.map(seller => (
                  <div key={seller.id} style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${seller.status === 'active' ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: seller.status === 'active' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #94a3b8, #64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                        {seller.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{seller.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{seller.email}</div>
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ background: seller.status === 'active' ? '#f0fdf4' : '#fef2f2', color: seller.status === 'active' ? '#15803d' : '#dc2626', padding: '2px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {seller.status === 'active' ? <><CheckCircle size={10} /> Active</> : <><XCircle size={10} /> Suspended</>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right', marginRight: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tickets sold</div>
                        <div style={{ fontWeight: 700, color: '#0f2d5e' }}>{submissions.filter(s => s.seller_id === seller.id && s.payment_status === 'approved').length}</div>
                      </div>
                      <button onClick={() => handleToggleSellerStatus(seller)} className="action-btn" style={{ padding: '10px 20px', background: seller.status === 'active' ? '#fef2f2' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: seller.status === 'active' ? '#dc2626' : 'white', border: seller.status === 'active' ? '1px solid #fecaca' : 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {seller.status === 'active' ? <><UserX size={16} /> Suspend</> : <><UserCheck size={16} /> Activate</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#0f2d5e' }}>Events</h1>
                  <p style={{ color: '#64748b' }}>Manage your charity raffle events.</p>
                </div>
                <button onClick={() => { resetEventForm(); setEditingEvent(null); setShowEventModal(true); }} className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
                  <Plus size={18} /> New Event
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {events.map(event => {
                  const eventSubs = submissions.filter(s => s.event_id === event.id);
                  const approved = eventSubs.filter(s => s.payment_status === 'approved').length;
                  const hasWinner = winners.find(w => w.event_id === event.id);
                  const isPast = new Date(event.deadline) < new Date();
                  return (
                    <div key={event.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', color: '#0f2d5e', margin: 0 }}>{event.title}</h3>
                            {isPast && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 600 }}>ENDED</span>}
                            {hasWinner && <span style={{ background: '#fef9c3', color: '#b45309', padding: '3px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 600 }}>🏆 WINNER SELECTED</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>💰 Birr {Number(event.ticket_price).toFixed(2)} per ticket</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>📅 {new Date(event.deadline).toLocaleDateString()}</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>🎫 {eventSubs.length} submissions ({approved} approved)</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {isPast && approved > 0 && (
                            <button onClick={() => handlePickWinner(event.id)} className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                              <Shuffle size={16} /> {hasWinner ? 'Re-pick' : 'Pick Winner'}
                            </button>
                          )}
                          <button onClick={() => openEditEvent(event)} className="action-btn" style={{ padding: '10px 14px', background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', color: '#475569' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="action-btn" style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <p>No events yet. Create your first charity event!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBMISSIONS */}
          {activeTab === 'submissions' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#0f2d5e', marginBottom: '8px' }}>Submissions</h1>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>All buyer submissions across events.</p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Event', value: selectedEvent, onChange: setSelectedEvent, options: [{ value: 'all', label: 'All Events' }, ...events.map(e => ({ value: e.id, label: e.title }))] },
                  { label: 'Seller', value: selectedSeller, onChange: setSelectedSeller, options: [{ value: 'all', label: 'All Sellers' }, ...sellers.map(s => ({ value: s.id, label: s.name }))] },
                  { label: 'Status', value: selectedStatus, onChange: setSelectedStatus, options: [{ value: 'all', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] },
                ].map(filter => (
                  <select key={filter.label} value={filter.value} onChange={e => filter.onChange(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', cursor: 'pointer' }}>
                    {filter.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8faff', borderBottom: '1px solid #e2e8f0' }}>
                        {['Buyer', 'Event', 'Seller', 'Status', 'Date'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map(sub => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{sub.buyer_name}</td>
                          <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.875rem' }}>{sub.events?.title || '—'}</td>
                          <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.875rem' }}>{sub.users?.name || '—'}</td>
                          <td style={{ padding: '14px 16px' }}>{statusBadge(sub.payment_status)}</td>
                          <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(sub.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredSubmissions.length === 0 && <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No submissions match your filters.</div>}
                </div>
              </div>
            </div>
          )}

          {/* WINNERS */}
          {activeTab === 'winners' && (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#0f2d5e', marginBottom: '8px' }}>🏆 Winners</h1>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Randomly selected winners from approved submissions.</p>
              {winners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                  <Trophy size={56} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '1.1rem' }}>No winners selected yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {winners.map(winner => (
                    <div key={winner.id} style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '2px solid #f59e0b', borderRadius: '20px', padding: '32px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>🏆</div>
                      <div>
                        <div style={{ color: '#92400e', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{winner.events?.title}</div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', fontWeight: 700, color: '#78350f' }}>{winner.submissions?.buyer_name}</div>
                        <div style={{ color: '#92400e', fontSize: '0.85rem', marginTop: '4px' }}>Selected on {new Date(winner.selected_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* EVENT MODAL */}
      {showEventModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', padding: '32px', boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', color: '#0f2d5e', margin: 0 }}>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowEventModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>
            {[
              { label: 'Event Title *', key: 'title', type: 'text', placeholder: 'e.g. Spring Charity Raffle 2025' },
              { label: 'Description', key: 'description', type: 'textarea', placeholder: 'Describe the event...' },
              { label: 'Ticket Price (Birr) *', key: 'ticket_price', type: 'number', placeholder: '10.00' },
              { label: 'Deadline *', key: 'deadline', type: 'datetime-local', placeholder: '' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea value={eventForm[field.key]} onChange={e => setEventForm({ ...eventForm, [field.key]: e.target.value })} placeholder={field.placeholder} rows={3} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', resize: 'vertical', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
                ) : (
                  <input type={field.type} value={eventForm[field.key]} onChange={e => setEventForm({ ...eventForm, [field.key]: e.target.value })} placeholder={field.placeholder} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
            <div style={{ marginTop: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Form Fields</label>
                <button onClick={() => setEventForm({ ...eventForm, fields: [...eventForm.fields, { label: '', field_type: 'text', is_required: true }] })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add Field
                </button>
              </div>
              {eventForm.fields.map((field, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input type="text" placeholder="Field label" value={field.label} onChange={e => { const f = [...eventForm.fields]; f[idx].label = e.target.value; setEventForm({ ...eventForm, fields: f }); }} style={{ flex: 1, padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif" }} />
                  <select value={field.field_type} onChange={e => { const f = [...eventForm.fields]; f[idx].field_type = e.target.value; setEventForm({ ...eventForm, fields: f }); }} style={{ padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="tel">Phone</option>
                    <option value="textarea">Textarea</option>
                  </select>
                  <button onClick={() => setEventForm({ ...eventForm, fields: eventForm.fields.filter((_, i) => i !== idx) })} style={{ padding: '10px', background: '#fef2f2', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}><X size={16} /></button>
                </div>
              ))}
            </div>
            <button onClick={handleSaveEvent} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={18} /> {editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;