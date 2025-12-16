// Run with: npx tsx src/scripts/delete_subs.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function deleteAllSubs() {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing Twitch Credentials in .env.local");
  }

  console.log("🔥 Preparing to delete ALL subscriptions...");

  // 1. Get App Access Token
  const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, { method: 'POST' });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) throw new Error("Failed to get Access Token");

  // 2. Fetch List of Current Subscriptions
  const listRes = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const listData = await listRes.json();
  const subs = listData.data || [];

  if (subs.length === 0) {
    console.log("✅ No subscriptions found. You are clean!");
    return;
  }

  console.log(`found ${subs.length} subscriptions. Deleting...`);

  // 3. Loop and Destroy
  for (const sub of subs) {
    const deleteRes = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`, {
      method: 'DELETE',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (deleteRes.ok) {
      console.log(`🗑️ Deleted ${sub.id} (${sub.status})`);
    } else {
      console.error(`❌ Failed to delete ${sub.id}: ${deleteRes.statusText}`);
    }
  }

  console.log("✨ All clear.");
}

deleteAllSubs();