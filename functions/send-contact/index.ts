// Contact Form Email Sender — AI Recaps Maker
import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function errRes(msg: string, status = 500): Response {
  return new Response(JSON.stringify({ error: msg }), { status, headers: jsonHeaders });
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const BLINK_SECRET_KEY = Deno.env.get("BLINK_SECRET_KEY") ?? "";
    const blink = createClient({ projectId: "ai-recaps-app-f7p6yyt8", secretKey: BLINK_SECRET_KEY });

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return errRes("Invalid JSON body", 400); }

    const { name, email, subject, message, userId } = body as {
      name?: string; email?: string; subject?: string; message?: string; userId?: string;
    };

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return errRes("Missing required fields: name, email, subject, message", 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return errRes("Invalid email address", 400);
    }

    const safe = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const ts = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    const html = `<!DOCTYPE html><html><body style="margin:0;background:#0a0a0f;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#13131a;border-radius:12px;border:1px solid #1e1e2e;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#00d4ff,#b24bf3);padding:24px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">New Contact Message</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">AI Recaps Maker App</p>
  </div>
  <div style="padding:24px;">
    <div style="background:#1a1a2e;border-left:4px solid #00d4ff;border-radius:8px;padding:16px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#888;font-size:12px;width:70px;">NAME</td><td style="color:#fff;font-size:14px;font-weight:700;">${safe(name.trim())}</td></tr>
        <tr><td style="padding:5px 0;color:#888;font-size:12px;">EMAIL</td><td><a href="mailto:${safe(email.trim())}" style="color:#00d4ff;font-size:14px;">${safe(email.trim())}</a></td></tr>
        <tr><td style="padding:5px 0;color:#888;font-size:12px;">SUBJECT</td><td style="color:#fff;font-size:14px;">${safe(subject.trim())}</td></tr>
      </table>
    </div>
    <div style="background:#0f0f1a;border-radius:8px;padding:16px;border:1px solid #1e1e2e;">
      <p style="margin:0;color:#e0e0e0;font-size:14px;line-height:1.7;white-space:pre-wrap;">${safe(message.trim())}</p>
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="mailto:${safe(email.trim())}?subject=Re: ${encodeURIComponent(subject.trim())}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#b24bf3);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Reply to ${safe(name.trim())}</a>
    </div>
  </div>
  <div style="padding:12px 24px;border-top:1px solid #1e1e2e;text-align:center;">
    <p style="margin:0;color:#555;font-size:11px;">AI Recaps Maker Contact Form • ${ts}</p>
  </div>
</div></body></html>`;

    await blink.notifications.email({
      to: "contact-us@y-l-b-s-ai-studio-apps.com",
      replyTo: email.trim(),
      subject: `[AI Recaps] ${subject.trim()} — from ${name.trim()}`,
      html,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}\n\nSent: ${new Date().toISOString()}`,
    });

    try {
      await blink.db.contacts.create({
        userId: (userId as string) || null,
        name: name.trim(), email: email.trim(),
        subject: subject.trim(), message: message.trim(),
        status: "sent", createdAt: new Date().toISOString(),
      });
    } catch (e) { console.warn("DB save non-fatal:", e); }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error";
    console.error("Contact error:", msg);
    return errRes(msg, 500);
  }
}

Deno.serve(handler);
