import React, { useState, useEffect } from "react";
import Hero from "../Components/Hero/Hero";
import PollCard from "../Components/Poll/PollCard";
import MovieList from "../Components/MovieList/MovieList";
import { fetchPolls } from "../utils/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired } from "../utils/helpers";

const Home = () => {
  const [activePolls, setActivePolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);

  useEffect(() => {
    const getRecentPolls = async () => {
      try {
        const polls = await fetchPolls("recent", 50);
        const active = polls.filter(p => !isExpired(p.expiresAt));
        
        // Deduplicate duplicate questions in UI
        const uniqueActive = [];
        const seenQuestions = new Set();
        for (const p of active) {
          const lowerQuestion = (p.question || "").toLowerCase().trim();
          if (!seenQuestions.has(lowerQuestion)) {
            seenQuestions.add(lowerQuestion);
            uniqueActive.push(p);
          }
        }
        
        setActivePolls(uniqueActive.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch polls", err);
      } finally {
        setPollsLoading(false);
      }
    };
    getRecentPolls();
  }, []);

  return (
    <div className="min-h-screen bg-[#a6f3ff] relative overflow-hidden pb-24">
      {/* Decorative background shapes */}
      <div className="absolute top-[15%] left-[5%] rotate-[15deg] w-48 h-16 bg-[#ffea2a] rounded-full hidden md:block opacity-60 border border-black/10 mix-blend-multiply" />
      <div className="absolute top-[45%] right-[5%] w-72 h-72 bg-[#b268f7] rounded-full hidden xl:block opacity-40 border border-black/10 mix-blend-multiply" />
      <div className="absolute bottom-[10%] left-[10%] rotate-[-25deg] w-40 h-20 bg-[#00c9ea] rounded-full hidden lg:block opacity-50 border border-black/10 mix-blend-multiply" />
      <div className="absolute top-[80%] right-[20%] rotate-[40deg] w-32 h-12 bg-[#ffea2a] rounded-full hidden md:block opacity-60 border border-black/10 mix-blend-multiply" />

      <Hero />
      
      {/* Active Polls Section */}
      <section className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
            Live Polls
          </h2>
        </div>

        {pollsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white/40 border-2 border-white rounded-[2rem] p-8 shadow-sm h-64 flex flex-col gap-4">
                <Skeleton className="h-8 w-3/4 bg-white/60" />
                <Skeleton className="h-4 w-1/2 bg-white/60" />
                <Skeleton className="h-24 w-full mt-4 bg-white/60" />
              </div>
            ))}
          </div>
        ) : activePolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-xl border border-white rounded-[3rem] p-16 text-center shadow-xl">
            <p className="text-xl font-bold text-slate-500">No active polls found. Be the first to create one!</p>
          </div>
        )}
      </section>

      {/* Movies Showcases */}
      <div className="container mx-auto px-6 max-w-7xl relative z-10 mt-24 flex flex-col gap-24">
        <MovieList type="popular" title="Popular Movies" />
        <MovieList type="top_rated" title="Top Rated Movies" />
      </div>
    </div>
  );
};

export default Home;
