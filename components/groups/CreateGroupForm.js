import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState([{ name: '', upiId: '' }]);

  useEffect(() => {
    if (router.query.name) {
      setName(router.query.name);
    }
  }, [router.query.name]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddMember = () => {
    setMembers([...members, { name: '', upiId: '' }]);
  };

  const handleRemoveMember = (index) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate members
    const validMembers = members.filter(m => m.name.trim() !== '');
    if (validMembers.length < 2) {
      setError('A group must have at least 2 members');
      setLoading(false);
      return;
    }

    const missingUpi = validMembers.some(m => !m.upiId || m.upiId.trim() === '');
    if (missingUpi) {
      setError('All group members must have a valid UPI ID');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/groups', {
        name,
        description,
        members: validMembers
      });
      router.push(`/groups/${res.data._id}`);
    } catch (err) {
      setError('Failed to create group');
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 shadow-card rounded-2xl p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-800 mb-1">Create a Group</h2>
          <p className="text-slate-500 text-sm font-medium">Set up your group and invite friends.</p>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 font-semibold mb-2">Group Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-medium"
              placeholder="e.g. Goa Trip"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-600 font-semibold mb-2">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-medium"
              placeholder="e.g. Expenses for our December trip"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading text-lg font-bold text-slate-800">Members</h3>
            <button type="button" onClick={handleAddMember} className="text-brand hover:text-emerald-800 transition-colors font-bold text-sm">
              + Add Member
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-grow space-y-3 md:space-y-0 md:flex md:gap-3">
                  <input
                    type="text"
                    required
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                    className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-semibold"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    required
                    value={member.upiId}
                    onChange={(e) => handleMemberChange(index, 'upiId', e.target.value)}
                    className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-semibold"
                    placeholder="UPI ID"
                  />
                </div>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(index)}
                    className="p-3 text-slate-400 hover:text-rose-600 transition-colors rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center justify-center h-12 w-12 flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-main text-white font-bold px-7 py-4 rounded-full hover:scale-[1.01] hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? 'Creating Group...' : 'Create Group'}
        </button>
      </form>
    </motion.div>
  );
}
