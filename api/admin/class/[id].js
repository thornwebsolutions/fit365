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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Class ID is required' });
  }

  try {
    // GET - Get single class with RSVPs
    if (req.method === 'GET') {
      const classData = await kv.hgetall(`class:${id}`);

      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Get RSVPs
      const rsvpIds = await kv.smembers(`rsvps:${id}`);
      const rsvps = [];

      if (rsvpIds && rsvpIds.length > 0) {
        for (const rsvpId of rsvpIds) {
          const rsvp = await kv.hgetall(`rsvp:${rsvpId}`);
          if (rsvp) {
            rsvps.push({
              id: rsvpId,
              firstName: rsvp.firstName,
              lastName: rsvp.lastName,
              email: rsvp.email,
              createdAt: rsvp.createdAt
            });
          }
        }
      }

      // Sort RSVPs by date
      rsvps.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return res.status(200).json({
        id,
        name: classData.name,
        date: classData.date,
        time: classData.time,
        description: classData.description,
        capacity: parseInt(classData.capacity),
        spotsRemaining: parseInt(classData.spotsRemaining),
        isActive: classData.isActive === 'true' || classData.isActive === true,
        rsvps
      });
    }

    // PUT - Update class
    if (req.method === 'PUT') {
      const existingClass = await kv.hgetall(`class:${id}`);

      if (!existingClass) {
        return res.status(404).json({ error: 'Class not found' });
      }

      const { name, date, time, description, capacity, isActive } = req.body;

      // Calculate spots remaining if capacity changed
      let spotsRemaining = parseInt(existingClass.spotsRemaining);
      if (capacity !== undefined) {
        const oldCapacity = parseInt(existingClass.capacity);
        const rsvpCount = oldCapacity - spotsRemaining;
        spotsRemaining = Math.max(0, parseInt(capacity) - rsvpCount);
      }

      // Update class data
      const updatedData = {
        name: name || existingClass.name,
        date: date || existingClass.date,
        time: time || existingClass.time,
        description: description !== undefined ? description : existingClass.description,
        capacity: (capacity || existingClass.capacity).toString(),
        spotsRemaining: spotsRemaining.toString(),
        isActive: (isActive !== undefined ? isActive : (existingClass.isActive === 'true' || existingClass.isActive === true)).toString()
      };

      await kv.hset(`class:${id}`, updatedData);

      return res.status(200).json({
        success: true,
        id,
        ...updatedData,
        capacity: parseInt(updatedData.capacity),
        spotsRemaining: parseInt(updatedData.spotsRemaining),
        isActive: updatedData.isActive === 'true'
      });
    }

    // DELETE - Delete class
    if (req.method === 'DELETE') {
      const existingClass = await kv.hgetall(`class:${id}`);

      if (!existingClass) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Delete RSVPs for this class
      const rsvpIds = await kv.smembers(`rsvps:${id}`);
      if (rsvpIds && rsvpIds.length > 0) {
        for (const rsvpId of rsvpIds) {
          await kv.del(`rsvp:${rsvpId}`);
        }
        await kv.del(`rsvps:${id}`);
      }

      // Delete class
      await kv.del(`class:${id}`);
      await kv.srem('classes', id);

      return res.status(200).json({
        success: true,
        message: 'Class deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Admin class operation error:', error);
    return res.status(500).json({ error: 'Operation failed' });
  }
}
