<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,40:022c22,70:064e3b,100:0f172a&height=220&section=header&text=SettliX&fontSize=80&fontColor=ffffff&fontAlignY=36&desc=Smart%20Peer-to-Peer%20Expense%20Splitter&descAlignY=55&descSize=20&animation=fadeIn" width="100%"/>

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-00c896?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind--CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vercel](https://img.shields.io/badge/Vercel-Hosted-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

**You went on a group trip. But who owes who, and how do you settle without the hassle?**

SettliX calculates the absolute **minimum transactions** required to balance your group, then generates direct, scan-and-pay **UPI QR codes** pre-filled with the exact amounts.

<br/>

[**Get Started**](#quick-start) · [**How It Works**](#how-it-works) · [**Features**](#features) · [**Tech Stack**](#technology-stack) · [**Local Development**](#local-development)

<br/>

</div>

---

## The Problem

```
Total group bills:   ₹15,400
Split logic:         equally, unequally, or percentage
Settlement process:  ❌ endless manual calculations, back-and-forth messages, wrong UPI transfers
```

Every group trip, shared flat, or dinner outing ends with the same math problem: sorting out the ledger. Traditional splitting tools calculate debts but force you to copy-paste amounts, ask for UPI IDs repeatedly, and make multiple transactions.

SettliX resolves this. It processes your group's transaction history, runs a **Transaction Minimization Algorithm** (reducing the net transactions to the absolute minimum), and lets users settle debts with one click via instant, secure, on-screen UPI QR codes.

---

## How It Works

SettliX is designed for seamless, friction-free group expense splits in 4 simple steps:

```
Create Group 👥  ➔  Log Expenses 💰  ➔  Optimize Debts ⚖️  ➔  Scan & Settle ⚡
```

1. **Create Group:** Open a group ledger, add friends, and associate their UPI IDs.
2. **Log Expenses:** Add bills. Choose to split equally, unequally by custom amounts, or by custom percentages.
3. **Minimize Transactions:** The algorithm calculates the net balances and simplifies payments (e.g., if A owes B ₹500 and B owes C ₹500, A pays C ₹500 directly).
4. **Instant Settlement:** Scan dynamically generated QR codes with Google Pay, PhonePe, Paytm, or BHIM.

---

## Features

| Feature | Description |
|---|---|
| **Optimized Settlement Engine** | Calculates exactly who owes whom using the minimum number of transactions. |
| **Instant UPI QR Codes** | Generates direct checkout QR codes pre-populated with the exact amount, payee name, and payment note. |
| **Flexible Split Types** | Split equally, by specific custom amounts (unequally), or by percentages per member. |
| **Premium Responsive UI** | A fully responsive, modern glassmorphic interface that behaves beautifully on desktop, tablet, and mobile. |
| **CSV & PDF Export** | Download the transaction history as a CSV file or print/save the entire ledger to PDF. |
| **No-Custody P2P Security** | 100% peer-to-peer. SettliX never holds or touches user funds; payments happen directly between bank accounts. |
| **Google SSO Integration** | Secure and easy authentication using Google Single Sign-On (with local mock fallbacks for offline testing). |

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js 14 (Pages Router) | Optimized static rendering, hydration, and routing |
| **Database** | MongoDB + Mongoose | Real-time persistence for groups, users, and expense history |
| **Styling** | Tailwind CSS v3 + Headless UI | Modern layout grid, dynamic cards, and components |
| **Animations** | Framer Motion | Smooth state transitions and micro-interactions |
| **UPI Engine** | Custom Dynamic UPI URI Resolver | Generates standard compliant UPI merchant and peer links |
| **Deployment** | Vercel | Globally distributed hosting with auto CI/CD |

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm
- A MongoDB cluster (Local or MongoDB Atlas)

### Local Development

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/TheAkashKumawat/SettliX.git
   cd expense-splitter
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/settlix?retryWrites=true&w=majority
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=352532278258-u94l4is79ma9j49rr9o2n3b9qtmeh1u7.apps.googleusercontent.com
   ```

4. **Launch Local Server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Build Status

| Module | Status | Description |
|---|---|---|
| Core Engine | ✅ Complete | Multi-split methods, transaction optimization algorithm |
| Responsive Layouts | ✅ Complete | Fully optimized mobile viewport, responsive tables, flex-stacking components |
| UPI Integration | ✅ Complete | Compliant UPI URL schema generator with scan-to-pay QRs |
| Google SSO Auth | ✅ Complete | Integrated Google Authentication with fallback simulation |
| Export Tools | ✅ Complete | CSV download handler, custom PDF media print query rules |

---

<div align="center">

<br/>

Built by [**Akash Kumawat**](https://github.com/TheAkashKumawat) &nbsp;·&nbsp; [GitHub Profile](https://github.com/TheAkashKumawat)

<br/>

*If SettliX helps you split and settle expenses easily, give it a* ⭐

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,40:022c22,70:064e3b,100:0f172a&height=120&section=footer" width="100%"/>

</div>
