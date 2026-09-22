import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    // 1: SEND TELEGRAM NOTIFICATION
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🔥 New Lead on AutoFlowLab!\n\nEmail: ${email}\nAction: Send them a custom offer!`
        })
      });
    }

    // 2: AUTO-REPLY FROM YOUR GMAIL
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
    
    // Automatically uses localhost in dev, and your real domain in production
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const DOWNLOAD_LINK = `${SITE_URL}/blueprints.zip`;

    if (GMAIL_USER && GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"Md. Selim Reza" <${GMAIL_USER}>`,
        to: email,
        subject: "Your AI Automation Blueprints",
        text: `Hi there,\n\nThanks for visiting AutoFlowLab! As promised, here is the link to download your JSON automation blueprints:\n\n${DOWNLOAD_LINK}\n\nIf you want me to build a custom AI Lead Scout or Telegram bot for your business, reply to this email or book a package on my site.\n\nBest regards,\nMd. Selim Reza\nAI Solutions Architect`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
            <p>Hi there,</p>
            <p>Thanks for visiting AutoFlowLab! As promised, here is the link to download your JSON automation blueprints:</p>
            <p>👉 <strong><a href="${DOWNLOAD_LINK}" style="color: #10b981; text-decoration: none;">Download blueprints.zip</a></strong></p>
            <p>If you are struggling to set this up, or if you want me to build a custom AI Lead Scout or Telegram bot for your business, just reply to this email!</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>Md. Selim Reza</strong><br/>AI Solutions Architect</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ success: true, message: "Lead captured successfully!" });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
