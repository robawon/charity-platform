# ❤️ CharityLot — Charity Ticket Selling & Raffle Platform

A full-stack raffle and ticket selling platform for charities. Built with React, Tailwind-inspired CSS-in-JS, and Supabase.

---

## 🗂️ Project Structure

```
charity-platform/
├── public/
│   └── index.html
├── src/
│   ├── contexts/
│   │   └── AuthContext.js       # Auth + role management
│   ├── components/
│   │   ├── Navbar.js            # Top navigation
│   │   └── ProtectedRoute.js   # Role-based guards
│   ├── pages/
│   │   ├── HomePage.js          # Public landing page with events
│   │   ├── LoginPage.js         # Auth (sign in / sign up)
│   │   ├── AdminDashboard.js   # Full admin control panel
│   │   ├── SellerDashboard.js  # Seller QR + submissions
│   │   └── BuyTicketPage.js    # Buyer form (no login needed)
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   └── App.js                   # Routes + providers
├── supabase-schema.sql          # Database schema
├── .env.example                 # Environment variables template
├── vercel.json                  # Vercel SPA routing
└── package.json
```

---

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor**
3. Run the entire contents of `supabase-schema.sql`
4. Copy your **Project URL** and **anon key** from Project Settings → API

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm start
```

### 4. Create Your First Admin

After setup, sign up via `/login` (or use Supabase Auth dashboard), then manually set the role in the database:

```sql
-- In Supabase SQL Editor, after creating your account:
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

Or insert directly:
```sql
INSERT INTO public.users (id, name, email, role)
VALUES ('auth-user-uuid', 'Admin Name', 'admin@example.com', 'admin');
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard → Settings → Environment Variables.

---

## 👥 Roles & Access

| Feature | Admin | Seller | Buyer |
|---------|-------|--------|-------|
| Create/Edit Events | ✅ | ❌ | ❌ |
| Build Form Fields | ✅ | ❌ | ❌ |
| View All Submissions | ✅ | ❌ | ❌ |
| Pick Winners | ✅ | ❌ | ❌ |
| Generate QR Code | ❌ | ✅ | ❌ |
| View Own Submissions | ❌ | ✅ | ❌ |
| Approve/Reject Payments | ❌ | ✅ | ❌ |
| Submit Ticket Form | ❌ | ❌ | ✅ (no login) |

---

## 🔄 System Flow

```
Admin creates event + custom form
        ↓
Seller logs in → selects event → generates QR
        ↓
Buyer scans QR → opens form → fills & submits
        ↓
Submission stored (event_id + seller_id + form_data)
        ↓
Seller approves payment → status = "approved"
        ↓
Admin clicks "Pick Winner" after deadline
        ↓
Random selection from approved submissions only
        ↓
Winner announced in Admin Dashboard
```

---

## 📦 Dependencies

- `react` + `react-dom` — UI framework
- `react-router-dom` — Client-side routing
- `@supabase/supabase-js` — Database, auth, realtime
- `qrcode.react` — QR code generation
- `lucide-react` — Icons

---

## 🔐 Security Features

- Row Level Security (RLS) on all Supabase tables
- Sellers can only see their own submissions
- Admins have full access
- Buyers cannot access dashboards (no auth required for forms)
- Input validation on buyer forms
- Winner selection only from `approved` submissions

---

## ⚡ Real-time Features

- Seller dashboard subscribes to new submissions via Supabase Realtime
- Instant updates when buyers submit forms

---

## 🎨 Design

- Charity-focused color palette: Blue (trust), Green (success), Orange (CTA)
- Fraunces serif for headings, DM Sans for body
- Mobile-first responsive layouts
- Smooth CSS animations and micro-interactions
- Clean card-based UI with soft shadows
