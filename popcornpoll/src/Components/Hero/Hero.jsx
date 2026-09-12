import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#a6f3ff] pt-20 pb-24 md:pt-32 md:pb-36 px-6 lg:px-12 flex items-center min-h-[600px]">
      {/* Decorative floating shapes resembling the reference */}
      <div className="absolute top-10 left-10 w-96 h-96 opacity-20 pointer-events-none hidden md:block">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#000000" d="M42.7,-73.4C55.9,-67.8,67.6,-57.4,76.5,-45.1C85.4,-32.8,91.5,-18.6,90.4,-4.9C89.3,8.8,81,22,72.4,34.5C63.8,47,54.9,58.8,43.2,66.8C31.5,74.7,17,78.8,3.2,74.4C-10.6,70,-23.6,57.1,-37.2,48.1C-50.8,39,-65,33.7,-74.6,23.3C-84.2,12.9,-89.2,-2.7,-86.3,-17.1C-83.3,-31.6,-72.4,-44.9,-59.8,-52.3C-47.2,-59.7,-32.9,-61.2,-19.7,-65.4C-6.5,-69.6,5.6,-76.6,18.8,-79.8C32,-83,45.4,-82.3,42.7,-73.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="absolute top-1/4 right-[10%] rotate-45 w-48 h-12 bg-[#ffea2a] rounded-full hidden md:block z-0" />
      <div className="absolute top-[35%] right-[5%] rotate-[-20deg] w-64 h-16 bg-[#b268f7] rounded-full hidden lg:block z-0" />
      
      {/* Grid Pattern Element (Right side) */}
      <div className="absolute right-0 top-10 w-64 h-64 grid grid-cols-10 grid-rows-10 gap-1 opacity-40 hidden xl:grid">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className={`w-full h-full ${Math.random() > 0.7 ? 'bg-[#b268f7]' : Math.random() > 0.8 ? 'bg-[#00c9ea]' : ''}`}></div>
        ))}
      </div>

      <div className="container relative z-10 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col items-start gap-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-black/5 text-sm font-semibold tracking-wide text-black/80">
            <span className="flex h-2 w-2 rounded-full bg-black"></span>
            PopcornPoll Platform
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-black leading-[0.95] tracking-tighter">
            Decide<br />
            What to Watch,<br />
            Together.
          </h1>
          
          <p className="text-lg md:text-xl font-medium text-black/70 max-w-xl pr-4">
            The world's best real-time, multi-option movie and TV show polls, all in one place. 
            Search, filter, cast votes, and analyze stats with friends, family, or your online community.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Link to="/poll/create" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-black text-white hover:bg-black/80 text-base h-14 px-8 rounded-md font-semibold">
                Create a Poll
              </Button>
            </Link>
            <Link to="/browse" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/90 text-black border-transparent hover:bg-white text-base h-14 px-8 rounded-md font-semibold shadow-sm">
                Browse Movies
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Content - Mockup */}
        <div className="hidden lg:flex w-full justify-end relative">
          {/* Main Card Mockup */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white p-8 w-full max-w-sm shrink-0 rotate-1 hover:rotate-0 transition-transform duration-500 relative z-20">
            <h3 className="font-bold text-lg mb-6 flex items-center justify-between">
              What should we watch tonight?
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Inception</span>
                  <span>70%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: "70%" }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Interstellar</span>
                  <span>45%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>The Dark Knight</span>
                  <span>60%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: "60%" }}></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1">184 votes cast</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active</span>
            </div>
          </div>
          
          {/* Second overlapping minimalist card piece */}
          <div className="absolute -bottom-10 -left-10 bg-black text-white p-6 rounded-xl shadow-xl border border-gray-800 rotate-[-4deg] hover:rotate-0 transition-transform duration-500 z-30">
             <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1 block">Trending</span>
             <h4 className="font-semibold">Best Sci-Fi of all time?</h4>
             <p className="text-sm text-gray-400 mt-2">1,204 voters active</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
