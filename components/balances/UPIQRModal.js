import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, QrCode, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildUPILink } from '../../utils/upiHelper';

export default function UPIQRModal({ amount, fromId, fromName, toId, toName, toUpiId, groupId, onClose, onPaymentSuccess }) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const upiLink = buildUPILink({
    upiId: toUpiId,
    name: toName,
    amount: amount,
    note: `Settling debt to ${toName}`
  });

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(toUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmSettlement = async () => {
    if (timeLeft <= 0) return;
    setConfirming(true);
    setError('');

    try {
      const res = await fetch('/api/payments/manual-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, fromId, fromName, toId, toName, groupId })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to settle debt');
      }

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setConfirming(false);
    }
  };

  const handleRegenerate = () => {
    setTimeLeft(300);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white border border-slate-100 rounded-2xl flex flex-col shadow-2xl p-5 md:p-6 my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-slate-800 font-heading flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6 text-brand" />
            UPI Scan & Pay
          </h3>
          <p className="text-slate-500 text-xs mt-1 font-medium">Scan the QR code with any UPI app to settle the balance</p>
        </div>

        {/* Timer Bar */}
        <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold w-fit mx-auto mb-4 transition-all duration-300 ${
          isExpired 
            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
            : timeLeft < 60
              ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
              : 'bg-emerald-50 text-brand border border-emerald-100'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{isExpired ? 'QR Code Expired' : `Expires in: ${formatTime(timeLeft)}`}</span>
        </div>

        {/* Transaction Info Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 text-center">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Paying To</div>
          <div className="text-lg font-bold text-slate-800">{toName}</div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-sm text-slate-500 font-semibold">{toUpiId}</span>
            <button
              onClick={handleCopyUpi}
              className="text-slate-400 hover:text-brand transition-colors p-1"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-between items-center px-2">
            <span className="text-sm text-slate-600 font-bold">Settlement Amount:</span>
            <span className="text-xl font-black text-brand">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="relative bg-white border-2 border-slate-100 p-2.5 rounded-xl shadow-sm hover:border-brand/30 transition-all duration-300">
            {/* Direct Local QRCode Generation */}
            <div className={`transition-all duration-300 ${isExpired ? 'blur-sm opacity-25 select-none pointer-events-none' : ''}`}>
              <QRCodeSVG
                value={upiLink}
                size={200}
                includeMargin={false}
                className="block"
              />
            </div>

            {/* Expired Overlay */}
            <AnimatePresence>
              {isExpired && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 rounded-xl"
                >
                  <AlertTriangle className="w-8 h-8 text-rose-600 mb-2 filter drop-shadow-md" />
                  <span className="text-xs font-bold text-slate-800 bg-white/95 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    Expired
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-semibold text-center italic">
            Compatible with Google Pay, PhonePe, Paytm, BHIM & more.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-sm mb-4 font-semibold text-center">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isExpired ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleRegenerate}
              className="w-full bg-gradient-main text-white font-extrabold px-4 py-3 rounded-full hover:shadow-glow transition-all flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <RefreshCw className="w-4 h-4 animate-spin-short" />
              Regenerate QR Code
            </motion.button>
          ) : (
            <>
              {/* Mobile Deep Link Redirect */}
              <motion.a
                href={upiLink}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-4 py-3 rounded-full transition-all border border-slate-200 flex items-center justify-center gap-2 text-sm"
              >
                Open in UPI App
                <ExternalLink className="w-4 h-4" />
              </motion.a>

              {/* Confirm Settlement Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleConfirmSettlement}
                disabled={confirming}
                className="w-full bg-gradient-main text-white font-extrabold px-4 py-3 rounded-full hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {confirming ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Confirm & Mark as Settled'
                )}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
