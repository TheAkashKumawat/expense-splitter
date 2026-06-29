import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'split-easy-session-secret-key-at-least-32-chars-long';

// Hash password with PBKDF2
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password
export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === testHash;
}

// Encrypt session using AES-256-CBC
export function encryptSession(data) {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  // Derive key securely using pbkdf2Sync or scryptSync
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt session
export function decryptSession(token) {
  if (!token) return null;
  try {
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

// Get session user from request cookies
export function getSessionUser(req) {
  const cookieStr = req.headers.cookie;
  if (!cookieStr) return null;
  
  // Quick parse cookies manually
  const cookies = Object.fromEntries(
    cookieStr.split(';').map(c => {
      const parts = c.trim().split('=');
      return [parts[0], parts.slice(1).join('=')];
    })
  );
  
  const session = cookies.session;
  if (!session) return null;
  
  return decryptSession(session);
}
