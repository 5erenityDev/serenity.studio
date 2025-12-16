import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  if (!secret) throw new Error('TWITCH_WEBHOOK_SECRET is not defined');

  // 1. Grab the raw body (needed for signature verification)
  const bodyText = await req.text();
  
  // 2. Grab the Twitch headers
  const headerPayload = await headers();
  const messageId = headerPayload.get('Twitch-Eventsub-Message-Id');
  const timestamp = headerPayload.get('Twitch-Eventsub-Message-Timestamp');
  const signature = headerPayload.get('Twitch-Eventsub-Message-Signature');
  const messageType = headerPayload.get('Twitch-Eventsub-Message-Type');

  if (!signature || !messageId || !timestamp || !messageType) {
    return new NextResponse('Missing headers', { status: 400 });
  }

  // 3. Verify the Signature (HMAC-SHA256)
  // We recreate the signature using our secret and compare it to what Twitch sent.
  const hmac = crypto.createHmac('sha256', secret);
  const hmacMessage = messageId + timestamp + bodyText;
  const computedSignature = `sha256=${hmac.update(hmacMessage).digest('hex')}`;

  if (computedSignature !== signature) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  // 4. Parse the data
  const payload = JSON.parse(bodyText);

  // 5. Handle the "Verification Handshake"
  // When you first register the webhook, Twitch sends a challenge to see if you exist.
  if (messageType === 'webhook_callback_verification') {
    return new NextResponse(payload.challenge, { status: 200 });
  }

  // 6. Handle the Actual Redemption Event
  if (messageType === 'notification' && payload.subscription.type === 'channel.channel_points_custom_reward_redemption.add') {
    const redemption = payload.event;
    const { user_id, user_name, reward } = redemption;
    const rewardTitle = reward.title;

    console.log(`🎁 Redeem: ${user_name} -> ${rewardTitle}`);

    try {
      // 1. Ensure User Exists
      await prisma.user.upsert({
        where: { id: user_id },
        update: { name: user_name },
        create: { id: user_id, name: user_name },
      });

      // ---------------------------------------------------------
      // 2. CHECK FOR DUPLICATES (The "One Per Lifetime" Logic)
      // ---------------------------------------------------------
      
      // Define which items are "Unique"
      // You can add event plushies here later, e.g. ["Test Plush", "Halloween 2025"]
      const uniqueItems = ["Test Plush"];

      if (uniqueItems.includes(rewardTitle)) {
        // Check if they already have it
        const existingToy = await prisma.toy.findFirst({
          where: {
            userId: user_id,
            name: rewardTitle, // Matches the exact reward name
          },
        });

        if (existingToy) {
          console.log(`⚠️ User ${user_name} already has ${rewardTitle}. Skipping add.`);
          // We return 200 OK so Twitch knows we received the message.
          // If we returned an error, Twitch would retry 5 times.
          return new NextResponse('Duplicate Item Ignored', { status: 200 });
        }
      }

      // ---------------------------------------------------------
      // 3. Create the Toy (Only if they didn't have it)
      // ---------------------------------------------------------
      await prisma.toy.create({
        data: {
          name: rewardTitle,
          type: "Channel Redeem",
          userId: user_id,
        },
      });

      return new NextResponse('Toy Added', { status: 200 });

    } catch (error) {
      console.error('Database Error:', error);
      return new NextResponse('Database Error', { status: 500 });
    }
  }

  return new NextResponse('Success', { status: 200 });
}