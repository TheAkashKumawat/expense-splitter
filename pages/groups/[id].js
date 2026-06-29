import { useState } from 'react';
import Head from 'next/head';
import { Settings } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import connectDB from '../../lib/connectDB';
import Group from '../../models/Group';
import Expense from '../../models/Expense';
import AddExpenseForm from '../../components/expenses/AddExpenseForm';
import ExpenseList from '../../components/expenses/ExpenseList';
import BalanceSummary from '../../components/balances/BalanceSummary';
import EditGroupModal from '../../components/groups/EditGroupModal';

export default function GroupDetail({ initialGroup, initialExpenses }) {
  const [group, setGroup] = useState(initialGroup);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!group) {
    return <div className="text-center py-20 text-white/50">Group not found</div>;
  }

  const handleExpenseAdded = (newExpense) => {
    setExpenses([newExpense, ...expenses]);
  };

  const handleExpenseDeleted = (id) => {
    setExpenses(expenses.filter(e => e._id !== id));
  };

  return (
    <>
      <Head>
        <title>{group.name} | SettliX</title>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-slate-800 mb-2">{group.name}</h1>
            {group.description && <p className="text-slate-500 font-medium">{group.description}</p>}
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex-shrink-0 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-sm font-bold text-slate-700 shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Manage Group
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <AddExpenseForm group={group} onExpenseAdded={handleExpenseAdded} />
            <ExpenseList expenses={expenses} onDelete={handleExpenseDeleted} />
          </div>
          
          <div className="lg:col-span-1 order-1 lg:order-2">
            <BalanceSummary group={group} expenses={expenses} onManageGroup={() => setShowEditModal(true)} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && (
          <EditGroupModal
            group={group}
            onClose={() => setShowEditModal(false)}
            onGroupUpdated={(updated) => setGroup(updated)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export async function getServerSideProps({ params, req }) {
  await connectDB();
  
  // Read cookies manually to verify authentication
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
      const { decryptSession } = require('../../lib/auth');
      user = decryptSession(cookies.session);
    }
  }

  if (!user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    const group = await Group.findById(params.id).lean();
    if (!group) return { notFound: true };

    // Group ownership check
    if (group.userId && group.userId.toString() !== user.id) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    const expenses = await Expense.find({ groupId: params.id }).sort({ createdAt: -1 }).lean();

    return {
      props: {
        initialGroup: JSON.parse(JSON.stringify(group)),
        initialExpenses: JSON.parse(JSON.stringify(expenses)),
      },
    };
  } catch (error) {
    return { notFound: true };
  }
}
