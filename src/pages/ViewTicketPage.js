import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, CheckCircle, Phone, ArrowLeft, Ticket, AlertCircle } from 'lucide-react';

const ViewTicketPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [event, setEvent] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!submissionId) {
      setError('No ticket ID provided');
      setLoading(false);
      return;
    }
    fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch submission only first
      const { data: sub, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .maybeSingle();

      if (subError) {
        console.error('Submission error:', subError);
        throw new Error('Could not load ticket: ' + subError.message);
      }

      if (!sub) {
        throw new Error('Ticket not found');
      }

      setSubmission(sub);

      // Fetch event separately
      if (sub.event_id) {
        const { data: ev } = await supabase
          .from('events')
          .select('id, title, ticket_price, deadline')
          .eq('id', sub.event_id)
          .maybeSingle();
        if (ev) setEvent(ev);
      }

      // Fetch seller separately
      if (sub.seller_id) {
        const { data: sl } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', sub.seller_id)
          .maybeSingle();
        if (sl) setSeller(sl);
      }

    } catch (err) {
      console.error('ViewTicket error:', err);
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const ticketNumber = submission?.ticket_number
    ? String(submission.ticket_number).padStart(4, '0')
    : submission?.id?.slice(0, 8).toUpperCase();

  const statusMap = {
    approved: {
      bg: 'linear-gradient(135deg, #15803d, #16a34a)',
      badge: '#f0fdf4', badgeText: '#15803d',
      label: '✅ Ticket Successfully Purchased!',
    },
    pending: {
      bg: 'linear-gradient(135deg, #1e4d9a, #2563eb)',
      badge: '#fffbeb', badgeText: '#b45309',
      label: '⏳ Pending Approval',
    },
    rejected: {
      bg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
      badge: '#fef2f2', badgeText: '#dc2626',
      label: '❌ Rejected',
    },
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff', flexDirection: 'column', gap: '16px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '48px', height: '48px', border: '4px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: '0.95rem' }}>Loading ticket...</p>
        <button
          onClick={fetchData}
          style={{ marginTop: '8px', padding: '8px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#2563eb', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '0.85rem' }}>
          Tap to retry
        </button>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff', fontFamily: 'sans-serif', padding: '1.5rem', flexDirection: 'column', gap: '16px' }}>
        <AlertCircle size={56} color="#ef4444" />
        <h2 style={{ fontFamily: 'serif', color: '#0f2d5e', margin: 0 }}>Ticket Not Found</h2>
        <p style={{ color: '#64748b', textAlign: 'center' }}>{error || 'This ticket does not exist.'}</p>
        <button onClick={fetchData} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 700 }}>
          Retry
        </button>
        <button onClick={() => navigate('/seller')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>← Back to Dashboard</button>
      </div>
    );
  }

  const status = statusMap[submission.payment_status] || statusMap.pending;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%, #f0fdf4 100%)', fontFamily: "'DM Sans', sans-serif", padding: '20px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .ticket-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(37,99,235,0.15); max-width: 420px; width: 100%; margin: 0 auto; animation: fadeUp 0.4s ease; }
        a { -webkit-tap-highlight-color: transparent; }
        button { -webkit-tap-highlight-color: transparent; }
        @media print { body { background: white !important; } .no-print { display: none !important; } .ticket-card { box-shadow: none !important; } }
      `}</style>

      {/* Back button */}
      <div style={{ maxWidth: '420px', margin: '0 auto 16px' }} className="no-print">
        <button onClick={() => navigate('/seller')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600, fontSize: '0.875rem', background: 'white', padding: '8px 14px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="ticket-card">
        {/* Header */}
        <div style={{ background: status.bg, padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                {submission.payment_status === 'approved' ? '✅ Ticket Purchased' : submission.payment_status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
              </div>
              <h2 style={{ fontFamily: "'Fraunces', serif", color: 'white', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                {event?.title || 'Charity Event'}
              </h2>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px' }}>
              <Ticket size={24} color="white" />
            </div>
          </div>
          {submission.payment_status === 'approved' && (
            <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="white" fill="rgba(255,255,255,0.3)" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>🎉 Ticket Successfully Purchased!</span>
            </div>
          )}
        </div>

        {/* Ticket ID */}
        <div style={{ background: '#f8faff', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ticket ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: '#0f2d5e', letterSpacing: '0.1em' }}>#{ticketNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700, color: '#0f2d5e' }}>
              Birr {Number(event?.ticket_price || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Buyer info */}
        <div style={{ padding: '20px 28px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Ticket Holder</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>{submission.buyer_name}</div>
            {submission.form_data?.['Phone Number'] && (
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} /> {submission.form_data['Phone Number']}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Event Date</div>
              <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                {event?.deadline ? new Date(event.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Issued</div>
              <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                {new Date(submission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Status</div>
              <span style={{ background: status.badge, color: status.badgeText, padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block' }}>
                {submission.payment_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ position: 'relative', margin: '0' }}>
          <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', background: 'linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', background: 'linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%)', borderRadius: '50%' }} />
          <hr style={{ border: 'none', borderTop: '2px dashed #e2e8f0', margin: '0 20px' }} />
        </div>

        {/* Seller */}
        {seller && (
          <div style={{ padding: '18px 28px', background: '#f0fdf4' }}>
            <div style={{ color: '#15803d', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>👤 Sold By</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                {seller.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>{seller.name}</div>
                <div style={{ color: '#16a34a', fontSize: '0.8rem' }}>📧 {seller.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stamp */}
        {submission.payment_status === 'approved' && (
          <div style={{ padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', maxWidth: '200px', lineHeight: 1.5 }}>
              This ticket is officially verified and approved by CharityLot
            </div>
            <img src="/chapa.png" alt="Official Stamp" style={{ width: '90px', height: '90px', opacity: 0.85, transform: 'rotate(-12deg)', filter: 'drop-shadow(0 2px 4px rgba(37,99,235,0.2))' }} />
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

      {/* Buttons */}
      <div style={{ maxWidth: '420px', margin: '20px auto 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="no-print">
        {submission.payment_status === 'approved' && (
          <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(21,128,61,0.3)', fontSize: '0.9rem' }}>
            🖨️ Print Ticket
          </button>
        )}
        <button onClick={() => navigate('/seller')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, boxShadow: '0 4px 16px rgba(37,99,235,0.3)', fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", WebkitTapHighlightColor: 'transparent' }}>
          ← Dashboard
        </button>
      </div>
    </div>
  );
};

export default ViewTicketPage;