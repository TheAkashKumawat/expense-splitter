import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Activity, FileSpreadsheet, QrCode, Smartphone, Printer } from 'lucide-react';
import TransactionHistory from './TransactionHistory';
import CalculationBreakdown from './CalculationBreakdown';
import SpendAnalytics from '../analytics/SpendAnalytics';
import { exportToCSV } from '../../utils/exportCSV';
import UPIQRModal from './UPIQRModal';
import { buildUPILink } from '../../utils/upiHelper';

export default function BalanceSummary({ group, expenses, onManageGroup }) {
  const [balances, setBalances] = useState(null);
  const [debts, setDebts] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [activeUpiDebt, setActiveUpiDebt] = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!group?._id) return;
    try {
      const res = await axios.get(`/api/expenses/balances?groupId=${group._id}`);
      setBalances(res.data.balances);
      setDebts(res.data.debts);
      setSettlements(res.data.settlements || []);
    } catch (err) {
      console.error('Failed to fetch balances', err);
    } finally {
      setLoading(false);
    }
  }, [group?._id]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances, expenses]);

  const handleManualSettleClick = async (debt) => {
    if (confirm(`Are you sure you want to mark the debt of ₹${debt.amount.toFixed(2)} from ${debt.from} to ${debt.to} as settled?`)) {
      try {
        const res = await fetch('/api/payments/manual-settle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: debt.amount,
            fromId: debt.fromId,
            fromName: debt.from,
            toId: debt.toId,
            toName: debt.to,
            groupId: group._id
          })
        });
        if (res.ok) {
          fetchBalances();
        } else {
          alert('Failed to settle debt');
        }
      } catch (err) {
        alert('Error settling debt');
      }
    }
  };

  const getWhatsAppReminderLink = (debt) => {
    const appUrl = typeof window !== 'undefined' ? window.location.href : '';
    const message = `Hey ${debt.from}! Just a quick reminder that you owe ${debt.to} ₹${debt.amount.toFixed(2)} in our group "${group.name}". Settle it here: ${appUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const handleUpiDeepLinkClick = (e, debt, upiId) => {
    const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      setActiveUpiDebt({ ...debt, upiId });
    }
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups to print the statement.');
      return;
    }

    const today = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const activeDuesHtml = debts.length === 0
      ? '<p class="empty-state">All settled up! 🎉</p>'
      : debts.map(debt => `
        <div class="dues-row">
          <span><strong>${debt.from}</strong> owes <strong>${debt.to}</strong></span>
          <span class="amount">₹${debt.amount.toFixed(2)}</span>
        </div>
      `).join('');

    const balancesHtml = group.members.map(member => {
      const bal = balances?.[member._id]?.amount || 0;
      const classStr = bal >= 0 ? 'pos' : 'neg';
      const prefix = bal > 0 ? '+' : '';
      return `
        <div class="balance-row">
          <span>${member.name}</span>
          <span class="balance-badge ${classStr}">${prefix}₹${bal.toFixed(2)}</span>
        </div>
      `;
    }).join('');

    const expensesHtml = expenses.length === 0
      ? '<p class="empty-state">No expenses added yet.</p>'
      : expenses.map(exp => `
        <tr class="expense-tr">
          <td>${new Date(exp.createdAt).toLocaleDateString()}</td>
          <td><strong>${exp.description}</strong><br><small class="text-muted">${exp.category}</small></td>
          <td>${exp.paidByName}</td>
          <td class="amount text-right">₹${exp.totalAmount.toFixed(2)}</td>
        </tr>
      `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SettliX Group Statement - ${group.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #334155;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #10b981;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
          }
          .meta-info {
            font-size: 12px;
            color: #64748b;
            text-align: right;
          }
          .section {
            margin-bottom: 35px;
          }
          .section-title {
            font-size: 14px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: #475569;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .dues-row, .balance-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 12px;
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .amount {
            font-weight: 850;
            color: #0f172a;
          }
          .balance-badge {
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 12px;
          }
          .pos {
            background-color: #ecfdf5;
            color: #065f46;
          }
          .neg {
            background-color: #fef2f2;
            color: #991b1b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            text-align: left;
            padding: 10px;
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .text-right {
            text-align: right;
          }
          .text-muted {
            color: #64748b;
            font-size: 11px;
          }
          .empty-state {
            color: #94a3b8;
            font-style: italic;
            font-size: 13px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">SettliX</div>
            <h1 class="title">${group.name} Statement</h1>
          </div>
          <div class="meta-info">
            Date Generated: ${today}<br>
            Currency: INR (₹)
          </div>
        </div>

        <div class="section">
          <div class="section-title">Active Dues & Settlements</div>
          ${activeDuesHtml}
        </div>

        <div class="section">
          <div class="section-title">Individual Balances</div>
          ${balancesHtml}
        </div>

        <div class="section">
          <div class="section-title">Complete Expense Log</div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%">Date</th>
                <th style="width: 45%">Description</th>
                <th style="width: 25%">Paid By</th>
                <th style="width: 15%" class="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expensesHtml}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generated via SettliX • SECURE • SETTLE • SUCCEED
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="text-center text-slate-500 py-8 font-medium">Calculating balances...</div>;
  }

  return (
    <div className="space-y-6 sticky top-24">
      <div className="bg-white border border-slate-100 shadow-card rounded-2xl p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6 border-b border-slate-50 pb-4">
          <h3 className="font-heading text-xl font-bold text-slate-800">Settlements</h3>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setShowAuditModal(true)}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-brand border border-emerald-200 px-3 py-1.5 rounded-full transition-all duration-200 font-bold flex items-center gap-1 shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              Audit Trail
            </button>
            <button
              onClick={() => exportToCSV(expenses, group.name)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors font-semibold flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handlePrintPDF}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors font-semibold flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Print PDF
            </button>
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="text-center text-slate-400 py-8 font-medium">
            <p>All settled up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map((debt, index) => {
              const recipient = group.members.find(m => m._id === debt.toId);
              const upiId = recipient?.upiId;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-4"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <div className="text-sm text-slate-700 font-medium break-words max-w-[70%]">
                      <span className="font-bold text-rose-600">{debt.from}</span>
                      <span className="text-slate-400 mx-1.5 font-normal">owes</span>
                      <span className="font-bold text-emerald-700">{debt.to}</span>
                    </div>
                    <div className="font-extrabold text-slate-800 text-right whitespace-nowrap">₹{debt.amount.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-3">
                    {upiId ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setActiveUpiDebt({ ...debt, upiId })}
                            className="bg-gradient-main text-white font-bold py-2.5 rounded-xl hover:shadow-glow transition-all duration-200 flex sm:flex-col items-center justify-center gap-2 sm:gap-1 text-xs shadow-sm w-full"
                            title="Pay via UPI QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Scan QR</span>
                          </motion.button>
                          
                          <motion.a
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            href={buildUPILink({ upiId, name: debt.to, amount: debt.amount, note: `Settling to ${debt.to}` })}
                            onClick={(e) => handleUpiDeepLinkClick(e, debt, upiId)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-[10px] flex sm:flex-col items-center justify-center gap-2 sm:gap-1 shadow-sm w-full"
                            title="Pay using Google Pay"
                          >
                            <img src="https://img.icons8.com/color/48/google-pay.png" alt="Google Pay Logo" className="w-5 h-5 object-contain" />
                            <span>Google Pay</span>
                          </motion.a>

                          <motion.a
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            href={buildUPILink({ upiId, name: debt.to, amount: debt.amount, note: `Settling to ${debt.to}` })}
                            onClick={(e) => handleUpiDeepLinkClick(e, debt, upiId)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-[10px] flex sm:flex-col items-center justify-center gap-2 sm:gap-1 shadow-sm w-full"
                            title="Pay using PhonePe"
                          >
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-[#5f259f]">
                              <title>PhonePe</title>
                              <path d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
                            </svg>
                            <span>PhonePe</span>
                          </motion.a>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={getWhatsAppReminderLink(debt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-grow bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                            Remind
                          </a>
                          <button
                            onClick={() => handleManualSettleClick(debt)}
                            className="flex-grow bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-1.5"
                          >
                            Settle Manually
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleManualSettleClick(debt)}
                          className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-755 font-extrabold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                        >
                          Settle Manually (Cash)
                        </motion.button>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={getWhatsAppReminderLink(debt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                            Remind
                          </a>
                          {onManageGroup && (
                            <button
                              onClick={onManageGroup}
                              className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-850 font-bold py-2 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              Add UPI ID
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="font-bold text-slate-700 mb-4">Individual Balances</h4>
          <div className="space-y-3">
            {group.members.map(member => {
              const balanceObj = balances?.[member._id];
              const amount = balanceObj ? balanceObj.amount : 0;
              if (Math.abs(amount) < 0.01) return null;
              
              return (
                <div key={member._id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">{member.name}</span>
                  <span className={amount > 0 ? 'bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full text-sm' : 'bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-full text-sm'}>
                    {amount > 0 ? '+' : ''}₹{amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SpendAnalytics expenses={expenses} />

      <TransactionHistory settlements={settlements} />

      <AnimatePresence>
        {showAuditModal && (
          <CalculationBreakdown
            group={group}
            expenses={expenses}
            settlements={settlements}
            onClose={() => setShowAuditModal(false)}
          />
        )}
        {activeUpiDebt && (
          <UPIQRModal
            amount={activeUpiDebt.amount}
            fromId={activeUpiDebt.fromId}
            fromName={activeUpiDebt.from}
            toId={activeUpiDebt.toId}
            toName={activeUpiDebt.to}
            toUpiId={activeUpiDebt.upiId}
            groupId={group._id}
            onClose={() => setActiveUpiDebt(null)}
            onPaymentSuccess={fetchBalances}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
