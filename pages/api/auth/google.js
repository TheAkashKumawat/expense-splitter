import connectDB from '../../../lib/connectDB';
import User from '../../../models/User';
import { encryptSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await connectDB();

  try {
    const { credential, isMock } = req.body;
    let name = '';
    let email = '';
    let googleId = '';

    if (isMock) {
      // Mock Login Fallback for local testing when no Client ID is configured
      name = 'Google Test User';
      email = 'test-google@example.com';
      googleId = 'google_mock_user_12345';
    } else {
      if (!credential) {
        return res.status(400).json({ error: 'Google credential token is required' });
      }

      // Decode Google identity token (payload is the second part of JWT base64url encoded)
      const tokenParts = credential.split('.');
      if (tokenParts.length < 2) {
        return res.status(400).json({ error: 'Invalid Google token format' });
      }

      const payloadBase64 = tokenParts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      const decoded = JSON.parse(payloadJson);

      name = decoded.name;
      email = decoded.email?.toLowerCase().trim();
      googleId = decoded.sub;

      if (!email) {
        return res.status(400).json({ error: 'Google account must have an email associated' });
      }
    }

    // Find or create User in the database
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        googleId
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google Account to existing credentials user if email matches
      user.googleId = googleId;
      await user.save();
    }

    const sessionPayload = { id: user._id.toString(), name: user.name, email: user.email };
    const sessionToken = encryptSession(sessionPayload);

    // Set session cookie
    res.setHeader('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);
    return res.status(200).json({ success: true, user: sessionPayload });

  } catch (error) {
    console.error('Google Auth backend error:', error);
    return res.status(500).json({ error: 'Google SSO Authentication Failed' });
  }
}
