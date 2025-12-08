import { kv } from '@vercel/kv';

// Verify admin token
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [prefix, timestamp, password] = decoded.split(':');

    // Check if token is valid and not expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (prefix !== 'admin' || tokenAge > 86400000 || password !== process.env.ADMIN_PASSWORD) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // GET - List all classes (including inactive)
    if (req.method === 'GET') {
      const classIds = await kv.smembers('classes');

      if (!classIds || classIds.length === 0) {
        return res.status(200).json({ classes: [] });
      }

      const classes = [];
      for (const id of classIds) {
        const classData = await kv.hgetall(`class:${id}`);
        if (classData) {
          // Get RSVP count
          const rsvpIds = await kv.smembers(`rsvps:${id}`);
          const rsvpCount = rsvpIds ? rsvpIds.length : 0;

          classes.push({
            id,
            name: classData.name,
            date: classData.date,
            time: classData.time,
            description: classData.description,
            capacity: parseInt(classData.capacity),
            spotsRemaining: parseInt(classData.spotsRemaining),
            isActive: classData.isActive === 'true',
            rsvpCount
          });
        }
      }

      // Sort by date
      classes.sort((a, b) => new Date(a.date) - new Date(b.date));

      return res.status(200).json({ classes });
    }

    // POST - Create new class
    if (req.method === 'POST') {
      const { name, date, time, description, capacity, isActive = true } = req.body;

      // Validate required fields
      if (!name || !date || !time || !capacity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate unique ID
      const id = `class-${Date.now()}`;

      // Create class data
      const classData = {
        name,
        date,
        time,
        description: description || '',
        capacity: capacity.toString(),
        spotsRemaining: capacity.toString(),
        isActive: isActive.toString()
      };

      // Save to KV
      await kv.hset(`class:${id}`, classData);
      await kv.sadd('classes', id);

      return res.status(201).json({
        success: true,
        id,
        ...classData,
        capacity: parseInt(classData.capacity),
        spotsRemaining: parseInt(classData.spotsRemaining),
        isActive: classData.isActive === 'true'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Admin classes error:', error);
    return res.status(500).json({ error: 'Operation failed' });
  }
}
