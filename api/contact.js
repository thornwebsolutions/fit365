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
    const { name, email, phone, subject, message, website } = req.body;

    // Honeypot check - if website field is filled, it's likely a bot
    if (website) {
      // Return success to not alert the bot
      return res.status(200).json({ success: true });
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Map subject values to readable text
    const subjectMap = {
      membership: 'Membership Inquiry',
      programs: 'Programs & Classes',
      events: 'Event Booking',
      general: 'General Question',
      other: 'Other'
    };

    const subjectText = subjectMap[subject] || subject;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'FIT365 Contact <onboarding@resend.dev>',
      to: ['christopherthornn@gmail.com'],
      replyTo: email,
      subject: `[FIT365 Contact] ${subjectText} - ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subjectText}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This message was sent from the FIT365 website contact form.</p>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({ success: true, id: data?.id });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
