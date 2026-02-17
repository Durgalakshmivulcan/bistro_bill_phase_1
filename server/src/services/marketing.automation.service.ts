import { Prisma } from '@prisma/client';
import { prisma } from './db.service';

/**
 * Marketing Automation Service
 *
 * Handles automated marketing campaigns such as birthday wishes.
 * Designed to be triggered by a cron job (e.g., daily at 9 AM).
 */

interface BirthdayCampaignResult {
  totalCustomers: number;
  messagesSent: number;
  messagesFailed: number;
  discountsCreated: number;
  errors: string[];
}

/**
 * Run the daily birthday campaign.
 *
 * - Fetches all customers whose birthday is today (matching month and day)
 * - Generates a 20% discount code valid for 7 days
 * - Sends birthday greeting via WhatsApp (with SMS fallback)
 * - Logs campaign activity in IntegrationLog
 *
 * Intended to be called by a cron job at 9 AM daily.
 */
export async function runBirthdayCampaign(): Promise<BirthdayCampaignResult> {
  const result: BirthdayCampaignResult = {
    totalCustomers: 0,
    messagesSent: 0,
    messagesFailed: 0,
    discountsCreated: 0,
    errors: [],
  };

  const today = new Date();
  const todayMonth = today.getMonth() + 1; // 1-indexed
  const todayDay = today.getDate();

  // Fetch all customers with a birthday today (across all business owners)
  const birthdayCustomers = await prisma.customer.findMany({
    where: {
      dob: { not: null },
    },
    include: {
      businessOwner: true,
      customerTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  // Filter to only customers whose dob month/day matches today
  const todaysBirthdayCustomers = birthdayCustomers.filter((customer) => {
    if (!customer.dob) return false;
    const dob = new Date(customer.dob);
    return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
  });

  result.totalCustomers = todaysBirthdayCustomers.length;

  if (todaysBirthdayCustomers.length === 0) {
    return result;
  }

  // Group customers by businessOwnerId for batch processing
  const customersByOwner = new Map<string, typeof todaysBirthdayCustomers>();
  for (const customer of todaysBirthdayCustomers) {
    const existing = customersByOwner.get(customer.businessOwnerId) || [];
    existing.push(customer);
    customersByOwner.set(customer.businessOwnerId, existing);
  }

  for (const [businessOwnerId, customers] of customersByOwner.entries()) {
    // Generate a birthday discount code for this business owner
    const discountCode = generateBirthdayDiscountCode();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 7);

    // Create the discount in the database
    let discount;
    try {
      discount = await prisma.discount.create({
        data: {
          businessOwnerId,
          code: discountCode,
          name: `Birthday Special - ${discountCode}`,
          type: 'Custom',
          valueType: 'Percentage',
          value: new Prisma.Decimal(20),
          startDate: today,
          endDate: validUntil,
          status: 'active',
        },
      });
      result.discountsCreated++;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error creating discount';
      result.errors.push(`Failed to create discount for owner ${businessOwnerId}: ${errMsg}`);
      continue;
    }

    // Send birthday message to each customer
    for (const customer of customers) {
      const customerName = customer.name || 'Valued Customer';
      const birthdayMessage = `Happy Birthday ${customerName}! 🎂 Use code ${discountCode} for 20% off your next order. Valid until ${validUntil.toLocaleDateString('en-IN')}. From ${customer.businessOwner.restaurantName || 'your favorite restaurant'}!`;

      // Check if customer has opted out of WhatsApp
      const isWhatsAppOptedOut = customer.customerTags.some(
        (ct) => ct.tag.name === 'whatsapp_optout'
      );

      let messageSent = false;

      // Try WhatsApp first (unless opted out)
      if (!isWhatsAppOptedOut) {
        try {
          const whatsAppResult = await sendBirthdayWhatsApp(
            businessOwnerId,
            customer.phone,
            customerName,
            discountCode,
            validUntil
          );
          if (whatsAppResult.success) {
            messageSent = true;
          }
        } catch {
          // WhatsApp failed, will try SMS
        }
      }

      // Fallback to SMS if WhatsApp failed or customer opted out
      if (!messageSent) {
        try {
          const smsResult = await sendBirthdaySMS(
            businessOwnerId,
            customer.phone,
            birthdayMessage
          );
          if (smsResult.success) {
            messageSent = true;
          }
        } catch {
          // SMS also failed
        }
      }

      if (messageSent) {
        result.messagesSent++;
      } else {
        result.messagesFailed++;
        result.errors.push(`Failed to send birthday message to customer ${customer.id} (${customer.phone})`);
      }

      // Log campaign activity
      await logCampaignActivity(
        businessOwnerId,
        'birthday_campaign',
        messageSent ? 'success' : 'failure',
        {
          customerId: customer.id,
          customerName,
          phone: customer.phone,
          discountCode,
          discountId: discount.id,
          channel: isWhatsAppOptedOut ? 'sms' : messageSent && !isWhatsAppOptedOut ? 'whatsapp' : 'sms',
        },
        messageSent ? null : 'Failed to send via both WhatsApp and SMS'
      );
    }
  }

  return result;
}

/**
 * Generate a unique birthday discount code.
 * Format: BDAY20-XXXXX where X is alphanumeric.
 */
function generateBirthdayDiscountCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BDAY20-${suffix}`;
}

/**
 * Send birthday greeting via WhatsApp Business API.
 */
async function sendBirthdayWhatsApp(
  businessOwnerId: string,
  phoneNumber: string,
  customerName: string,
  discountCode: string,
  validUntil: Date
): Promise<{ success: boolean; message: string }> {
  // Find WhatsApp integration for this business
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'whatsapp_business',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return { success: false, message: 'WhatsApp integration not configured or inactive' };
  }

  const config = integration.config as unknown as {
    provider: 'twilio' | 'meta';
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    metaAccessToken?: string;
    metaPhoneNumberId?: string;
  };

  // Normalize phone
  let cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = `+91${cleaned}`;
  }

  const messageBody = `Happy Birthday ${customerName}! 🎂 Use code ${discountCode} for 20% off your next order. Valid until ${validUntil.toLocaleDateString('en-IN')}.`;

  try {
    if (config.provider === 'twilio') {
      const accountSid = config.twilioAccountSid || '';
      const authToken = config.twilioAuthToken || '';
      const fromNumber = config.twilioFromNumber || '';

      if (!accountSid || !authToken || !fromNumber) {
        return { success: false, message: 'Twilio WhatsApp credentials not configured' };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', `whatsapp:${cleaned}`);
      params.append('From', fromNumber);
      params.append('Body', messageBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Twilio error: ${errorText}` };
      }

      return { success: true, message: 'Birthday WhatsApp sent via Twilio' };
    } else if (config.provider === 'meta') {
      const accessToken = config.metaAccessToken || '';
      const phoneNumberId = config.metaPhoneNumberId || '';

      if (!accessToken || !phoneNumberId) {
        return { success: false, message: 'Meta WhatsApp credentials not configured' };
      }

      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

      const requestBody = {
        messaging_product: 'whatsapp',
        to: cleaned.replace('+', ''),
        type: 'text',
        text: { body: messageBody },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Meta error: ${errorText}` };
      }

      return { success: true, message: 'Birthday WhatsApp sent via Meta' };
    }

    return { success: false, message: 'Unknown WhatsApp provider' };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown WhatsApp error';
    return { success: false, message: errMsg };
  }
}

/**
 * Send birthday greeting via SMS (fallback channel).
 */
async function sendBirthdaySMS(
  businessOwnerId: string,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  // Find SMS integration for this business
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'sms_gateway',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return { success: false, message: 'SMS integration not configured or inactive' };
  }

  const config = integration.config as unknown as {
    provider: 'twilio' | 'msg91';
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    msg91AuthKey?: string;
    msg91SenderId?: string;
    msg91RouteId?: string;
    defaultCountryCode?: string;
  };

  // Normalize phone
  const countryCode = config.defaultCountryCode || '+91';
  let cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = `${countryCode}${cleaned}`;
  }

  try {
    if (config.provider === 'twilio') {
      const accountSid = config.twilioAccountSid || '';
      const authToken = config.twilioAuthToken || '';
      const fromNumber = config.twilioFromNumber || '';

      if (!accountSid || !authToken || !fromNumber) {
        return { success: false, message: 'Twilio SMS credentials not configured' };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', cleaned);
      params.append('From', fromNumber);
      params.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Twilio SMS error: ${errorText}` };
      }

      return { success: true, message: 'Birthday SMS sent via Twilio' };
    } else if (config.provider === 'msg91') {
      const authKey = config.msg91AuthKey || '';
      const senderId = config.msg91SenderId || '';
      const routeId = config.msg91RouteId || '4';

      if (!authKey || !senderId) {
        return { success: false, message: 'MSG91 credentials not configured' };
      }

      const url = 'https://api.msg91.com/api/v5/flow/';
      const phoneWithoutPlus = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;

      const requestBody = {
        sender: senderId,
        route: routeId,
        country: phoneWithoutPlus.substring(0, 2),
        sms: [{ message, to: [phoneWithoutPlus] }],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `MSG91 error: ${errorText}` };
      }

      return { success: true, message: 'Birthday SMS sent via MSG91' };
    }

    return { success: false, message: 'Unknown SMS provider' };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown SMS error';
    return { success: false, message: errMsg };
  }
}

