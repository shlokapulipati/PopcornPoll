import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { safeJSONParse, safeJSONSet } from "../utils/safeStorage";
import { useToast } from "../context/ToastContext";
import { searchTMDBMovies, fetchTMDBMovies, enrichMoviesWithOMDB } from "../utils/api";
import { Skeleton } from "../Components/UI/UIComponents";

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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load movies from draft on mount
  useEffect(() => {
    // If not loaded yet or not logged in, skip draft loading
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

  // Update creator name if user logs in
  useEffect(() => {
    if (user && !user.isAnonymous) {
      setCreatorName(user.displayName);
    }
  }, [user]);

  // Click outside search listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search input handler
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
    // Keep session draft synchronized
    safeJSONSet("draft_poll_movies", updated, sessionStorage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMovies.length < 2) {
      showToast("Please add at least 2 movies to vote on.", "warning");
      return;
    }

    // Determine Expiration Date
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

      // Clear draft storage
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
      <div className="container section-padding" style={{ maxWidth: "700px", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "32px" }}>
          <h2 style={{ color: "var(--text-color)" }}>Checking authentication...</h2>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="container section-padding" style={{ maxWidth: "700px", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <h1 style={{ fontSize: "2.5rem", color: "var(--text-color)" }}>🔒 Sign In Required</h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px", fontSize: "1.1rem" }}>
            To ensure high-quality polls and prevent spam, creating polls is restricted to registered members.
          </p>
          <button 
            type="button"
            onClick={() => setAuthModalOpen(true)} 
            className="btn btn-primary"
            style={{ padding: "12px 24px", fontSize: "1rem" }}
          >
            Sign In to Create a Poll
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-padding" style={{ maxWidth: "700px" }}>
      <div className="glass-panel" style={{ padding: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px", textAlign: "center" }}>⚡ Create a Poll</h1>
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: "32px" }}>
          Fill in the details below to create a real-time, shareable movie poll.
        </p>



        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Question Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 700 }}>Poll Question / Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Which movie should we watch? 🍿"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--text-color)",
                fontSize: "1rem"
              }}
            />
          </div>

          {/* Nickname Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 700 }}>Creator Nickname</label>
            <input
              type="text"
              required
              placeholder="Enter your nickname (e.g. Popcorn Expert)"
              value={creatorName}
              onChange={(e) => {
                setCreatorName(e.target.value);
                localStorage.setItem("voter_nickname", e.target.value);
              }}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--text-color)",
                fontSize: "1rem"
              }}
            />
          </div>

          {/* Movie Autocomplete search to add options */}
          <div ref={searchRef} style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              Search & Add Movies/TV Shows ({selectedMovies.length}/8)
            </label>
            <input
              type="text"
              placeholder="Type movie name to add..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--text-color)",
                fontSize: "1rem"
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && (searchLoading || searchSuggestions.length > 0) && (
              <div 
                className="glass-panel" 
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginTop: "4px"
                }}
              >
                {searchLoading ? (
                  <div style={{ padding: "16px", textAlign: "center" }}>Searching...</div>
                ) : (
                  searchSuggestions.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => addMovie(movie)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                      className="suggestion-item"
                    >
                      <span>{movie.title} ({(movie.release_date || "").substring(0, 4)})</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Movies Preview List */}
          {selectedMovies.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>
                POLL OPTIONS LIST
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedMovies.map((movie, idx) => (
                  <div 
                    key={movie.id} 
                    className="align_center" 
                    style={{
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      background: "var(--input-bg)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px"
                    }}
                  >
                    <div className="align_center" style={{ gap: "12px" }}>
                      <span style={{ fontWeight: 700, color: "var(--primary-color)" }}>#{idx + 1}</span>
                      <span>{movie.title || movie.original_title} ({(movie.release_date || "").substring(0, 4)})</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeMovie(movie.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger-color)",
                        cursor: "pointer",
                        fontSize: "1.2rem"
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiration Settings */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 700 }}>Poll Duration</label>
              <select
                value={expiryType}
                onChange={(e) => setExpiryType(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--input-bg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-color)"
                }}
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="never">Never Expires</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            {expiryType === "custom" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 700 }}>Custom Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-color)"
                  }}
                />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ padding: "14px", fontSize: "1rem", marginTop: "12px" }}
          >
            🚀 Publish Poll
          </button>
        </form>
      </div>
    </div>
  );
};

export default PollCreate;
