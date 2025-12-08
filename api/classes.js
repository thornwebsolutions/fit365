import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all class IDs
    const classIds = await kv.smembers('classes');

    if (!classIds || classIds.length === 0) {
      return res.status(200).json({ classes: [] });
    }

    // Get all class data
    const classes = [];
    for (const id of classIds) {
      const classData = await kv.hgetall(`class:${id}`);
      if (classData && (classData.isActive === 'true' || classData.isActive === true)) {
        classes.push({
          id,
          name: classData.name,
          date: classData.date,
          time: classData.time,
          description: classData.description,
          capacity: parseInt(classData.capacity),
          spotsRemaining: parseInt(classData.spotsRemaining)
        });
      }
    }

    // Sort by date
    classes.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ error: 'Failed to fetch classes' });
  }
}
