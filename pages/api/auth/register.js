import connectDB from '../../../lib/connectDB';
import User from '../../../models/User';
import { hashPassword, encryptSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await connectDB();

  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = hashPassword(password);
    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword
    });
    await user.save();

    const sessionPayload = { id: user._id.toString(), name: user.name, email: user.email };
    const sessionToken = encryptSession(sessionPayload);

    // Set cookie
    res.setHeader('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);
    return res.status(201).json({ success: true, user: sessionPayload });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
