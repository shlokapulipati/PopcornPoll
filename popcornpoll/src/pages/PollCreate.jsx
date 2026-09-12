import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { safeJSONParse, safeJSONSet } from "../utils/safeStorage";
import { useToast } from "../context/ToastContext";
import { searchTMDBMovies } from "../utils/api";
import { Button } from "@/components/ui/button";

const PollCreate = () => {
  const { user, loading, setAuthModalOpen } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [creatorName, setCreatorName] = useState(
    user && !user.isAnonymous ? user.displayName : ""
  );

  const getDefaultExpiryString = (hours = 24) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [expiryType, setExpiryType] = useState("24h");
  const [customExpiry, setCustomExpiry] = useState(getDefaultExpiryString(24));
  const [selectedMovies, setSelectedMovies] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (loading || !user || user.isAnonymous) return;
    try {
      const draft = safeJSONParse("draft_poll_movies", [], sessionStorage);
      if (draft.length > 0) {
        setSelectedMovies(draft);
        showToast(`Loaded ${draft.length} movies from your browse draft!`, "info");
      }
    } catch (e) {
      console.warn("Failed to load draft movies", e);
    }
  }, [loading, user]);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      setCreatorName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }

    setSearchLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchTMDBMovies(searchQuery);
        setSearchSuggestions(results.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  const addMovie = (movie) => {
    if (selectedMovies.some((m) => m.id === movie.id)) {
      showToast(`"${movie.title}" is already added!`, "warning");
      return;
    }

    if (selectedMovies.length >= 8) {
      showToast("A poll can have at most 8 options.", "warning");
      return;
    }

    setSelectedMovies((prev) => [...prev, movie]);
    setSearchQuery("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const removeMovie = (movieId) => {
    const updated = selectedMovies.filter((m) => m.id !== movieId);
    setSelectedMovies(updated);
    safeJSONSet("draft_poll_movies", updated, sessionStorage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMovies.length < 2) {
      showToast("Please add at least 2 movies to vote on.", "warning");
      return;
    }

    let expiryDate = null;
    if (expiryType !== "never") {
      const now = new Date();
      if (expiryType === "1h") {
        now.setHours(now.getHours() + 1);
        expiryDate = now;
      } else if (expiryType === "24h") {
        now.setHours(now.getHours() + 24);
        expiryDate = now;
      } else if (expiryType === "7d") {
        now.setDate(now.getDate() + 7);
        expiryDate = now;
      } else if (expiryType === "custom") {
        expiryDate = new Date(customExpiry);
      }
    }

    try {
      const pollId = await createPoll({
        question,
        options: selectedMovies,
        expiresAt: expiryDate
      }, user);

      sessionStorage.removeItem("draft_poll_movies");
      window.dispatchEvent(new Event("draftPollUpdated"));

      showToast("Poll created successfully!", "success");
      navigate(`/poll/${pollId}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to create poll. Try again.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-[#a6f3ff]">
        <h2 className="text-3xl font-bold text-slate-800 animate-pulse">Checking authentication...</h2>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-screen bg-[#a6f3ff] flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-xl p-12 max-w-2xl w-full rounded-[2rem] shadow-2xl border border-white text-center flex flex-col items-center gap-8">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Sign In Required</h1>
          <p className="text-xl font-medium text-slate-600 max-w-lg">
            To ensure high-quality polls and prevent spam, creating polls is restricted to registered members.
          </p>
          <Button 
            size="lg"
            onClick={() => setAuthModalOpen(true)}
            className="h-16 px-10 rounded-full bg-black text-white hover:bg-slate-800 text-xl font-bold shadow-xl"
          >
            Sign In to Create a Poll
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#a6f3ff] py-16 px-6 relative overflow-hidden flex justify-center items-start">
      {/* Decorative background shapes */}
      <div className="absolute top-20 left-[10%] rotate-12 w-32 h-12 bg-[#ffea2a] rounded-full hidden md:block opacity-70 border border-black/10" />
      <div className="absolute top-[40%] right-[10%] rotate-[-15deg] w-48 h-16 bg-[#b268f7] rounded-full hidden xl:block opacity-70 border border-black/10" />

      <div className="bg-white/95 backdrop-blur-xl p-10 md:p-14 max-w-3xl w-full rounded-[2rem] shadow-2xl border border-white relative z-10 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight text-center mb-4">Create a Poll</h1>
        <p className="text-lg text-slate-500 font-medium text-center mb-10 w-full max-w-lg">
          Fill in the details below to create a real-time, shareable movie poll for your community.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full max-w-2xl">
          {/* Question Input */}
          <div className="flex flex-col gap-3">
            <label className="text-base font-black text-slate-800 uppercase tracking-widest">Poll Question / Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Which movie should we watch tonight?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="h-16 px-6 text-lg rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] focus:bg-white transition-colors"
            />
          </div>

          {/* Nickname Input */}
          <div className="flex flex-col gap-3">
            <label className="text-base font-black text-slate-800 uppercase tracking-widest">Creator Nickname</label>
            <input
              type="text"
              required
              placeholder="Enter your nickname (e.g. Popcorn Expert)"
              value={creatorName}
              onChange={(e) => {
                setCreatorName(e.target.value);
                localStorage.setItem("voter_nickname", e.target.value);
              }}
              className="h-16 px-6 text-lg rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] focus:bg-white transition-colors"
            />
          </div>

          {/* Movie Autocomplete search to add options */}
          <div ref={searchRef} className="flex flex-col gap-3 relative">
            <label className="text-base font-black text-slate-800 uppercase tracking-widest">
              Search & Add Options <span className="text-[#b268f7]">({selectedMovies.length}/8)</span>
            </label>
            <input
              type="text"
              placeholder="Type movie name to add..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="h-16 px-6 text-lg rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] focus:bg-white transition-colors"
            />
            
            {showSuggestions && (searchLoading || searchSuggestions.length > 0) && (
              <div className="absolute top-[105%] left-0 right-0 z-50 bg-white border-2 border-slate-100 rounded-2xl shadow-xl overflow-hidden shadow-black/5 py-2">
                {searchLoading ? (
                  <div className="p-4 text-center font-bold text-slate-400">Searching...</div>
                ) : (
                  searchSuggestions.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => addMovie(movie)}
                      className="px-6 py-4 cursor-pointer hover:bg-[#a6f3ff]/20 font-semibold border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <span>{movie.title} <span className="text-slate-400">({(movie.release_date || "").substring(0, 4)})</span></span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Movies Preview List */}
          {selectedMovies.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t-2 border-slate-100 mt-4">
              <label className="text-base font-black text-slate-800 uppercase tracking-widest">
                Poll Options Confirmed
              </label>
              <div className="flex flex-col gap-3">
                {selectedMovies.map((movie, idx) => (
                  <div 
                    key={movie.id} 
                    className="flex justify-between items-center p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl group hover:border-[#00c9ea] transition-colors"
                  >
                    <div className="flex items-center gap-4 text-lg font-bold">
                      <span className="text-xl font-black text-[#00c9ea] opacity-80">#{idx + 1}</span>
                      <span className="text-slate-900">{movie.title || movie.original_title} <span className="text-slate-500 font-medium">({(movie.release_date || "").substring(0, 4)})</span></span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeMovie(movie.id)}
                      className="text-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiration Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col gap-3">
              <label className="text-base font-black text-slate-800 uppercase tracking-widest">Duration</label>
              <select
                value={expiryType}
                onChange={(e) => setExpiryType(e.target.value)}
                className="h-16 px-5 text-lg rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] font-semibold transition-colors"
              >
                <option value="1h">1 Hour (Quick)</option>
                <option value="24h">24 Hours (Standard)</option>
                <option value="7d">7 Days (Long)</option>
                <option value="never">Never Expires</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            {expiryType === "custom" && (
              <div className="flex flex-col gap-3">
                <label className="text-base font-black text-slate-800 uppercase tracking-widest">Custom Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  className="h-16 px-5 text-lg rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#00c9ea] font-semibold transition-colors"
                />
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            size="lg"
            className="w-full h-20 text-2xl font-black bg-black text-white hover:bg-slate-800 rounded-2xl shadow-xl mt-6 transition-transform hover:scale-[1.02]"
          >
            🚀 Publish Poll
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PollCreate;
