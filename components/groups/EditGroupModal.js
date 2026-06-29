import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Settings, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function EditGroupModal({ group, onClose, onGroupUpdated }) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [members, setMembers] = useState(group.members.map(m => ({ ...m })));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddMember = () => {
    setMembers([...members, { name: '', upiId: '' }]);
  };

  const handleRemoveMember = (index) => {
    // Only allow removing newly added, unsaved members to protect references
    if (members[index]._id) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? All expenses and settlements will be permanently deleted.')) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`/api/groups/${group._id}`);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete group');
      setLoading(false);
    }
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
      const res = await axios.put(`/api/groups/${group._id}`, {
        name,
        description,
        members: validMembers
      });
      if (onGroupUpdated) {
        onGroupUpdated(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-100 rounded-2xl flex flex-col shadow-2xl my-auto"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 font-heading flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand" />
              Manage Group Settings
            </h3>
            <p className="text-slate-500 text-sm mt-1">Edit group details and member UPI IDs</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 bg-slate-200/60 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 flex flex-col">
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-650 font-bold mb-2">Group Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-650 font-bold mb-2">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-heading text-lg font-bold text-slate-800">Members</h4>
              <button
                type="button"
                onClick={handleAddMember}
                className="text-brand hover:text-emerald-800 transition-colors font-bold text-sm flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={member._id || index} className="flex gap-3 items-center">
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
                      value={member.upiId || ''}
                      onChange={(e) => handleMemberChange(index, 'upiId', e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-3 text-slate-800 outline-none w-full transition-all font-semibold"
                      placeholder="UPI ID"
                    />
                  </div>
                  {!member._id && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="p-3 text-slate-400 hover:text-rose-600 transition-colors rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center justify-center h-12 w-12 flex-shrink-0"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between items-center mt-auto gap-3">
            <button
              type="button"
              onClick={handleDeleteGroup}
              disabled={loading}
              className="bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-350 text-rose-600 font-bold px-5 py-3 rounded-full transition-all text-sm flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Group
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-full transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-main text-white font-bold px-8 py-3 rounded-full hover:shadow-glow transition-all disabled:opacity-50 text-sm"
              >
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
