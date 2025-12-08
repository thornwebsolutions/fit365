export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check password against environment variable
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`admin:${Date.now()}:${process.env.ADMIN_PASSWORD}`).toString('base64');

    return res.status(200).json({
      success: true,
      token,
      expiresIn: 86400000 // 24 hours in milliseconds
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
