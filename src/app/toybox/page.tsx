import { getServerSession } from "next-auth";
// We removed 'redirect' because we want to show a page instead of kicking them out
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginButton from "../components/LoginButton";

export default async function ToyboxPage() {
  // 1. Get the session
  const session = await getServerSession(authOptions);

  // ------------------------------------------------------------------
  // STATE 1: GUEST (Not Logged In)
  // Instead of redirecting, we return a "Please Login" view immediately.
  // ------------------------------------------------------------------
  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white font-mono p-4">
        <h1 className="text-6xl font-bold mb-6 text-purple-400">
          The Toy Box
        </h1>
        <p className="text-xl text-gray-400 mb-8 text-center max-w-md">
          Connect your Twitch account to view your inventory, track your redemptions, and see your collection.
        </p>
        
        {/* This button will trigger the popup, and upon success, 
            the page will refresh and hit the "Logged In" state below. */}
        <LoginButton />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // STATE 2: LOGGED IN (Fetch Data)
  // If we reach this line, we know 'session.user' exists.
  // ------------------------------------------------------------------
  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      toys: true,
    },
  });

  // ------------------------------------------------------------------
  // STATE 3: NEW USER (Logged in, but no DB entry yet)
  // This handles the edge case where they log in, but haven't redeemed 
  // a toy yet (so the webhook hasn't created them in the DB).
  // ------------------------------------------------------------------
  if (!dbUser) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-20 text-white font-mono">
        <div className="z-10 w-full max-w-5xl flex justify-end pr-4">
          <LoginButton />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-purple-400">
          Welcome, {session.user.name}!
        </h1>
        <div className="bg-gray-900/50 p-8 rounded-xl border border-dashed border-gray-600 text-center">
          <p className="text-xl mb-4">Your inventory is currently empty.</p>
          <p className="text-gray-400">
            Go to the Twitch stream and redeem a reward to initialize your collection!
          </p>
          <p className="mt-8 text-xs text-gray-600">UID: {session.user.id}</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // STATE 4: VETERAN (Full Inventory Display)
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center pt-20 text-white font-mono">
      {/* Login Button in the corner for easy Sign Out */}
      <div className="z-10 w-full max-w-5xl flex justify-end pr-4 mb-4">
        <LoginButton />
      </div>

      <h1 className="text-4xl font-bold mb-8 text-purple-400">
        {dbUser.name}&apos;s Inventory
      </h1>

      <div className="w-full max-w-4xl p-6">
        {dbUser.toys.length === 0 ? (
          <div className="text-center p-10 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-xl text-gray-300">You have no toys yet...</p>
            <p className="text-sm text-gray-500 mt-2">Redeem channel points to see items appear here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbUser.toys.map((toy) => (
              <div 
                key={toy.id} 
                className="bg-gray-900 border border-purple-500/30 p-6 rounded-lg flex justify-between items-center hover:bg-gray-800 transition shadow-lg hover:shadow-purple-500/20"
              >
                <div>
                  <h3 className="text-xl font-bold text-yellow-400">{toy.name}</h3>
                  <p className="text-sm text-gray-400">{toy.type}</p>
                </div>
                <div className="text-xs text-gray-600 text-right">
                  <p>Obtained</p>
                  {new Date(toy.obtainedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-10 text-xs text-gray-600">UID: {dbUser.id}</p>
    </div>
  );
}