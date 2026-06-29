import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import { Camera, Utensils, Car, Hotel, ShoppingBag, Film, FileText } from 'lucide-react';
import SplitInput from './SplitInput';

const CATEGORIES = [
  { id: 'Food', label: 'Food', icon: Utensils, activeColor: 'border-red-200 bg-red-50 text-red-600 ring-red-300' },
  { id: 'Transport', label: 'Transport', icon: Car, activeColor: 'border-blue-200 bg-blue-50 text-blue-600 ring-blue-300' },
  { id: 'Lodging', label: 'Lodging', icon: Hotel, activeColor: 'border-emerald-200 bg-emerald-50 text-emerald-600 ring-emerald-300' },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag, activeColor: 'border-amber-200 bg-amber-50 text-amber-600 ring-amber-300' },
  { id: 'Entertainment', label: 'Entertainment', icon: Film, activeColor: 'border-pink-200 bg-pink-50 text-pink-600 ring-pink-300' },
  { id: 'Others', label: 'Others', icon: FileText, activeColor: 'border-violet-200 bg-violet-50 text-violet-600 ring-violet-300' }
];

export default function AddExpenseForm({ group, onExpenseAdded }) {
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidById, setPaidById] = useState(group?.members[0]?._id || '');
  const [category, setCategory] = useState('Others');
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [splitMode, setSplitMode] = useState('equally'); // equally, unequally, percentages, shares, itemized

  // Stores raw input values (%, shares, or currency)
  const [splitValues, setSplitValues] = useState({});
  // Stores calculated currency amounts (always sums to totalAmount)
  const [calculatedSplits, setCalculatedSplits] = useState({});

  // Itemized splitting items state
  const [items, setItems] = useState([{ name: '', price: '', members: group?.members.map(m => m._id) || [] }]);

  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [showScanMenu, setShowScanMenu] = useState(false);
  const [scanSuccess, setScanSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch exchange rate relative to INR
  useEffect(() => {
    const fetchRate = async () => {
      if (currency === 'INR') {
        setExchangeRate(1);
        return;
      }
      try {
        const res = await axios.get('https://open.er-api.com/v6/latest/INR');
        const rates = res.data.rates;
        if (rates && rates[currency]) {
          const rateToInr = parseFloat((1 / rates[currency]).toFixed(4));
          setExchangeRate(rateToInr);
        }
      } catch (err) {
        const fallbacks = { USD: 83.5, EUR: 89.6, GBP: 106.2, AED: 22.7 };
        setExchangeRate(fallbacks[currency] || 1);
      }
    };
    fetchRate();
  }, [currency]);

  // Helper to initialize split inputs
  const initializeSplitValues = useCallback((mode) => {
    if (!group || !group.members) return;
    const newValues = {};
    group.members.forEach(m => {
      if (mode === 'equally') {
        newValues[m._id] = 0;
      } else if (mode === 'percentages') {
        newValues[m._id] = parseFloat((100 / group.members.length).toFixed(1));
      } else if (mode === 'shares') {
        newValues[m._id] = 1;
      } else {
        newValues[m._id] = 0;
      }
    });
    setSplitValues(newValues);
  }, [group]);

  // Initialize values when component mounts or splitMode changes
  useEffect(() => {
    initializeSplitValues(splitMode);
  }, [initializeSplitValues, splitMode]);

  // Sync totalAmount with items sum in itemized mode
  useEffect(() => {
    if (splitMode === 'itemized') {
      const sum = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
      setTotalAmount(sum > 0 ? sum.toFixed(2) : '');
    }
  }, [items, splitMode]);

  // Recalculate splits whenever totalAmount, splitMode, splitValues, or items change
  useEffect(() => {
    if (!group || !group.members) return;
    const amount = parseFloat(totalAmount) || 0;
    const membersCount = group.members.length;

    if (amount <= 0 || membersCount === 0) {
      const zeroSplits = {};
      group.members.forEach(m => zeroSplits[m._id] = 0);
      setCalculatedSplits(zeroSplits);
      return;
    }

    const newCalculated = {};
    let sum = 0;

    if (splitMode === 'equally') {
      const splitAmount = parseFloat((amount / membersCount).toFixed(2));
      group.members.forEach((m, index) => {
        if (index === membersCount - 1) {
          newCalculated[m._id] = parseFloat((amount - sum).toFixed(2));
        } else {
          newCalculated[m._id] = splitAmount;
          sum += splitAmount;
        }
      });
    }
    else if (splitMode === 'unequally') {
      group.members.forEach(m => {
        newCalculated[m._id] = parseFloat(splitValues[m._id]) || 0;
      });
    }
    else if (splitMode === 'percentages') {
      const totalPercent = Object.values(splitValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
      if (totalPercent > 0) {
        group.members.forEach((m, index) => {
          const pct = parseFloat(splitValues[m._id]) || 0;
          const calculatedShare = parseFloat(((amount * pct) / 100).toFixed(2));
          if (index === membersCount - 1) {
            newCalculated[m._id] = parseFloat((amount - sum).toFixed(2));
          } else {
            newCalculated[m._id] = calculatedShare;
            sum += calculatedShare;
          }
        });
      } else {
        group.members.forEach(m => newCalculated[m._id] = 0);
      }
    }
    else if (splitMode === 'shares') {
      const totalShares = Object.values(splitValues).reduce((a, b) => a + (parseInt(b) || 0), 0);
      if (totalShares > 0) {
        group.members.forEach((m, index) => {
          const sh = parseInt(splitValues[m._id]) || 0;
          const calculatedShare = parseFloat(((amount * sh) / totalShares).toFixed(2));
          if (index === membersCount - 1) {
            newCalculated[m._id] = parseFloat((amount - sum).toFixed(2));
          } else {
            newCalculated[m._id] = calculatedShare;
            sum += calculatedShare;
          }
        });
      } else {
        group.members.forEach(m => newCalculated[m._id] = 0);
      }
    }
    else if (splitMode === 'itemized') {
      // Reset calculated splits to 0
      group.members.forEach(m => newCalculated[m._id] = 0);

      // Loop through items and distribute shares
      items.forEach(item => {
        const price = parseFloat(item.price) || 0;
        const selectedCount = item.members.length;
        if (price > 0 && selectedCount > 0) {
          const share = parseFloat((price / selectedCount).toFixed(2));
          let itemSum = 0;
          item.members.forEach((memberId, idx) => {
            const memberExists = group.members.some(m => m._id === memberId);
            if (memberExists) {
              if (idx === selectedCount - 1) {
                newCalculated[memberId] += parseFloat((price - itemSum).toFixed(2));
              } else {
                newCalculated[memberId] += share;
                itemSum += share;
              }
            }
          });
        }
      });
    }

    setCalculatedSplits(newCalculated);
  }, [totalAmount, splitMode, splitValues, group, items]);

  const handleValueChange = (memberId, val) => {
    setSplitValues(prev => ({ ...prev, [memberId]: val }));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { name: '', price: '', members: group?.members.map(m => m._id) || [] }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemFieldChange = (index, field, val) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleToggleMemberOnItem = (itemIndex, memberId) => {
    setItems(prev => {
      const updated = [...prev];
      const currentMembers = updated[itemIndex].members;
      if (currentMembers.includes(memberId)) {
        updated[itemIndex] = { ...updated[itemIndex], members: currentMembers.filter(id => id !== memberId) };
      } else {
        updated[itemIndex] = { ...updated[itemIndex], members: [...currentMembers, memberId] };
      }
      return updated;
    });
  };



  // Receipt Scanner Parser Logic
  const handleReceiptScan = async (e) => {
    const file = e.target && e.target.files ? e.target.files[0] : e;
    if (!file) return;

    setScanLoading(true);
    setError('');

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      const text = ret.data.text;
      await worker.terminate();

      if (!text || text.trim() === '') {
        throw new Error('Could not extract any text from the receipt. Please try another image.');
      }

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      // Heuristic 1: Extract Description (Merchant Name)
      const merchantLine = lines.find(line => {
        return line.length > 3 &&
          !/\d/.test(line) &&
          !line.toLowerCase().includes('total') &&
          !line.toLowerCase().includes('amount') &&
          !line.toLowerCase().includes('tax');
      });
      if (merchantLine) {
        setDescription(merchantLine.substring(0, 30));
      }

      // Heuristic 2: Extract Total Amount
      const pricingKeywords = [/total/i, /net/i, /amount/i, /due/i, /sum/i];
      let extractedAmount = 0;

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (pricingKeywords.some(kw => kw.test(line))) {
          const decimalMatch = line.match(/\d+[\.,]\d{2}/);
          if (decimalMatch) {
            const val = parseFloat(decimalMatch[0].replace(',', '.'));
            if (val > 0) {
              extractedAmount = val;
              break;
            }
          }
          const numberMatch = line.match(/\d+/);
          if (numberMatch) {
            const val = parseFloat(numberMatch[0]);
            if (val > 0) {
              extractedAmount = val;
              break;
            }
          }
        }
      }

      if (extractedAmount > 0) {
        setTotalAmount(extractedAmount.toString());
      } else {
        let maxNumber = 0;
        lines.forEach(line => {
          const match = line.match(/\d+[\.,]\d{2}/);
          if (match) {
            const val = parseFloat(match[0].replace(',', '.'));
            if (val > maxNumber) maxNumber = val;
          }
        });
        if (maxNumber > 0) {
          setTotalAmount(maxNumber.toString());
        } else {
          setError('Detected text, but could not extract the amount. Please enter it manually.');
        }
      }

      const lowerDesc = (merchantLine || '').toLowerCase();
      if (lowerDesc.includes('cafe') || lowerDesc.includes('rest') || lowerDesc.includes('food') || lowerDesc.includes('kitchen') || lowerDesc.includes('pizza') || lowerDesc.includes('dine')) {
        setCategory('Food');
      } else if (lowerDesc.includes('uber') || lowerDesc.includes('ola') || lowerDesc.includes('cab') || lowerDesc.includes('rail') || lowerDesc.includes('flight') || lowerDesc.includes('taxi')) {
        setCategory('Transport');
      } else if (lowerDesc.includes('hotel') || lowerDesc.includes('stay') || lowerDesc.includes('hostel') || lowerDesc.includes('lodg') || lowerDesc.includes('airbnb')) {
        setCategory('Lodging');
      } else if (lowerDesc.includes('mart') || lowerDesc.includes('store') || lowerDesc.includes('grocer') || lowerDesc.includes('shop')) {
        setCategory('Shopping');
      } else if (lowerDesc.includes('cinema') || lowerDesc.includes('movi') || lowerDesc.includes('pub') || lowerDesc.includes('bar') || lowerDesc.includes('club')) {
        setCategory('Entertainment');
      }

      const finalAmt = extractedAmount > 0 ? extractedAmount : (typeof maxNumber !== 'undefined' ? maxNumber : 0);
      if (merchantLine || finalAmt > 0) {
        setScanSuccess(`✨ Receipt parsed! ${merchantLine ? `Merchant: "${merchantLine}"` : ''} ${finalAmt > 0 ? `Amount: ₹${finalAmt}` : ''}`);
        setTimeout(() => setScanSuccess(''), 6000);
      }

    } catch (err) {
      setError(err.message || 'Failed to scan receipt.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const amount = parseFloat(totalAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (splitMode === 'unequally') {
      const splitsSum = Object.values(calculatedSplits).reduce((a, b) => a + b, 0);
      if (Math.abs(splitsSum - amount) > 0.01) {
        setError(`Splits sum (${currency} ${splitsSum.toFixed(2)}) must equal total amount (${currency} ${amount.toFixed(2)})`);
        setLoading(false);
        return;
      }
    }
    else if (splitMode === 'percentages') {
      const totalPercent = Object.values(splitValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.1) {
        setError(`Total percentages must sum to 100% (currently ${totalPercent}%)`);
        setLoading(false);
        return;
      }
    }
    else if (splitMode === 'shares') {
      const totalShares = Object.values(splitValues).reduce((a, b) => a + (parseInt(b) || 0), 0);
      if (totalShares <= 0) {
        setError('Total shares must be greater than 0');
        setLoading(false);
        return;
      }
    }
    else if (splitMode === 'itemized') {
      const hasUnassigned = items.some(item => (parseFloat(item.price) || 0) > 0 && item.members.length === 0);
      if (hasUnassigned) {
        setError('Every item with a price must have at least one member assigned to it');
        setLoading(false);
        return;
      }
    }

    const paidByMember = group.members.find(m => m._id === paidById);
    const formattedSplits = group.members.map(m => ({
      memberId: m._id,
      memberName: m.name,
      amount: calculatedSplits[m._id] || 0
    })).filter(s => s.amount > 0);

    try {
      const res = await axios.post('/api/expenses', {
        groupId: group._id,
        description,
        totalAmount: amount,
        currency,
        exchangeRate,
        paidById,
        paidByName: paidByMember.name,
        category,
        splits: formattedSplits
      });

      setDescription('');
      setTotalAmount('');
      setCategory('Others');
      setCurrency('INR');
      setItems([{ name: '', price: '', members: group?.members.map(m => m._id) || [] }]);
      initializeSplitValues(splitMode);
      if (onExpenseAdded) onExpenseAdded(res.data);
    } catch (err) {
      setError('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  if (!group || !group.members) return null;

  const modeTabs = [
    { id: 'equally', label: 'Equally' },
    { id: 'unequally', label: 'Unequally' },
    { id: 'percentages', label: 'By %' },
    { id: 'shares', label: 'By Shares' },
    { id: 'itemized', label: 'Itemized 🍔' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white border border-slate-100 shadow-card rounded-2xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-heading text-xl font-bold text-slate-800">Add Expense</h3>

        {/* Receipt Uploader Control */}
        <div className="relative">
          <button
            type="button"
            disabled={scanLoading}
            onClick={() => setShowScanMenu(!showScanMenu)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer transition-all text-slate-700 font-bold text-xs"
          >
            {scanLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-slate-600" />
                <span>Scan Receipt</span>
              </>
            )}
          </button>

          {showScanMenu && !scanLoading && (
            <>
              {/* Backdrop to close click outside */}
              <div className="fixed inset-0 z-40" onClick={() => setShowScanMenu(false)} />

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in text-xs font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowScanMenu(false);
                    document.getElementById('camera-input').click();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-slate-400" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScanMenu(false);
                    document.getElementById('gallery-input').click();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  Choose from Files
                </button>
              </div>
            </>
          )}

          {/* Hidden inputs */}
          <input
            id="camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            disabled={scanLoading}
            onChange={handleReceiptScan}
            className="hidden"
          />
          <input
            id="gallery-input"
            type="file"
            accept="image/*"
            disabled={scanLoading}
            onChange={handleReceiptScan}
            className="hidden"
          />
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm mb-4 font-semibold">{error}</div>}

      {scanSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm mb-4 font-semibold flex items-center justify-between shadow-sm animate-pulse-slow">
          <span>{scanSuccess}</span>
          <button type="button" onClick={() => setScanSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-black text-base px-1">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-600 font-semibold mb-2">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-medium"
              placeholder="e.g. Dinner at Taj"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 font-semibold mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all appearance-none font-semibold"
            >
              <option value="INR">🇮🇳 INR (₹)</option>
              <option value="USD">🇺🇸 USD ($)</option>
              <option value="EUR">🇪🇺 EUR (€)</option>
              <option value="GBP">🇬🇧 GBP (£)</option>
              <option value="AED">🇦🇪 AED (Dh)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 font-semibold mb-2">
              Total Amount {currency !== 'INR' && <span className="text-xs text-slate-400">({currency})</span>}
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={totalAmount}
              disabled={splitMode === 'itemized'}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
              placeholder={splitMode === 'itemized' ? 'Computed from items' : '0.00'}
            />
          </div>
        </div>

        {currency !== 'INR' && parseFloat(totalAmount) > 0 && (
          <div className="text-xs text-emerald-800 font-bold px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            ≈ ₹{(parseFloat(totalAmount) * exchangeRate).toFixed(2)} INR (Exchange rate: 1 {currency} = ₹{exchangeRate.toFixed(2)} INR)
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-600 font-semibold mb-2">Paid By</label>
          <select
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
            className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-semibold"
          >
            {group.members.map(m => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Premium Grid Category Selector */}
        <div className="pt-2">
          <label className="block text-sm text-slate-600 font-semibold mb-3">Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIES.map(cat => {
              const IconComp = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isSelected
                    ? `${cat.activeColor} ring-1 shadow-sm`
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                  <IconComp className="w-5 h-5 mb-1.5 animate-bounce-short" />
                  <span className="text-[11px] font-bold">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Mode Selector Tabs */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm text-slate-600 font-semibold mb-3">Split Option</label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-4">
            {modeTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSplitMode(tab.id)}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all duration-200 ${splitMode === tab.id
                  ? 'bg-gradient-main text-white shadow-glow'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Render Member Inputs or Itemized Editor */}
          {splitMode === 'itemized' ? (
            <div className="space-y-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Breakdown</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs bg-brand hover:bg-emerald-800 text-white font-extrabold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  + Add Item
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-100 p-3 rounded-lg space-y-3 shadow-sm relative animate-fade-in">
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => handleRemoveItem(idx)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-20 disabled:hover:text-slate-400 font-extrabold text-base px-1"
                    title="Delete item"
                  >
                    ×
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Item Description</label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Garlic Bread"
                        className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand rounded-lg px-3 py-2 text-xs outline-none w-full font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Price ({currency})</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemFieldChange(idx, 'price', e.target.value)}
                        placeholder="0.00"
                        className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand rounded-lg px-3 py-2 text-xs outline-none w-full font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Who shared this?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {group.members.map(m => {
                        const isAssigned = item.members.includes(m._id);
                        return (
                          <button
                            key={m._id}
                            type="button"
                            onClick={() => handleToggleMemberOnItem(idx, m._id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150 ${isAssigned
                              ? 'bg-emerald-50 border-emerald-200 text-brand ring-1 ring-emerald-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Calculated Splits preview under itemized breakdown */}
              <div className="border-t border-slate-200/60 pt-3 mt-3">
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-2">Calculated Share Preview</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {group.members.map(m => (
                    <div key={m._id} className="bg-white border border-slate-100 p-2 rounded-lg text-center shadow-sm">
                      <div className="text-[10px] text-slate-500 font-semibold truncate">{m.name}</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">₹{(calculatedSplits[m._id] || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {group.members.map(m => {
                let suffix = currency;
                let isInputDisabled = false;
                let step = 'any';
                let min = '0';

                if (splitMode === 'equally') {
                  suffix = currency;
                  isInputDisabled = true;
                } else if (splitMode === 'percentages') {
                  suffix = '%';
                  step = '0.1';
                } else if (splitMode === 'shares') {
                  suffix = 'share';
                  step = '1';
                  min = '0';
                }

                return (
                  <SplitInput
                    key={m._id}
                    member={m}
                    value={splitMode === 'equally' ? calculatedSplits[m._id] || 0 : splitValues[m._id] || 0}
                    calculatedAmount={splitMode !== 'equally' ? calculatedSplits[m._id] : undefined}
                    onChange={handleValueChange}
                    suffix={suffix}
                    disabled={isInputDisabled}
                    step={step}
                    min={min}
                  />
                );
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-main text-white font-bold px-7 py-3 rounded-full hover:scale-[1.01] hover:shadow-glow transition-all duration-200 mt-4 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </motion.div>
  );
}
