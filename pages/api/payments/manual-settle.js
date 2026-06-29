import connectDB from '../../../lib/connectDB';
import Settlement from '../../../models/Settlement';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectDB();

  try {
    const { amount, fromId, fromName, toId, toName, groupId } = req.body;

    if (!amount || !fromId || !toId || !groupId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const settlement = await Settlement.create({
      groupId,
      fromId,
      fromName,
      toId,
      toName,
      amount,
      status: 'completed',
      completedAt: new Date()
    });

    res.status(200).json({ success: true, settlement });
  } catch (error) {
    console.error('Manual settlement error:', error);
    res.status(500).json({ error: 'Failed to record manual settlement' });
  }
}
