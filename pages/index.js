import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Calculator,
  Receipt,
  UserPlus,
  Split,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Smartphone,
  Mail,
  Lock,
  UserCheck
} from 'lucide-react';
import GroupCard from '../components/groups/GroupCard';
import connectDB from '../lib/connectDB';
import Group from '../models/Group';

export default function Home({ groups = [], user = null }) {
  const router = useRouter();
  const [quickName, setQuickName] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Auth States
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'signup'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Load Google Identity Service Client Script
  useEffect(() => {
    let resizeListener;
    let resizeTimeout;

    if (!user && googleClientId) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCallback,
          });

          const renderGoogleButton = () => {
            const container = document.getElementById('google-btn-container');
            if (container) {
              container.innerHTML = '';
              const containerWidth = container.offsetWidth || (window.innerWidth < 380 ? 280 : 340);
              const buttonWidth = Math.min(400, Math.max(200, containerWidth));
              window.google.accounts.id.renderButton(container, {
                theme: 'outline',
                size: 'large',
                width: buttonWidth,
              });
            }
          };

          renderGoogleButton();

          resizeListener = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(renderGoogleButton, 150);
          };
          window.addEventListener('resize', resizeListener);
        }
      };
    }

    return () => {
      if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
      }
      clearTimeout(resizeTimeout);
    };
  }, [user, googleClientId]);

  const handleGoogleCallback = async (response) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await axios.post('/api/auth/google', { credential: response.credential });
      window.location.reload();
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Google Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await axios.post('/api/auth/google', { isMock: true });
      window.location.reload();
    } catch (err) {
      setAuthError('Mock SSO failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (authTab === 'login') {
        await axios.post('/api/auth/login', {
          email: authEmail,
          password: authPassword
        });
      } else {
        await axios.post('/api/auth/register', {
          name: authName,
          email: authEmail,
          password: authPassword
        });
      }
      window.location.reload();
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    router.push(`/groups/new?name=${encodeURIComponent(quickName.trim())}`);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      window.location.reload();
    } catch (err) {
      console.error('Logout failed');
    }
  };

  const faqItems = [
    {
      q: "What is SettliX?",
      a: "SettliX is a group expense tracker built for India. It helps friends, roommates, and travel groups log shared expenses, calculate balances, and settle up cleanly without awkward mental math."
    },
    {
      q: "Does SettliX process payments or hold my money?",
      a: "No. SettliX does not process payments and never touches your funds. Payments happen entirely peer-to-peer outside the app using your favorite UPI tools (GPay, PhonePe, Paytm). SettliX generates the direct QR link and registers the transaction log for the group record once cleared."
    },
    {
      q: "How does the UPI QR expiration timer work?",
      a: "To protect your transaction coordinates and ensure safety, each generated UPI QR code contains a 5-minute countdown clock. Once the timer hits 0:00, the QR code is blurred, settlement prompts are disabled, and you are given a simple action button to regenerate a fresh QR code."
    },
    {
      q: "Can I add friends who aren't registered yet?",
      a: "Yes. You can add any group member using their name and UPI ID during group creation or settings updates. They don't need a registration account to be included in splits and receive clear offline payments."
    },
    {
      q: "How is SettliX different from standard chat screenshots?",
      a: "Screenshots get lost in your photo library, chat histories get messy, and calculating splits later is often forgotten. SettliX keeps an audit trail in one place, computes optimized settlements to minimize total transfers, and lets you clear transactions in real time."
    }
  ];

  return (
    <>
      <Head>
        <title>SettliX</title>
      </Head>

      <div className="relative overflow-hidden bg-bg min-h-screen text-slate-800">
        {/* Decorative background gradients matching SettliX's green identity */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 relative z-10">

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-24">

            {/* Left Column: Welcome or Auth Form */}
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 text-center lg:text-left"
              >
                <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-slate-850">
                  <span className="text-slate-800 block">Expenses</span>
                  <span className="bg-gradient-main bg-clip-text text-transparent block">Sorted?</span>
                </h1>
                <p className="text-xl md:text-2xl font-bold text-slate-700 leading-normal pt-2">
                  Group expenses without the awkwardness.
                </p>
                <p className="text-base text-brand font-semibold max-w-lg leading-relaxed mx-auto lg:mx-0">
                  Add bills manually, generate secure offline UPI QR codes, and keep group balances crystal clear.
                </p>
              </motion.div>

              {user ? (
                /* Authenticated State: Welcome name and Quick Creation Bar */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="max-w-lg mx-auto lg:mx-0 space-y-6"
                >
                  <div className="bg-brand-light border border-brand/20 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-brand uppercase tracking-wider">Welcome Back</span>
                      <h3 className="font-heading text-xl font-bold text-slate-800">Hello, {user.name} 👋</h3>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-white border border-slate-200 hover:border-rose-450 hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-xl text-xs font-bold text-slate-650 transition-all shadow-sm"
                    >
                      Logout
                    </button>
                  </div>

                  <form onSubmit={handleQuickSubmit} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-main rounded-2xl blur opacity-25 group-hover:opacity-40 transition-all duration-350" />
                    <div className="relative bg-white border border-slate-200/80 rounded-2xl p-2 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter group name (e.g. Goa Trip)..."
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        className="flex-1 bg-transparent px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-semibold w-full"
                      />
                      <button
                        type="submit"
                        className="bg-gradient-main text-white font-bold px-6 py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5 whitespace-nowrap shadow-glow w-full sm:w-auto"
                      >
                        <span>Create Group</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* Unauthenticated State: Tabbed Credentials & Google Sign In Card */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="max-w-md mx-auto lg:mx-0 bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 md:p-8 space-y-6 relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-main rounded-2xl blur-sm opacity-5 group-hover:opacity-10 transition-opacity" />

                  {/* Tabs */}
                  <div className="relative z-10 flex border-b border-slate-100 pb-3">
                    <button
                      onClick={() => { setAuthTab('login'); setAuthError(''); }}
                      className={`flex-1 text-center font-heading text-lg font-bold pb-2 border-b-2 transition-all ${authTab === 'login' ? 'border-brand text-brand' : 'border-transparent text-slate-400'
                        }`}
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                      className={`flex-1 text-center font-heading text-lg font-bold pb-2 border-b-2 transition-all ${authTab === 'signup' ? 'border-brand text-brand' : 'border-transparent text-slate-400'
                        }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {authError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-semibold relative z-10">
                      {authError}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleCredentialsSubmit} className="relative z-10 space-y-4">
                    {authTab === 'signup' && (
                      <div className="relative">
                        <UserCheck className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl pl-11 pr-4 py-3 text-slate-800 outline-none w-full transition-all text-xs font-semibold"
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl pl-11 pr-4 py-3 text-slate-800 outline-none w-full transition-all text-xs font-semibold"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl pl-11 pr-4 py-3 text-slate-800 outline-none w-full transition-all text-xs font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-gradient-main text-white font-bold px-7 py-3 rounded-xl hover:scale-[1.01] hover:shadow-glow transition-all duration-200 disabled:opacity-50 text-sm shadow-md"
                    >
                      {authLoading ? 'Please wait...' : authTab === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                  </form>

                  {/* SSO Dividers */}
                  <div className="relative z-10 flex items-center justify-center gap-3 text-xs text-slate-400">
                    <div className="h-px bg-slate-100 flex-grow" />
                    <span>or continue with</span>
                    <div className="h-px bg-slate-100 flex-grow" />
                  </div>

                  {/* SSO Action Buttons */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    {googleClientId ? (
                      /* Real Google Sign-In Container */
                      <div id="google-btn-container" className="w-full flex justify-center" />
                    ) : (
                      /* Simulated Google Testing Button */
                      <button
                        type="button"
                        onClick={handleMockGoogleLogin}
                        disabled={authLoading}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 px-4 py-3 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.77-.63-1.28-1.52-1.79-2.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Simulate Google SSO Login
                      </button>
                    )}
                    {!googleClientId && (
                      <p className="text-[10px] text-slate-400 italic text-center leading-normal">
                        💡 No Google Client ID configured. Using local mock integration.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Stats badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center justify-center lg:justify-start gap-8 pt-4"
              >
                <div>
                  <div className="text-3xl font-black text-brand mb-0.5">100% P2P</div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No Middleman</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <div className="text-3xl font-black text-brand mb-0.5">Offline QR</div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Instant Settle</div>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Visual Interactive Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-[300px] h-[580px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col overflow-hidden"
              >
                {/* Speaker pill */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-900 rounded-full" />
                </div>

                {/* Simulated Screen */}
                <div className="flex-1 bg-slate-50 rounded-[30px] p-4 flex flex-col relative overflow-hidden text-xs">
                  {/* Top Bar spacing */}
                  <div className="h-6 flex justify-between items-center text-[10px] text-slate-500 font-semibold px-2 mb-2">
                    <span>9:41 AM</span>
                    <span className="flex gap-1">🔋 📶</span>
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Goa Trip 🏖️</h4>
                      <p className="text-[10px] text-slate-400 font-medium">3 active members</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-brand" />
                    </div>
                  </div>

                  {/* Mock Expense log */}
                  <div className="space-y-2 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expenses</span>
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-700 block">Dinner at Beach Shack</span>
                          <span className="text-[9px] text-slate-400">Paid by Anvi</span>
                        </div>
                        <span className="font-bold text-slate-800">₹1,200</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-brand w-1/3 h-full rounded-full" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-700 block">Cab Tickets</span>
                          <span className="text-[9px] text-slate-400">Paid by Tannu</span>
                        </div>
                        <span className="font-bold text-slate-800">₹600</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-brand w-1/2 h-full rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Settle summary */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settlement Link</span>
                    <div className="bg-gradient-main text-white rounded-xl p-3 shadow-md">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">Anvi owes Tannu</span>
                        <span className="font-extrabold text-sm">₹200.00</span>
                      </div>
                      <p className="text-[9px] text-emerald-100">Scan QR or Settle Cash</p>
                    </div>
                  </div>

                  {/* Floating Mock UPI QR Popup */}
                  <div className="absolute inset-x-4 bottom-4 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl p-3 shadow-lg flex flex-col items-center space-y-2 animate-bounce">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-[10px] text-slate-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-brand rounded-full animate-ping" />
                        Scan to Pay Tannu
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">04:59</span>
                    </div>

                    {/* Visual QR Simulator */}
                    <div className="w-20 h-20 bg-slate-100 border border-slate-200/80 rounded-lg p-1.5 flex items-center justify-center">
                      <div className="w-full h-full border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[10px]">
                        QR Code
                      </div>
                    </div>

                    <span className="text-[9px] font-bold text-brand uppercase tracking-wider">UPI Offline Settle</span>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>

          {/* Active Groups Section: Accessible to logged in users */}
          {user && (
            <div className="mb-24">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="font-heading text-3xl font-bold text-slate-800">Your Groups</h2>
                  <p className="text-slate-500 text-sm mt-1">Select an active group or create a new one above</p>
                </div>
                <Link
                  href="/groups/new"
                  className="text-brand hover:text-emerald-800 transition-colors font-bold text-sm"
                >
                  + Create New Group
                </Link>
              </div>

              {groups.length === 0 ? (
                <div className="bg-white border border-slate-100 shadow-card rounded-2xl p-12 text-center">
                  <p className="text-slate-400 text-lg mb-6">You don&apos;t have any active groups yet.</p>
                  <Link href="/groups/new" className="text-brand hover:text-emerald-800 transition-colors font-semibold">
                    + Create a new group to get started
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group, index) => (
                    <GroupCard key={group._id} group={group} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Features Grid: Redesigned based on contri.money */}
          <div className="mb-24 bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-heading font-black mb-4 text-center">
                <span className="bg-gradient-main bg-clip-text text-transparent">
                  Built for real group money
                </span>
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
                Because every group has that one person who pays first, two people who forget, and one person who says &quot;kal pakka karta hoon.&quot;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {/* Feature 1 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 hover:border-brand/40 hover:scale-[1.01] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-800">Add Expenses Manually</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Log transactions the normal way. Set details, description, date, and payer. Simple and robust.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 hover:border-brand/40 hover:scale-[1.01] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                  <Zap className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-800">Direct UPI QR Codes</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Generates an offline UPI link from the payer details to let you settle up instantly with zero transaction delay.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 hover:border-brand/40 hover:scale-[1.01] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                  <Clock className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-800">5-Minute Expiry Timer</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Countdown safety limits prevent transaction data reuse. The QR code blurs and locks automatically after 5 minutes.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 hover:border-brand/40 hover:scale-[1.01] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                  <Split className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-800">Equal & Custom Splits</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Decide exactly who is included in each expense. The system will handle divisions and fractional pennies.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 hover:border-brand/40 hover:scale-[1.01] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-800">Safety Cascade Deletes</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Tidy up your workspace. Cleanly delete groups, automatically removing all related expenses from the database.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col space-y-4 hover:border-brand/40 hover:scale-[1.01] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-850">Zero Middleman Fees</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We don&apos;t process transactions, touch your bank cards, or hold funds. Your money stays entirely yours.
                </p>
              </div>

            </div>
          </div>

          {/* Trust Banner Section */}
          <div className="text-center mb-24 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4 text-slate-800 font-semibold">Your money stays outside SettliX</h2>
            <p className="text-slate-500 text-sm md:text-base mb-8">
              SettliX is not a bank or middleman wallet. It simply compiles split sheets and keeps group transactions clean.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand rounded-full" />
                Payments occur outside SettliX
              </span>
              <span className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand rounded-full" />
                Confirm manually before logging
              </span>
              <span className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand rounded-full" />
                Offline UPI QR Generator
              </span>
              <span className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand rounded-full" />
                No middleman wallet delays
              </span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-heading font-bold mb-8 text-center text-slate-800">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none"
                    >
                      <h3 className="font-bold text-slate-800 text-sm md:text-base pr-4">{item.q}</h3>
                      <div className="text-brand">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-3">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  await connectDB();

  // Read cookies manually
  const cookieStr = req.headers.cookie;
  let user = null;

  if (cookieStr) {
    const cookies = Object.fromEntries(
      cookieStr.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );

    if (cookies.session) {
      const { decryptSession } = require('../lib/auth');
      user = decryptSession(cookies.session);
    }
  }

  let groups = [];
  if (user) {
    // Fetch only the groups belonging to this user, plus any legacy groups with no owner
    groups = await Group.find({
      $or: [
        { userId: user.id },
        { userId: { $exists: false } },
        { userId: null }
      ]
    }).sort({ createdAt: -1 }).lean();
  }

  return {
    props: {
      groups: JSON.parse(JSON.stringify(groups)),
      user
    },
  };
}
