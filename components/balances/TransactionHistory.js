import React from 'react';

export default function TransactionHistory({ settlements = [] }) {
  if (!settlements || settlements.length === 0) {
    return (
      <div className="bg-white border border-slate-100 shadow-card rounded-2xl p-6 text-center text-slate-400 font-medium">
        No settlements yet.
      </div>
    );
  }

  // Sort newest first
  const sortedSettlements = [...settlements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="bg-white border border-slate-100 shadow-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6 font-heading">Recent Settlements</h3>
      <div className="space-y-4">
        {sortedSettlements.map((settlement) => {
          let badgeColor = '';
          switch (settlement.status) {
            case 'completed':
              badgeColor = 'bg-emerald-50 text-emerald-800';
              break;
            case 'pending':
            case 'created':
              badgeColor = 'bg-amber-50 text-amber-800';
              break;
            case 'failed':
              badgeColor = 'bg-rose-50 text-rose-600';
              break;
            default:
              badgeColor = 'bg-slate-100 text-slate-600';
          }

          const dateObj = new Date(settlement.createdAt);
          const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

          return (
            <div key={settlement._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand/20 transition-all gap-4">
              <div className="flex-grow min-w-0">
                <div className="text-slate-800 font-semibold truncate">
                  {settlement.fromName} <span className="text-slate-400 font-normal mx-1">→</span> {settlement.toName}
                </div>
                <div className="text-[10px] text-slate-450 mt-1 font-medium truncate">
                  {formattedDate} 
                  {settlement.razorpayPaymentId && (
                    <span className="ml-1.5 font-mono text-[10px] opacity-80">
                      • {settlement.razorpayPaymentId.substring(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 text-right">
                <span className="text-slate-800 font-extrabold text-sm">₹{settlement.amount}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize mt-1 ${badgeColor}`}>
                  {settlement.status === 'created' ? 'pending' : settlement.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
