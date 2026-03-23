import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, CheckCircle, Clock, AlertCircle, Ticket, Phone, User, Hash } from 'lucide-react';

const BuyTicketPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('seller');

  const [event, setEvent] = useState(null);
  const [seller, setSeller] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState('pending');
  const [ticketNumber, setTicketNumber] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, fieldsRes] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).eq('is_active', true).single(),
          supabase.from('form_fields').select('*').eq('event_id', eventId).order('sort_order'),
        ]);
        if (eventRes.error) throw new Error('Event not found');
        setEvent(eventRes.data);
        setFormFields(fieldsRes.data || []);

        // Fetch seller info
        if (sellerId) {
          const { data: sellerData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', sellerId)
            .single();
          setSeller(sellerData);
        }

        const init = {};
        (fieldsRes.data || []).forEach(f => { init[f.label] = ''; });
        if ((fieldsRes.data || []).length === 0) {
          init['Full Name'] = '';
          init['Phone Number'] = '';
          init['Message'] = '';
        }
        setFormData(init);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventId, sellerId]);

  // Poll for submission status after submitted
  useEffect(() => {
    if (!submissionId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('submissions')
        .select('payment_status, ticket_number')
        .eq('id', submissionId)
        .single();
      if (data?.payment_status) {
        setSubmissionStatus(data.payment_status);
        if (data.ticket_number) setTicketNumber(data.ticket_number);
        if (data.payment_status === 'approved' || data.payment_status === 'rejected') {
          clearInterval(interval);
        }
      }
    }, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [submissionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    for (const field of formFields) {
      if (field.is_required && !formData[field.label]?.trim()) {
        setError(`"${field.label}" is required.`);
        setSubmitting(false);
        return;
      }
    }
    const buyerName = formData['Full Name'] || formData[formFields[0]?.label] || 'Anonymous';
    try {
      const { data, error: subError } = await supabase.from('submissions').insert([{
        event_id: eventId,
        seller_id: sellerId || null,
        buyer_name: buyerName,
        form_data: formData,
        payment_status: 'pending',
      }]).select().single();
      if (subError) throw new Error(subError.message);
      setSubmissionId(data.id);
      setTicketNumber(data.ticket_number);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (type) => ({
    width: '100%', padding: type === 'textarea' ? '12px 14px' : '14px',
    border: '1.5px solid #dbeafe', borderRadius: '12px',
    fontSize: '0.95rem', color: '#1e293b', background: 'white',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  });

  const ticketId = ticketNumber ? String(ticketNumber).padStart(4, '0') : (submissionId ? submissionId.slice(0, 8).toUpperCase() : '');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f7ff, #fff7f0)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff', fontFamily: "'DM Sans', sans-serif", padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <AlertCircle size={56} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: "'Fraunces', serif", color: '#0f2d5e', marginBottom: '8px' }}>Event Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>This event may have ended or doesn't exist.</p>
          <Link to="/" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const isPast = event && new Date(event.deadline) < new Date();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%, #f0fdf4 100%)', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249,115,22,0.4) !important; }
        .submit-btn { transition: all 0.3s ease; }

        /* Ticket styles */
        .ticket-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(37,99,235,0.15);
          position: relative;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
        }
        .ticket-notch-left {
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background: linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%, #f0fdf4 100%);
          border-radius: 50%;
        }
        .ticket-notch-right {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background: linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%, #f0fdf4 100%);
          border-radius: 50%;
        }
        .ticket-divider {
          border: none;
          border-top: 2px dashed #e2e8f0;
          margin: 0 20px;
        }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .ticket-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>

      {submitted ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '520px', animation: 'fadeUp 0.5s ease' }}>

            {/* Status banner */}
            {submissionStatus === 'pending' && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px',
                animation: 'pulse 2s ease infinite',
              }} className="no-print">
                <Clock size={18} color="#b45309" />
                <div>
                  <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.875rem' }}>Waiting for seller approval...</div>
                  <div style={{ color: '#d97706', fontSize: '0.75rem' }}>This page updates automatically</div>
                </div>
              </div>
            )}

            {submissionStatus === 'rejected' && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '12px', padding: '16px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }} className="no-print">
                <AlertCircle size={20} color="#dc2626" />
                <div>
                  <div style={{ fontWeight: 700, color: '#dc2626' }}>Payment Rejected</div>
                  <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>Please contact the seller for more information.</div>
                </div>
              </div>
            )}

            {/* TICKET CARD */}
            <div className="ticket-card">

              {/* Ticket top — approved = green, pending = blue */}
              <div style={{
                background: submissionStatus === 'approved'
                  ? 'linear-gradient(135deg, #15803d, #16a34a)'
                  : submissionStatus === 'rejected'
                  ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                  : 'linear-gradient(135deg, #1e4d9a, #2563eb)',
                padding: '28px 28px 24px',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                      {submissionStatus === 'approved' ? '✅ Ticket Purchased' : submissionStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                    </div>
                    <h2 style={{ fontFamily: "'Fraunces', serif", color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                      {event?.title}
                    </h2>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
                    <Ticket size={24} color="white" />
                  </div>
                </div>

                {submissionStatus === 'approved' && (
                  <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="white" fill="rgba(255,255,255,0.3)" />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>
                      🎉 Ticket Successfully Purchased!
                    </span>
                  </div>
                )}
              </div>

              {/* Ticket ID strip */}
              <div style={{ background: '#f8faff', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ticket ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 700, color: '#0f2d5e', letterSpacing: '0.1em' }}>
                    #{ticketId}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 700, color: '#0f2d5e' }}>
                    Birr {Number(event?.ticket_price).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Buyer info */}
              <div style={{ padding: '20px 28px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Ticket Holder</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{formData['Full Name'] || formData[formFields[0]?.label] || 'Anonymous'}</div>
                  {formData['Phone Number'] && (
                    <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} /> {formData['Phone Number']}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Event Date</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                      {new Date(event?.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Issued</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashed divider with notches */}
              <div style={{ position: 'relative' }}>
                <div className="ticket-notch-left" />
                <div className="ticket-notch-right" />
                <hr className="ticket-divider" />
              </div>

              {/* Seller info — shown after approval */}
              {submissionStatus === 'approved' && seller && (
                <div style={{ padding: '20px 28px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
                  <div style={{ color: '#15803d', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    👤 Sold By
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                    }}>
                      {seller.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>{seller.name}</div>
                      <div style={{ color: '#16a34a', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        📧 {seller.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending seller info placeholder */}
              {submissionStatus === 'pending' && (
                <div style={{ padding: '16px 28px', background: '#f8faff' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }}>
                    Seller contact details will appear here once payment is approved
                  </div>
                </div>
              )}

              {/* CHAPA STAMP - shown on approved tickets */}
              {submissionStatus === 'approved' && (
                <div style={{
                  padding: '16px 28px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', background: 'white',
                  borderTop: '1px solid #e2e8f0',
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', maxWidth: '200px', lineHeight: 1.5 }}>
                    This ticket is officially verified and approved by CharityLot
                  </div>
                  <div style={{ position: 'relative' }}>
                    <img
                      src="/chapa.png"
                      alt="Official Stamp"
                      style={{
                        width: '90px', height: '90px',
                        opacity: 0.85,
                        transform: 'rotate(-12deg)',
                        filter: 'drop-shadow(0 2px 4px rgba(37,99,235,0.2))',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: '14px 28px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/du-charity-logo.png" alt="DU Charity" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                  <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Heart size={14} fill="#ef4444" color="#ef4444" />
                    <span style={{ fontFamily: "'Fraunces', serif", color: '#0f2d5e', fontWeight: 700, fontSize: '0.9rem' }}>CharityLot</span>
                  </div>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>100% goes to charity</div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }} className="no-print">
              {submissionStatus === 'approved' && (
                <button onClick={() => window.print()} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', background: 'linear-gradient(135deg, #15803d, #16a34a)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(21,128,61,0.3)',
                }}>
                  🖨️ Print Ticket
                </button>
              )}
              <Link to="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white', textDecoration: 'none', borderRadius: '10px',
                fontWeight: 700, boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              }}>
                ← Back to Home
              </Link>
            </div>

            {submissionStatus === 'pending' && (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '16px' }} className="no-print">
                Keep this page open — it updates automatically when approved
              </p>
            )}
          </div>
        </div>
      ) : (
        /* FORM */
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeUp 0.4s ease' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '24px' }}>
              <img src="/du-charity-logo.png" alt="DU Charity" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              <div style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={18} color="white" fill="white" />
                </div>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 700, color: '#0f2d5e' }}>CharityLot</span>
              </div>
            </Link>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef3c7', color: '#d97706', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px' }}>
              ❤️ You are supporting a good cause
            </div>

            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#0f2d5e', fontWeight: 900, marginBottom: '8px' }}>{event?.title}</h1>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: 'white', border: '1px solid #dbeafe', color: '#2563eb', padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ticket size={14} /> Birr {Number(event?.ticket_price).toFixed(2)} per ticket
              </span>
              <span style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Ends {new Date(event?.deadline).toLocaleDateString()}
              </span>
            </div>

            {/* Show seller name on form */}
            {seller && (
              <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: '50px' }}>
                <User size={14} color="#15803d" />
                <span style={{ color: '#15803d', fontSize: '0.82rem', fontWeight: 600 }}>Sold by {seller.name}</span>
              </div>
            )}
          </div>

          {isPast && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '20px', color: '#dc2626', fontWeight: 600 }}>
              ⚠️ This event has ended. Submissions are no longer accepted.
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 20px 60px rgba(37,99,235,0.1)', padding: '32px', animation: 'fadeUp 0.4s ease 0.1s both' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {formFields.length === 0 ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={formData['Full Name'] || ''} onChange={e => setFormData({ ...formData, 'Full Name': e.target.value })} placeholder="Enter your full name" style={inputStyle('text')} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="tel" required value={formData['Phone Number'] || ''} onChange={e => setFormData({ ...formData, 'Phone Number': e.target.value })} placeholder="+251 912 345 678" style={inputStyle('tel')} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Message <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></label>
                    <textarea value={formData['Message'] || ''} onChange={e => setFormData({ ...formData, 'Message': e.target.value })} placeholder="Why are you supporting this cause?" rows={3} style={inputStyle('textarea')} />
                  </div>
                </>
              ) : (
                formFields.map(field => (
                  <div key={field.id} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                      {field.label} {field.is_required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {field.field_type === 'textarea' ? (
                      <textarea required={field.is_required} value={formData[field.label] || ''} onChange={e => setFormData({ ...formData, [field.label]: e.target.value })} placeholder={`Enter your ${field.label.toLowerCase()}`} rows={3} style={inputStyle('textarea')} />
                    ) : (
                      <input type={field.field_type} required={field.is_required} value={formData[field.label] || ''} onChange={e => setFormData({ ...formData, [field.label]: e.target.value })} placeholder={`Enter your ${field.label.toLowerCase()}`} style={inputStyle(field.field_type)} />
                    )}
                  </div>
                ))
              )}

              <button type="submit" disabled={submitting || isPast} className="submit-btn" style={{ width: '100%', padding: '16px', background: (submitting || isPast) ? '#94a3b8' : 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', border: 'none', borderRadius: '14px', fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: '1.05rem', cursor: (submitting || isPast) ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                {submitting ? (
                  <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Submitting...</>
                ) : (
                  <>❤️ Submit &amp; Support</>
                )}
              </button>
            </form>
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '16px' }}>🔒 Your information is secure and only used for this raffle</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap', animation: 'fadeUp 0.4s ease 0.2s both' }}>
            {['✅ 100% goes to charity', '🔒 Secure submission', '🎯 Fair random draw'].map(badge => (
              <span key={badge} style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>{badge}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyTicketPage;