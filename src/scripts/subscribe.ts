import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// TOGGLE THIS VARIABLE TO SWITCH ENVIRONMENTS
const TARGET_ENV = 'prod'; // Options: 'beta' or 'prod'

async function subscribe() {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const WEBHOOK_SECRET = process.env.TWITCH_WEBHOOK_SECRET;
  const MY_BROADCASTER_ID = "547329691"; 

  // Select the correct URL based on the toggle above
  const CALLBACK_URL = TARGET_ENV === 'prod' 
    ? "https://serenitydev.net/api/webhooks/twitch" 
    : "https://beta.serenitydev.net/api/webhooks/twitch";

  console.log(`📡 Subscribing to ${TARGET_ENV.toUpperCase()}: ${CALLBACK_URL}`);

  // 1. Get Token
  const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, { method: 'POST' });
  const { access_token } = await tokenRes.json();

  // 2. Send Subscription Request
  // We loop through the event types we want
  const events = [
    'channel.channel_points_custom_reward_redemption.add', // Redeems
    'channel.subscribe', // New Subs
    'channel.subscription.message', // Resubs
    'channel.cheer', // Bits
  ];

  for (const type of events) {
    console.log(`📡 Subscribing to ${type}...`);
    
    const subRes = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        // ADD THE ! HERE vvv
        'Client-ID': CLIENT_ID!, 
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type,
        version: '1',
        condition: { broadcaster_user_id: MY_BROADCASTER_ID },
        transport: {
          method: 'webhook',
          callback: CALLBACK_URL,
          secret: WEBHOOK_SECRET!, // Good habit to add it here too
        },
      }),
    });

    if (subRes.ok) {
        console.log(`✅ Success: ${type}`);
    } else {
        const err = await subRes.json();
        console.error(`❌ Failed: ${type}`, JSON.stringify(err, null, 2));
    }
  }

}

subscribe();