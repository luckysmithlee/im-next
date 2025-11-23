import io from 'socket.io-client';

const AUTH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1` : 'http://localhost:9999/auth/v1';
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

async function signIn(email, password) {
  const resp = await fetch(`${AUTH_URL}/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!resp.ok) throw new Error(`signIn failed: ${resp.status}`);
  return resp.json();
}

async function getMe(token) {
  const resp = await fetch(`${BACKEND}/api/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error(`getMe failed: ${resp.status}`);
  return resp.json();
}

async function testSocket(token) {
  return new Promise((resolve, reject) => {
    const s = io(BACKEND, { auth: { token }, transports: ['websocket'] });
    const to = setTimeout(() => {
      try { s.disconnect(); } catch {}
      reject(new Error('socket timeout'));
    }, 5000);
    s.on('connect_error', (err) => {
      clearTimeout(to);
      reject(err);
    });
    s.on('online_users', (list) => {
      clearTimeout(to);
      try { s.disconnect(); } catch {}
      resolve(Array.isArray(list));
    });
  });
}

async function main() {
  try {
    const { access_token } = await signIn('test1@example.com', '123456');
    if (!access_token) throw new Error('no access_token');
    const me = await getMe(access_token);
    if (!me?.id) throw new Error('no user id');
    const ok = await testSocket(access_token);
    if (!ok) throw new Error('socket test failed');
    console.log('E2E auth OK');
    process.exit(0);
  } catch (e) {
    console.error('E2E auth FAILED', e);
    process.exit(1);
  }
}

main();
