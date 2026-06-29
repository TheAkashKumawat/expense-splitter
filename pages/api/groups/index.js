import connectDB from '../../../lib/connectDB';
import Group from '../../../models/Group';
import { getSessionUser } from '../../../lib/auth';

export default async function handler(req, res) {
  await connectDB();

  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  if (req.method === 'GET') {
    try {
      // Find groups belonging to the user, or historical groups with no userId
      const groups = await Group.find({
        $or: [
          { userId: user.id },
          { userId: { $exists: false } },
          { userId: null }
        ]
      }).sort({ createdAt: -1 });
      res.status(200).json(groups);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, members } = req.body;
      if (!name || !members || members.length < 2) {
        return res.status(400).json({ error: 'Group name and at least 2 members are required' });
      }

      const missingUpi = members.some(m => !m.name || !m.upiId || m.upiId.trim() === '');
      if (missingUpi) {
        return res.status(400).json({ error: 'All group members must have a valid UPI ID' });
      }

      const group = new Group({ 
        name, 
        description, 
        members,
        userId: user.id
      });
      await group.save();
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create group' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
