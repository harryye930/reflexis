export async function requireFirebaseAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Firebase API key is not configured' });
    return null;
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  });

  if (!response.ok) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return null;
  }

  const data = await response.json();
  const user = data.users?.[0];

  if (!user?.localId) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return null;
  }

  return {
    uid: user.localId,
    email: user.email || null
  };
}
