import { getGames } from "@/lib/drupal";
import Link from "next/link"; 
import Image from "next/image"; 

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="">
      <main className="text-white">
        <h1 className="text-4xl font-bold p-4 text-white text-center mb-4">My Games</h1>
        <ul>
          {games.map((game) => (
            <Link key={game.id} href={game.slug || `/games/${game.id}`}>
              <li 
                style={{ backgroundColor: game.primaryColor }}
                // CHANGED: Increased height to h-64 (256px)
                // Added 'group' so we can animate children on hover if we want
                className="h-100 w-full border-b border-black/20 hover:brightness-110 transition-all duration-300 relative overflow-hidden group"
              >
                
                {/* NEW: Inner Container 
                   This keeps the logo and text from drifting too far apart.
                   max-w-6xl keeps it readable on wide screens.
                */}
                <div className="h-full max-w-6xl mx-auto flex flex-col justify-center relative z-10">
                  
                  <div className="flex justify-between items-end mb-4">
                    {/* Logo Container - Made larger */}
                    <div className="relative h-50 w-full "> 
                      {game.logo ? (
                        <img 
                          src={game.logo} 
                          alt={`${game.title} logo`} 
                          className="h-full w-full object-contain object-left drop-shadow-lg" 
                        />
                      ) : (
                        // Fallback Text - Bigger and bolder
                        <h2 className="text-5xl font-black uppercase tracking-tighter drop-shadow-md">
                          {game.title}
                        </h2>
                      )}
                    </div>

                    {/* Date - Styled to look more like a badge or integrated element */}
                    <span className="text-lg font-mono font-bold opacity-80 mix-blend-screen bg-black/20 px-3 py-1 rounded">
                      {game.releaseDate}
                    </span>
                  </div>
                  
                  {/* Tagline - Made larger and restricted width so it doesn't run too long */}
                  <p 
                    style={{ color: game.secondaryColor }} 
                    className="text-2xl font-medium italic max-w-2xl drop-shadow-sm"
                  >
                    {game.tagline}
                  </p>
                </div>
                
              </li>
            </Link>
          ))}
        </ul>
      </main>
    </div>
  );
}