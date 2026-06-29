import Head from 'next/head';
import Link from 'next/link';

export default function CookiePolicy() {
  return (
    <>
      <Head>
        <title>Cookie Policy | SettliX</title>
      </Head>
      <div className="max-w-4xl mx-auto px-6 py-16 text-slate-700">
        <Link href="/" className="text-sm font-semibold text-brand hover:text-emerald-800 transition-colors">
          ← Back to App
        </Link>
        <h1 className="font-heading text-4xl font-extrabold text-slate-800 mt-6 mb-8">Cookie Policy</h1>
        
        <div className="space-y-6 bg-white border border-slate-100 shadow-card rounded-2xl p-8">
          <section>
            <h2 className="text-lg font-bold text-slate-850 mb-3">1. Use of Cookies</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              SettliX uses simple, essential local cookies and session variables to track group views, browser states, and local caching values.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-850 mb-3">2. Session Management</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Essential session tracking and authentication variables are stored securely to handle persistent user login statuses.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-850 mb-3">3. Managing Settings</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              You can decline cookies by altering your browser options. Please note that disabling essential local storage variables might cause group routing pages to load slowly.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
