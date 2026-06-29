import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    axios.get('/api/auth/me')
      .then(res => {
        if (res.data.loggedIn) {
          setCurrentUser(res.data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, [router.asPath]); // Re-fetch on route transitions

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setCurrentUser(null);
      router.push('/');
    } catch (err) {
      console.error('Logout failed');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="SettliX Logo" className="h-11 w-auto object-contain" />
        </Link>
        
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                <User className="w-3.5 h-3.5 text-brand" />
                <span>{currentUser.name}</span>
              </div>
              <Link href="/groups/new" className="bg-white border border-slate-200 hover:border-brand px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm transition-all">
                + New Group
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-full hover:bg-rose-50"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="bg-white border border-slate-200 hover:border-brand px-5 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
