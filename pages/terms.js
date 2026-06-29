import Head from 'next/head';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service | SettliX</title>
      </Head>
      <div className="max-w-4xl mx-auto px-6 py-16 text-slate-700">
        <Link href="/" className="text-sm font-semibold text-brand hover:text-emerald-800 transition-colors">
          ← Back to App
        </Link>
        <h1 className="font-heading text-4xl font-extrabold text-slate-800 mt-6 mb-8">Terms of Service</h1>
        
        <div className="space-y-6 bg-white border border-slate-100 shadow-card rounded-2xl p-8">
          <section>
            <h2 className="text-lg font-bold text-slate-850 mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              By using SettliX, you agree to comply with and be bound by the terms outlined below. If you do not agree, please discontinue using the service immediately.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-850 mb-3">2. P2P Settlements Clause</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              SettliX generates direct, offline peer-to-peer UPI QR codes. We do not process payments, route card data, or store financial credentials. All payments happen externally between users.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-850 mb-3">3. Liability Disclaimer</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              SettliX is provided &ldquo;as is&rdquo; by WebTantu. We are not responsible for transaction discrepancies, ledger calculation adjustments, server downtime, database corruption, or failures.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-850 mb-3">4. Amendments</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              We reserve the right to modify these terms or release structural updates without prior individual notification.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
