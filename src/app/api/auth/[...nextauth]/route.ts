import NextAuth from "next-auth"
import TwitchProvider from "next-auth/providers/twitch"

// 1. Determine the base URL dynamically
// Vercel sets NEXTAUTH_URL automatically if defined in dashboard, 
// otherwise we fallback to localhost for dev.
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const handler = NextAuth({
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID as string,
      clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
      // 2. FORCE the correct redirect URI
      // This explicitly tells Twitch: "Send the user back to the current domain"
      // avoiding the "localhost" mismatch entirely.
      authorization: {
        params: {
          redirect_uri: `${BASE_URL}/api/auth/callback/twitch`,
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture;
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST }