import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  if (!secret) throw new Error('TWITCH_WEBHOOK_SECRET is not defined');

  // 1. Grab raw body & headers
  const bodyText = await req.text();
  const headerPayload = await headers();
  const messageId = headerPayload.get('Twitch-Eventsub-Message-Id');
  const timestamp = headerPayload.get('Twitch-Eventsub-Message-Timestamp');
  const signature = headerPayload.get('Twitch-Eventsub-Message-Signature');
  const messageType = headerPayload.get('Twitch-Eventsub-Message-Type');

  if (!signature || !messageId || !timestamp || !messageType) {
    return new NextResponse('Missing headers', { status: 400 });
  }

  // 2. Verify Signature
  const hmac = crypto.createHmac('sha256', secret);
  const hmacMessage = messageId + timestamp + bodyText;
  const computedSignature = `sha256=${hmac.update(hmacMessage).digest('hex')}`;

  if (computedSignature !== signature) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  // 3. Parse Data
  const payload = JSON.parse(bodyText);

  // 4. Handle Verification Handshake
  if (messageType === 'webhook_callback_verification') {
    return new NextResponse(payload.challenge, { status: 200 });
  }

  // 5. PROCESS NOTIFICATIONS
  if (messageType === 'notification') {
    const eventType = payload.subscription.type;
    const eventData = payload.event;

    try {
      // =========================================================
      // CASE A: CHANNEL POINT REDEMPTION
      // =========================================================
      if (eventType === 'channel.channel_points_custom_reward_redemption.add') {
        const { user_id, user_name, reward } = eventData;
        const rewardTitle = reward.title;

        console.log(`🎁 Redeem: ${user_name} -> ${rewardTitle}`);

        // A1. Upsert User
        await prisma.user.upsert({
          where: { id: user_id },
          update: { name: user_name },
          create: { id: user_id, name: user_name },
        });

        // A2. Check Duplicates (One Per Lifetime)
        const uniqueItems = ["Test Plush"]; // Add more unique items here
        
        if (uniqueItems.includes(rewardTitle)) {
          const existingToy = await prisma.toy.findFirst({
            where: { userId: user_id, name: rewardTitle },
          });

          if (existingToy) {
            console.log(`⚠️ User ${user_name} already has ${rewardTitle}. Skipping.`);
            return new NextResponse('Duplicate Item Ignored', { status: 200 });
          }
        }

        // A3. Create Toy
        await prisma.toy.create({
          data: {
            name: rewardTitle,
            type: "Channel Redeem",
            userId: user_id,
          },
        });
      }

      // =========================================================
      // CASE B: SUBSCRIPTION (New Sub or Resub)
      // =========================================================
      else if (eventType === 'channel.subscribe') {
        const { user_id, user_name, tier } = eventData;
        console.log(`⭐ New Sub: ${user_name} (Tier ${tier})`);

        // B1. Upsert User
        await prisma.user.upsert({
          where: { id: user_id },
          update: { name: user_name },
          create: { id: user_id, name: user_name },
        });

        // B2. Give "Subscriber Sword"
        // (Optional: You can add duplicate logic here too if you only want 1 sword ever)
        await prisma.toy.create({
          data: {
            name: "Subscriber Sword", 
            type: "Subscription Reward",
            userId: user_id,
          },
        });
      }

      // =========================================================
      // CASE C: BITS (Cheer)
      // =========================================================
      else if (eventType === 'channel.cheer') {
        const { user_id, user_name, bits } = eventData;
        console.log(`💎 Bits: ${user_name} dropped ${bits}`);

        // C1. Upsert User (Anonymous cheerers might not have a user_id, check for null!)
        if (user_id) {
            await prisma.user.upsert({
                where: { id: user_id },
                update: { name: user_name },
                create: { id: user_id, name: user_name },
            });

            // C2. Reward Logic (Example: 1 Gemstone per 100 bits)
            if (bits >= 100) {
                const gemCount = Math.floor(bits / 100);
                // Loop to add multiple gems, or just add one big "Bag of Gems"
                // For now, let's just give them a "Bits Gemstone" item
                await prisma.toy.create({
                    data: {
                        name: "Bits Gemstone",
                        type: "Currency",
                        userId: user_id,
                    },
                });
            }
        }
      }

      return new NextResponse('Event Processed', { status: 200 });

    } catch (error) {
      console.error('Database Error:', error);
      return new NextResponse('Database Error', { status: 500 });
    }
  }

  return new NextResponse('Success', { status: 200 });
}