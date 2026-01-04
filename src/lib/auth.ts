interface User {
  id: string;
  email: string;
}

interface Session {
  user: User;
  token: string;
}

// Create proper JWT token using crypto
async function createJWT(userId: string, email: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: userId,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]!)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]!)).replace(/=/g, '');
  
  // Use environment variable or fallback
  const secret = process.env.BETTER_AUTH_SECRET || 'your-secure-secret-key-min-32-characters';
  const data = `${encodedHeader}.${encodedPayload}`;
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const encodedSignature = btoa(String.fromCharCode(...Array.from(new Uint8Array(signature))))
      .replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]!))
      .replace(/=/g, '');
    
    return `${data}.${encodedSignature}`;
  } catch (error) {
    // Fallback to simple token for compatibility
    console.warn('Crypto API not available, using simple token');
    return `${data}.simple-signature`;
  }
}

export async function signIn(email: string, password: string): Promise<Session> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Generate unique user ID from email in UUID format
  const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  const userId = `${emailHash.substring(0,8)}-${emailHash.substring(8,12)}-${emailHash.substring(12,16)}-${emailHash.substring(16,20)}-${emailHash.substring(20,32)}`;
  const token = await createJWT(userId, email);
  
  const session = {
    user: { id: userId, email },
    token: token
  };
  
  localStorage.setItem('session', JSON.stringify(session));
  localStorage.setItem('auth-token', token);
  return session;
}

export async function signUp(email: string, password: string): Promise<Session> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Generate unique user ID from email in UUID format
  const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  const userId = `${emailHash.substring(0,8)}-${emailHash.substring(8,12)}-${emailHash.substring(12,16)}-${emailHash.substring(16,20)}-${emailHash.substring(20,32)}`;
  const token = await createJWT(userId, email);
  
  const session = {
    user: { id: userId, email },
    token: token
  };
  
  localStorage.setItem('session', JSON.stringify(session));
  localStorage.setItem('auth-token', token);
  return session;
}

export async function getSession(): Promise<Session | null> {
  try {
    const stored = localStorage.getItem('session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  localStorage.removeItem('session');
  localStorage.removeItem('auth-token');
  window.location.href = '/';
}
