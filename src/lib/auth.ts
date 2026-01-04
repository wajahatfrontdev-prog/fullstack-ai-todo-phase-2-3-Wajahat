interface User {
  id: string;
  email: string;
}

interface Session {
  user: User;
  token: string;
}

// Simple JWT creation for frontend
function createJWT(userId: string, email: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  // Create proper UUID format from email
  const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  const uuid = `${emailHash.substring(0,8)}-${emailHash.substring(8,12)}-${emailHash.substring(12,16)}-${emailHash.substring(16,20)}-${emailHash.substring(20,32)}`;
  
  const payload = {
    sub: uuid,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const signature = btoa(`${encodedHeader}.${encodedPayload}.signature`).replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function signIn(email: string, password: string): Promise<Session> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Generate unique user ID from email in UUID format
  const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  const userId = `${emailHash.substring(0,8)}-${emailHash.substring(8,12)}-${emailHash.substring(12,16)}-${emailHash.substring(16,20)}-${emailHash.substring(20,32)}`;
  const token = createJWT(userId, email);
  
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
  const token = createJWT(userId, email);
  
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
