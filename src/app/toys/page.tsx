import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth"; // Import your options
import { prisma } from "@/lib/prisma"; // Import the DB connection

export default async function ToysPage() {
  // 1. Get the session on the server
  const session = await getServerSession(authOptions);

  // 2. Check if logged in
  if (!session || !session.user) {
    redirect("/");
  }

  // 3. Fetch the user AND their toys from the database
  // "Include" tells Prisma to join the Toys table results
  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      toys: true,
    },
  });

  // If the user isn't in the DB yet (e.g. they logged in but seed didn't run for them)
  if (!dbUser) {
    return <div className="text-white p-10">User not found in database.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 text-white font-mono">
      <h1 className="text-4xl font-bold mb-8 text-purple-400">
        {dbUser.name}&apos;s Inventory
      </h1>

      <div className="w-full max-w-4xl p-6">
        {dbUser.toys.length === 0 ? (
          <p className="text-center text-gray-500">You have no toys yet...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbUser.toys.map((toy) => (
              <div 
                key={toy.id} 
                className="bg-gray-900 border border-purple-500/30 p-6 rounded-lg flex justify-between items-center hover:bg-gray-800 transition"
              >
                <div>
                  <h3 className="text-xl font-bold text-yellow-400">{toy.name}</h3>
                  <p className="text-sm text-gray-400">{toy.type}</p>
                </div>
                <div className="text-xs text-gray-600">
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