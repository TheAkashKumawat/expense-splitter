import { getSessionUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = getSessionUser(req);
  if (!user) {
    return res.status(200).json({ loggedIn: false });
  }

  return res.status(200).json({ loggedIn: true, user });
}
