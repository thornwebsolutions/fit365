import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, classId } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !classId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get class data
    const classData = await kv.hgetall(`class:${classId}`);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if spots available
    const spotsRemaining = parseInt(classData.spotsRemaining);
    if (spotsRemaining <= 0) {
      return res.status(400).json({ error: 'This class is full' });
    }

    // Check for duplicate RSVP
    const existingRsvps = await kv.smembers(`rsvps:${classId}`);
    for (const rsvpId of existingRsvps) {
      const rsvp = await kv.hgetall(`rsvp:${rsvpId}`);
      if (rsvp && rsvp.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ error: 'You have already registered for this class' });
      }
    }

    // Create RSVP
    const rsvpId = `${classId}-${Date.now()}`;
    const rsvpData = {
      classId,
      firstName,
      lastName,
      email,
      createdAt: new Date().toISOString()
    };

    await kv.hset(`rsvp:${rsvpId}`, rsvpData);
    await kv.sadd(`rsvps:${classId}`, rsvpId);

    // Decrement spots remaining
    await kv.hset(`class:${classId}`, { spotsRemaining: spotsRemaining - 1 });

    // Send confirmation email to user
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'FIT365 <noreply@fit365.com>',
        to: email,
        subject: `RSVP Confirmed - ${classData.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0a0a0a;">You're Registered!</h1>
            <p>Hi ${firstName},</p>
            <p>Your RSVP has been confirmed for:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #e63946; margin-top: 0;">${classData.name}</h2>
              <p><strong>Date:</strong> ${classData.date}</p>
              <p><strong>Time:</strong> ${classData.time}</p>
            </div>
            <p>We look forward to seeing you!</p>
            <p>- The FIT365 Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send user email:', emailError);
    }

    // Send notification email to admin
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'FIT365 <noreply@fit365.com>',
        to: process.env.ADMIN_EMAIL,
        subject: `New RSVP - ${classData.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0a0a0a;">New Class Registration</h1>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #e63946; margin-top: 0;">${classData.name}</h2>
              <p><strong>Date:</strong> ${classData.date}</p>
              <p><strong>Time:</strong> ${classData.time}</p>
            </div>
            <h3>Registrant Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${firstName} ${lastName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Registered:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            <p><strong>Spots Remaining:</strong> ${spotsRemaining - 1} / ${classData.capacity}</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send admin email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'RSVP submitted successfully',
      spotsRemaining: spotsRemaining - 1
    });

  } catch (error) {
    console.error('Error processing RSVP:', error);
    return res.status(500).json({ error: 'Failed to process RSVP' });
  }
}
