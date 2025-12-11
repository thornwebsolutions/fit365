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
    const { name, email, phone, subject, message, website, eventType, date, guests } = req.body;

    // Honeypot check - if website field is filled, it's likely a bot
    if (website) {
      // Return success to not alert the bot
      return res.status(200).json({ success: true });
    }

    // Determine if this is an event inquiry or contact form
    const isEventInquiry = !!eventType;

    // Validate required fields based on form type
    if (isEventInquiry) {
      if (!name || !email || !eventType || !date || !guests) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
    } else {
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
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

    // Map event types to readable text
    const eventTypeMap = {
      'micro-wedding': 'Micro Wedding',
      'corporate': 'Corporate Event',
      'private': 'Private Party',
      'reception': 'Reception',
      'workshop': 'Workshop/Seminar',
      'community': 'Community Gathering',
      'other': 'Other'
    };

    let emailSubject, emailHtml;

    if (isEventInquiry) {
      const eventTypeText = eventTypeMap[eventType] || eventType;
      emailSubject = `[FIT365 Event Inquiry] ${eventTypeText} - ${name}`;
      emailHtml = `
        <h2>New Event Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Event Type:</strong> ${eventTypeText}</p>
        <p><strong>Preferred Date:</strong> ${date}</p>
        <p><strong>Estimated Guests:</strong> ${guests}</p>
        ${message ? `<h3>Additional Details:</h3><p>${message.replace(/\n/g, '<br>')}</p>` : ''}
        <hr>
        <p style="color: #666; font-size: 12px;">This inquiry was sent from the FIT365 website event inquiry form.</p>
      `;
    } else {
      const subjectText = subjectMap[subject] || subject;
      emailSubject = `[FIT365 Contact] ${subjectText} - ${name}`;
      emailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subjectText}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This message was sent from the FIT365 website contact form.</p>
      `;
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'FIT365 Contact <onboarding@resend.dev>',
      to: ['christopherthornn@gmail.com'],
      replyTo: email,
      subject: emailSubject,
      html: emailHtml
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
