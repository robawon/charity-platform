import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, CheckCircle, Clock, XCircle, Phone, ArrowLeft, Ticket } from 'lucide-react';

const ViewTicketPage = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [event, setEvent] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: fetch submission
        const { data: sub, error: subError } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .single();

        if (subError || !sub) throw new Error('Ticket not found');
        setSubmission(sub);

        // Step 2: fetch event
        if (sub.event_id) {
          const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('id', sub.event_id)
            .single();
          setEvent(eventData);
        }

        // Step 3: fetch seller
        if (sub.seller_id) {
          const { data: sellerData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', sub.seller_id)
            .single();
          setSeller(sellerData);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  const ticketNumber = submission?.ticket_number
    ? String(submission.ticket_number).padStart(4, '0')
    : submission?.id?.slice(0, 8).toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff' }}>
        <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b' }}>Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff', fontFamily: "'DM Sans', sans-serif", padding: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <Ticket size={56} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: "'Fraunces', serif", color: '#0f2d5e', marginBottom: '8px' }}>Ticket Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>This ticket doesn't exist or has been removed.</p>
          <Link to="/seller" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const statusMap = {
    approved: { color: '#15803d', bg: 'linear-gradient(135deg, #15803d, #16a34a)', label: '✅ Ticket Successfully Purchased!', badge: '#f0fdf4', badgeText: '#15803d' },
    pending: { color: '#b45309', bg: 'linear-gradient(135deg, #1e4d9a, #2563eb)', label: '⏳ Pending Approval', badge: '#fffbeb', badgeText: '#b45309' },
    rejected: { color: '#dc2626', bg: 'linear-gradient(135deg, #dc2626, #b91c1c)', label: '❌ Rejected', badge: '#fef2f2', badgeText: '#dc2626' },
  };
  const status = statusMap[submission.payment_status] || statusMap.pending;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%, #f0fdf4 100%)', fontFamily: "'DM Sans', sans-serif", padding: '20px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .ticket-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(37,99,235,0.15); max-width: 420px; width: 100%; margin: 0 auto; animation: fadeUp 0.4s ease; }
        .ticket-notch-left { position: absolute; left: -12px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%, #f0fdf4 100%); border-radius: 50%; }
        .ticket-notch-right { position: absolute; right: -12px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: linear-gradient(160deg, #f0f7ff 0%, #fff7f0 60%, #f0fdf4 100%); border-radius: 50%; }
        @media print { body { background: white !important; } .no-print { display: none !important; } .ticket-card { box-shadow: none !important; } }
      `}</style>

      {/* Back button */}
      <div style={{ maxWidth: '420px', margin: '0 auto 16px' }} className="no-print">
        <a href="/seller" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
          background: 'white', padding: '8px 14px', borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          WebkitTapHighlightColor: 'transparent',
        }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </div>

      <div className="ticket-card">
        {/* Top header */}
        <div style={{ background: status.bg, padding: '28px 28px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                {submission.payment_status === 'approved' ? '✅ Ticket Purchased' : submission.payment_status === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
              </div>
              <h2 style={{ fontFamily: "'Fraunces', serif", color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                {event?.title}
              </h2>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px' }}>
              <Ticket size={24} color="white" />
            </div>
          </div>

          {submission.payment_status === 'approved' && (
            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="white" fill="rgba(255,255,255,0.3)" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>🎉 Ticket Successfully Purchased!</span>
            </div>
          )}
        </div>

        {/* Ticket ID strip */}
        <div style={{ background: '#f8faff', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ticket ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: '#0f2d5e', letterSpacing: '0.1em' }}>
              #{ticketNumber}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700, color: '#0f2d5e' }}>
              Birr {Number(event?.ticket_price).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Buyer info */}
        <div style={{ padding: '20px 28px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Ticket Holder</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>{submission.buyer_name}</div>
            {submission.form_data?.['Phone Number'] && (
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} /> {submission.form_data['Phone Number']}
              </div>
            )}
          </div>

          {/* Extra form data */}
          {submission.form_data && Object.keys(submission.form_data).filter(k => k !== 'Full Name' && k !== 'Phone Number' && k !== 'Message').length > 0 && (
            <div style={{ background: '#f8faff', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              {Object.entries(submission.form_data)
                .filter(([k]) => k !== 'Full Name' && k !== 'Phone Number' && k !== 'Message')
                .map(([key, val]) => val && (
                  <div key={key} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', padding: '2px 0' }}>
                    <span style={{ color: '#94a3b8', minWidth: '80px', flexShrink: 0 }}>{key}:</span>
                    <span style={{ color: '#475569', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Event Date</div>
              <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                {new Date(event?.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
              <span style={{
                background: status.badge, color: status.badgeText,
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                display: 'inline-block',
              }}>
                {submission.payment_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Dashed divider with notches */}
        <div style={{ position: 'relative' }}>
          <div className="ticket-notch-left" />
          <div className="ticket-notch-right" />
          <hr style={{ border: 'none', borderTop: '2px dashed #e2e8f0', margin: '0 20px' }} />
        </div>

        {/* Seller info */}
        {seller && (
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
                <div style={{ color: '#16a34a', fontSize: '0.8rem' }}>📧 {seller.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stamp section */}
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

      {/* Action buttons */}
      <div style={{ maxWidth: '420px', margin: '20px auto 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="no-print">
        {submission.payment_status === 'approved' && (
          <button onClick={() => window.print()} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '13px', background: 'linear-gradient(135deg, #15803d, #16a34a)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(21,128,61,0.3)', fontSize: '0.9rem',
          }}>
            🖨️ Print Ticket
          </button>
        )}
        <a href="/seller" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '13px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: 'white', textDecoration: 'none', borderRadius: '10px',
          fontWeight: 700, boxShadow: '0 4px 16px rgba(37,99,235,0.3)', fontSize: '0.9rem',
          WebkitTapHighlightColor: 'transparent',
        }}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default ViewTicketPage;