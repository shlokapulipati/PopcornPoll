import React, { useState, useEffect, useRef } from "react";
import useMovies from "../hooks/useMovies";
import MovieCard from "../Components/MovieList/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { searchTMDBMovies } from "../utils/api";
import { Button } from "@/components/ui/button";

const Browse = () => {
  const { movies, genres, loading, error, getMovieList, searchMovies, setMovies } = useMovies();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Advanced Filter state
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [yearStart, setYearStart] = useState("1990");
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear().toString());

  const debounceTimer = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    getMovieList("popular");
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchTMDBMovies(searchQuery);
        setSuggestions(results.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    
    if (searchQuery.trim() === "") {
      getMovieList("popular");
      return;
    }

    searchMovies(searchQuery, {
      genre: selectedGenre,
      minRating: minRating !== "0" ? minRating : null,
      yearStart,
      yearEnd
    });
  };

  const handleSuggestionClick = (movie) => {
    setSearchQuery(movie.title);
    setSuggestions([]);
    setShowSuggestions(false);
    searchMovies(movie.title, {
      genre: selectedGenre,
      minRating: minRating !== "0" ? minRating : null,
      yearStart,
      yearEnd
    });
  };

  const applyFilters = () => {
    if (searchQuery.trim() !== "") {
      searchMovies(searchQuery, {
        genre: selectedGenre,
        minRating: minRating !== "0" ? minRating : null,
        yearStart,
        yearEnd
      });
    } else {
      getMovieList("popular").then(() => {});
    }
  };

  useEffect(() => {
    const filters = {
      genre: selectedGenre,
      minRating: minRating !== "0" ? minRating : null,
      yearStart,
      yearEnd,
      country: selectedCountry
    };
    
    if (searchQuery.trim() === "") {
      getMovieList("popular", filters);
    } else {
      searchMovies(searchQuery, filters);
    }
  }, [selectedGenre, minRating, yearStart, yearEnd, selectedCountry]);

  return (
    <div className="min-h-screen bg-[#a6f3ff] pt-16 pb-32 px-6 relative overflow-hidden">
      <div className="absolute top-20 right-[5%] rotate-[10deg] w-40 h-16 bg-[#ffea2a] rounded-full hidden md:block opacity-70 border border-black/10 mix-blend-multiply" />
      <div className="absolute top-[40%] left-[10%] w-32 h-32 bg-[#b268f7] rounded-full hidden xl:block opacity-50 border border-black/10 mix-blend-multiply" />

      <header className="max-w-4xl mx-auto text-center mb-12 relative z-10">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">Find Movies & TV</h1>
        <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
          Search for content to review ratings, cast details, and instantly add them to your polls.
        </p>
      </header>

      {/* Advanced Search Bar & Autocomplete */}
      <div ref={searchRef} className="max-w-3xl mx-auto mb-10 relative z-20">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by title (e.g., Inception)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full h-16 px-6 text-xl font-semibold rounded-[2rem] border-4 border-slate-900 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00c9ea] shadow-[4px_4px_0_rgb(15,23,42)] transition-colors"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white border-2 border-slate-200 rounded-[1rem] overflow-hidden shadow-2xl py-2">
                {suggestions.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => handleSuggestionClick(movie)}
                    className="px-6 py-3 cursor-pointer hover:bg-[#a6f3ff]/20 font-bold border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-slate-900">{movie.title}</span>
                      <span className="text-sm text-slate-400">
                        ({(movie.release_date || "").substring(0, 4)})
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#00c9ea] border-2 border-[#00c9ea]/20 px-2 py-1 rounded-lg bg-[#a6f3ff]/10">{(movie.vote_average || 0).toFixed(1)} Rating</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            size="lg"
            className="h-16 px-10 rounded-[2rem] bg-black text-white hover:bg-slate-800 text-xl font-bold shadow-[4px_4px_0_rgb(15,23,42)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Advanced Filter Panel */}
      <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white mb-12 relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        
        {/* Country selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Country</label>
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="h-14 px-4 text-base font-bold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] transition-colors shadow-sm cursor-pointer"
          >
            <option value="">Global</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="IN">India</option>
            <option value="JP">Japan</option>
            <option value="KR">South Korea</option>
          </select>
        </div>
        
        {/* Genre selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Genre</label>
          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="h-14 px-4 text-base font-bold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] transition-colors shadow-sm cursor-pointer"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Min Rating selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Min IMDb</label>
          <select 
            value={minRating} 
            onChange={(e) => setMinRating(e.target.value)}
            className="h-14 px-4 text-base font-bold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] transition-colors shadow-sm cursor-pointer"
          >
            <option value="0">All</option>
            <option value="6">6.0+</option>
            <option value="7">7.0+</option>
            <option value="8">8.0+</option>
          </select>
        </div>

        {/* Release Year start selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-slate-800 uppercase tracking-widest">From</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear().toString()}
            value={yearStart}
            onChange={(e) => setYearStart(e.target.value)}
            className="h-14 px-4 text-base font-bold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] transition-colors shadow-sm"
          />
        </div>

        {/* Release Year end selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-slate-800 uppercase tracking-widest">To Year</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear().toString()}
            value={yearEnd}
            onChange={(e) => setYearEnd(e.target.value)}
            className="h-14 px-4 text-base font-bold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Movie Grid */}
      {error && (
        <div className="max-w-5xl mx-auto bg-red-100 border-2 border-red-500 rounded-2xl p-6 text-center text-red-700 font-bold text-lg mb-8 relative z-10">
          Error: {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div key={n} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-[2/3] rounded-2xl bg-white/40" />
                <Skeleton className="h-6 w-3/4 bg-white/40" />
                <Skeleton className="h-4 w-1/2 bg-white/40" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {movies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2rem] border-2 border-white max-w-2xl mx-auto shadow-xl">
                <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full mb-4"></div>
                <p className="text-2xl font-black text-slate-800 mb-2">No movies found</p>
                <p className="text-lg text-slate-500 font-medium">Try searching for a different title or resetting the advanced filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
