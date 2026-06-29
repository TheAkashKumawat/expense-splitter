import connectDB from '../../../lib/connectDB';
import Group from '../../../models/Group';
import Expense from '../../../models/Expense';
import Settlement from '../../../models/Settlement';
import { getSessionUser } from '../../../lib/auth';

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  if (req.method === 'GET') {
    try {
      const group = await Group.findById(id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      // Ownership check for privacy
      if (group.userId && group.userId.toString() !== user.id) {
        return res.status(403).json({ error: 'Forbidden. You do not own this group.' });
      }

      res.status(200).json(group);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch group' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, members } = req.body;
      if (!name || !members || members.length < 2) {
        return res.status(400).json({ error: 'Group name and at least 2 members are required' });
      }

      const missingUpi = members.some(m => !m.name || !m.upiId || m.upiId.trim() === '');
      if (missingUpi) {
        return res.status(400).json({ error: 'All group members must have a valid UPI ID' });
      }

      const oldGroup = await Group.findById(id);
      if (!oldGroup) return res.status(404).json({ error: 'Group not found' });

      // Ownership check
      if (oldGroup.userId && oldGroup.userId.toString() !== user.id) {
        return res.status(403).json({ error: 'Forbidden. You do not own this group.' });
      }

      const updatedGroup = await Group.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

      // Compare names to synchronize across collections
      const nameChanges = [];
      updatedGroup.members.forEach(newMember => {
        const oldMember = oldGroup.members.find(m => m._id.toString() === newMember._id.toString());
        if (oldMember && oldMember.name !== newMember.name) {
          nameChanges.push({
            id: newMember._id.toString(),
            newName: newMember.name
          });
        }
      });

      if (nameChanges.length > 0) {
        for (const change of nameChanges) {
          // Sync paidByName in Expense
          await Expense.updateMany(
            { groupId: id, paidById: change.id },
            { paidByName: change.newName }
          );

          // Sync splits[].memberName in Expense
          await Expense.updateMany(
            { groupId: id, 'splits.memberId': change.id },
            { 'splits.$.memberName': change.newName }
          );

          // Sync Settlement fromName
          await Settlement.updateMany(
            { groupId: id, fromId: change.id },
            { fromName: change.newName }
          );

          // Sync Settlement toName
          await Settlement.updateMany(
            { groupId: id, toId: change.id },
            { toName: change.newName }
          );
        }
      }

      res.status(200).json(updatedGroup);
    } catch (error) {
      console.error('Update group error:', error);
      res.status(400).json({ error: 'Failed to update group' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const group = await Group.findById(id);
      if (!group) return res.status(404).json({ error: 'Group not found' });

      // Ownership check
      if (group.userId && group.userId.toString() !== user.id) {
        return res.status(403).json({ error: 'Forbidden. You do not own this group.' });
      }

      await Group.findByIdAndDelete(id);
      // Also delete all expenses for this group
      await Expense.deleteMany({ groupId: id });
      res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete group' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
