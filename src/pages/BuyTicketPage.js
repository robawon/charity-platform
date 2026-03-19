import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, CheckCircle, Clock, AlertCircle, Ticket } from 'lucide-react';

const BuyTicketPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('seller');

  const [event, setEvent] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
        // Init form state
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
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate required fields
    for (const field of formFields) {
      if (field.is_required && !formData[field.label]?.trim()) {
        setError(`"${field.label}" is required.`);
        setSubmitting(false);
        return;
      }
    }

    const buyerName = formData['Full Name'] || formData[formFields[0]?.label] || 'Anonymous';

    try {
      const { error: subError } = await supabase.from('submissions').insert([{
        event_id: eventId,
        seller_id: sellerId || null,
        buyer_name: buyerName,
        form_data: formData,
        payment_status: 'pending',
      }]);
      if (subError) throw subError;
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        input:focus, textarea:focus, select:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249,115,22,0.4) !important; }
        .submit-btn { transition: all 0.3s ease; }
      `}</style>

      {submitted ? (
        /* SUCCESS */
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '56px 40px',
            maxWidth: '480px', width: '100%', textAlign: 'center',
            boxShadow: '0 30px 80px rgba(37,99,235,0.12)',
            animation: 'fadeUp 0.5s ease',
          }}>
            <div style={{ animation: 'bounce 1s ease infinite', marginBottom: '24px' }}>
              <CheckCircle size={72} color="#22c55e" style={{ margin: '0 auto' }} />
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2.2rem', color: '#0f2d5e', marginBottom: '12px', fontWeight: 900 }}>
              Thank You! ❤️
            </h1>
            <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Your ticket submission has been received. You're supporting a great cause!<br /><br />
              The seller will review and approve your payment shortly.
            </p>

            <div style={{
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              borderRadius: '14px', padding: '20px',
              border: '1px solid #bfdbfe', marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <Clock size={20} color="#2563eb" />
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a5f' }}>Status: Awaiting Approval</div>
                  <div style={{ color: '#3b82f6', fontSize: '0.8rem' }}>You'll be notified once confirmed</div>
                </div>
              </div>
            </div>

            <Link to="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', textDecoration: 'none', borderRadius: '12px',
              fontWeight: 700, boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
            }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      ) : (
        /* FORM */
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 1.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeUp 0.4s ease' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={18} color="white" fill="white" />
              </div>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 700, color: '#0f2d5e' }}>CharityLot</span>
            </Link>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#fef3c7', color: '#d97706', padding: '8px 16px',
              borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px',
            }}>
              ❤️ You are supporting a good cause
            </div>

            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#0f2d5e', fontWeight: 900, marginBottom: '8px' }}>
              {event?.title}
            </h1>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: 'white', border: '1px solid #dbeafe',
                color: '#2563eb', padding: '6px 14px', borderRadius: '50px',
                fontSize: '0.85rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Ticket size={14} /> ${Number(event?.ticket_price).toFixed(2)} per ticket
              </span>
              <span style={{
                background: 'white', border: '1px solid #e2e8f0',
                color: '#64748b', padding: '6px 14px', borderRadius: '50px',
                fontSize: '0.85rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Clock size={14} /> Ends {new Date(event?.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>

          {isPast && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
              padding: '16px', textAlign: 'center', marginBottom: '20px', color: '#dc2626',
              fontWeight: 600,
            }}>
              ⚠️ This event has ended. Submissions are no longer accepted.
            </div>
          )}

          {/* Form card */}
          <div style={{
            background: 'white', borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(37,99,235,0.1)',
            padding: '32px', animation: 'fadeUp 0.4s ease 0.1s both',
          }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                color: '#dc2626', fontSize: '0.875rem',
              }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {formFields.length === 0 ? (
                /* Default fields: Full Name, Phone, Message (no email) */
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text" required
                      value={formData['Full Name'] || ''}
                      onChange={e => setFormData({ ...formData, 'Full Name': e.target.value })}
                      placeholder="Enter your full name"
                      style={inputStyle('text')}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                      Phone Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel" required
                      value={formData['Phone Number'] || ''}
                      onChange={e => setFormData({ ...formData, 'Phone Number': e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      style={inputStyle('tel')}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                      Message <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                      value={formData['Message'] || ''}
                      onChange={e => setFormData({ ...formData, 'Message': e.target.value })}
                      placeholder="Why are you supporting this cause?"
                      rows={3}
                      style={inputStyle('textarea')}
                    />
                  </div>
                </>
              ) : (
                formFields.map(field => (
                  <div key={field.id} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                      {field.label} {field.is_required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {field.field_type === 'textarea' ? (
                      <textarea
                        required={field.is_required}
                        value={formData[field.label] || ''}
                        onChange={e => setFormData({ ...formData, [field.label]: e.target.value })}
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        rows={3}
                        style={inputStyle('textarea')}
                      />
                    ) : (
                      <input
                        type={field.field_type}
                        required={field.is_required}
                        value={formData[field.label] || ''}
                        onChange={e => setFormData({ ...formData, [field.label]: e.target.value })}
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        style={inputStyle(field.field_type)}
                      />
                    )}
                  </div>
                ))
              )}

              <button
                type="submit"
                disabled={submitting || isPast}
                className="submit-btn"
                style={{
                  width: '100%', padding: '16px',
                  background: (submitting || isPast) ? '#94a3b8' : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white', border: 'none', borderRadius: '14px',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 800,
                  fontSize: '1.05rem', cursor: (submitting || isPast) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(249,115,22,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}>
                {submitting ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  <>❤️ Submit &amp; Support</>
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '16px' }}>
              🔒 Your information is secure and only used for this raffle
            </p>
          </div>

          {/* Trust badges */}
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
