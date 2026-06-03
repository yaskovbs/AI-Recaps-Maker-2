// Contact Service - Blink DB
import { blink } from '@/lib/blink';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SendContactResponse {
  success: boolean;
  message: string;
  messageId: string;
}

/**
 * Send contact message (saved to Blink DB contacts table)
 */
export async function sendContactMessage(
  contactData: ContactMessage
): Promise<{ data: SendContactResponse | null; error: string | null }> {
  console.log('📧 Sending contact message...');
  console.log('📝 Subject:', contactData.subject);

  try {
    const user = await blink.auth.me().catch(() => null);

    const created = await blink.db.contacts.create({
      userId: user?.id || undefined,
      name: contactData.name,
      email: contactData.email,
      subject: contactData.subject,
      message: contactData.message,
      status: 'sent',
      createdAt: new Date().toISOString(),
    });

    console.log('✅ Contact message saved');
    console.log('📧 Message ID:', (created as any).id);

    return {
      data: {
        success: true,
        message: 'Message sent successfully',
        messageId: (created as any).id,
      },
      error: null,
    };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's contact messages
 */
export async function getMyContactMessages() {
  try {
    const user = await blink.auth.me().catch(() => null);
    if (!user) return { data: [], error: null };

    const data = await blink.db.contacts.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
