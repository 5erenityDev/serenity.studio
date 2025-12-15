import { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID as string,
      clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
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
};