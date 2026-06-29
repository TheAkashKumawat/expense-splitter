import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function CalculationBreakdown({ group, expenses = [], settlements = [], onClose }) {
  const [selectedMemberId, setSelectedMemberId] = useState(group.members[0]?._id || '');

  // Calculate detailed ledger between selectedMember (A) and another member (B)
  const getLedgerForMember = (memberAId) => {
    const ledger = {};

    group.members.forEach(m => {
      if (m._id !== memberAId) {
        ledger[m._id] = {
          memberName: m.name,
          transactions: [],
          netBalance: 0
        };
      }
    });

    // 1. Process Expenses
    expenses.forEach(exp => {
      const payerId = exp.paidById;
      const payerName = exp.paidByName;
      const rate = exp.exchangeRate || 1;

      if (payerId === memberAId) {
        exp.splits.forEach(split => {
          if (split.memberId !== memberAId && ledger[split.memberId]) {
            const baseAmount = split.amount * rate;
            const desc = `You paid for "${exp.description}"${exp.currency && exp.currency !== 'INR' ? ` (${exp.currency} ${split.amount.toFixed(2)})` : ''}`;
            ledger[split.memberId].transactions.push({
              id: `${exp._id}-${split._id}`,
              type: 'expense_share',
              description: desc,
              amount: baseAmount,
              direction: 'plus',
              date: exp.createdAt
            });
            ledger[split.memberId].netBalance += baseAmount;
          }
        });
      } else {
        const splitForA = exp.splits.find(s => s.memberId === memberAId);
        if (splitForA && ledger[payerId]) {
          const baseAmount = splitForA.amount * rate;
          const desc = `"${exp.description}" (paid by ${payerName})${exp.currency && exp.currency !== 'INR' ? ` (${exp.currency} ${splitForA.amount.toFixed(2)})` : ''}`;
          ledger[payerId].transactions.push({
            id: `${exp._id}-${splitForA._id}`,
            type: 'expense_share',
            description: desc,
            amount: baseAmount,
            direction: 'minus',
            date: exp.createdAt
          });
          ledger[payerId].netBalance -= baseAmount;
        }
      }
    });

    // 2. Process Settlements
    settlements.forEach(settlement => {
      if (settlement.status !== 'completed') return;

      const fromId = settlement.fromId;
      const toId = settlement.toId;

      if (fromId === memberAId && ledger[toId]) {
        ledger[toId].transactions.push({
          id: settlement._id,
          type: 'settlement',
          description: `You sent a payment to ${settlement.toName}`,
          amount: settlement.amount,
          direction: 'plus',
          date: settlement.completedAt || settlement.createdAt
        });
        ledger[toId].netBalance += settlement.amount;
      }
      else if (toId === memberAId && ledger[fromId]) {
        ledger[fromId].transactions.push({
          id: settlement._id,
          type: 'settlement',
          description: `${settlement.fromName} sent you a payment`,
          amount: settlement.amount,
          direction: 'minus',
          date: settlement.completedAt || settlement.createdAt
        });
        ledger[fromId].netBalance -= settlement.amount;
      }
    });

    Object.keys(ledger).forEach(id => {
      ledger[id].transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return ledger;
  };

  const currentLedger = getLedgerForMember(selectedMemberId);

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-100 rounded-2xl flex flex-col shadow-2xl my-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 font-heading">Calculation Audit Trail</h3>
            <p className="text-slate-500 text-sm mt-1">See exact breakdowns of transactions between group members</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 bg-slate-200/60 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Selector */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-slate-600 font-semibold text-sm">Select Member to Audit:</span>
          <div className="flex flex-wrap gap-2">
            {group.members.map(member => (
              <button
                key={member._id}
                onClick={() => setSelectedMemberId(member._id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  selectedMemberId === member._id
                    ? 'bg-gradient-main text-white shadow-glow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Ledger Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {Object.keys(currentLedger).length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-semibold">No other members in this group to compare.</div>
          ) : (
            Object.keys(currentLedger).map(memberBId => {
              const audit = currentLedger[memberBId];
              const isBalanceZero = Math.abs(audit.netBalance) < 0.01;
              const doesBOweA = audit.netBalance > 0;
              const roundedBalance = Math.abs(audit.netBalance).toFixed(2);

              return (
                <div key={memberBId} className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                  {/* Summary Bar */}
                  <div className="p-4 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100">
                    <span className="font-bold text-lg text-slate-800 font-heading">
                      With {audit.memberName}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                      isBalanceZero 
                        ? 'bg-slate-200 text-slate-700' 
                        : doesBOweA 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isBalanceZero 
                        ? 'Settle up' 
                        : doesBOweA 
                          ? `${audit.memberName} owes you ₹${roundedBalance}` 
                          : `You owe ${audit.memberName} ₹${roundedBalance}`
                      }
                    </span>
                  </div>

                  {/* Transaction Ledger Table */}
                  <div className="p-4">
                    {audit.transactions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4 font-semibold">No mutual transactions between you two.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold">
                              <th className="pb-2 font-semibold">Date</th>
                              <th className="pb-2 font-semibold">Description</th>
                              <th className="pb-2 font-semibold text-right">Adjustment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {audit.transactions.map((tx) => {
                              const d = new Date(tx.date);
                              const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                              return (
                                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-3 text-slate-450 font-medium">{formattedDate}</td>
                                  <td className="py-3 text-slate-700 font-semibold">{tx.description}</td>
                                  <td className={`py-3 text-right font-bold ${
                                    tx.direction === 'plus' ? 'text-emerald-700' : 'text-rose-600'
                                  }`}>
                                    {tx.direction === 'plus' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