/**
 * Log campaign activity to IntegrationLog.
 *
 * Uses either WhatsApp or SMS integration's log, whichever is available.
 */
async function logCampaignActivity(
  businessOwnerId: string,
  action: string,
  status: string,
  payload: Record<string, unknown>,
  errorMessage: string | null
): Promise<void> {
  // Try to find whatsapp or sms integration for logging
  const integration = await prisma.integration.findFirst({
    where: {
      businessOwnerId,
      provider: { in: ['whatsapp_business', 'sms_gateway'] },
      status: 'active',
    },
  });

  if (!integration) {
    // No active messaging integration, skip logging
    return;
  }

  await prisma.integrationLog.create({
    data: {
      integrationId: integration.id,
      action,
      status,
      requestPayload: JSON.parse(JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        campaign: 'birthday',
      })),
      responsePayload: Prisma.JsonNull,
      errorMessage,
    },
  });
}

/**
 * Schedule the birthday campaign cron job.
 *
 * Call this function during server startup to register the daily
 * birthday campaign that runs at 9:00 AM server time.
 */
export function scheduleBirthdayCampaign(): void {
  function scheduleNextRun(): void {
    const now = new Date();
    const today9AM = new Date(now);
    today9AM.setHours(9, 0, 0, 0);

    let nextRun: Date;
    if (now >= today9AM) {
      // Already past 9 AM today, schedule for tomorrow
      nextRun = new Date(today9AM);
      nextRun.setDate(nextRun.getDate() + 1);
    } else {
      nextRun = today9AM;
    }

    const delay = nextRun.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        console.log('[Marketing Automation] Running birthday campaign...');
        const result = await runBirthdayCampaign();
        console.log(`[Marketing Automation] Birthday campaign complete:`, {
          totalCustomers: result.totalCustomers,
          messagesSent: result.messagesSent,
          messagesFailed: result.messagesFailed,
          discountsCreated: result.discountsCreated,
        });
        if (result.errors.length > 0) {
          console.warn(`[Marketing Automation] Errors:`, result.errors);
        }
      } catch (error) {
        console.error('[Marketing Automation] Birthday campaign failed:', error);
      }

      // Schedule next run
      scheduleNextRun();
    }, delay);

    console.log(`[Marketing Automation] Birthday campaign scheduled for ${nextRun.toISOString()}`);
  }

  scheduleNextRun();
}
