import React, { useState, useEffect, useRef } from "react";
import useMovies from "../hooks/useMovies";
import MovieCard from "../Components/MovieList/MovieCard";
import { Skeleton } from "../Components/UI/UIComponents";
import { searchTMDBMovies } from "../utils/api";

const Browse = () => {
  const { movies, genres, loading, error, getMovieList, searchMovies, setMovies } = useMovies();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Advanced Filter state
  const [selectedGenre, setSelectedGenre] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [yearStart, setYearStart] = useState("1990");
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear().toString());

  const debounceTimer = useRef(null);
  const searchRef = useRef(null);

  // Fetch popular movies by default on mount
  useEffect(() => {
    getMovieList("popular");
  }, []);

  // Handle autocomplete search suggestions
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

  // Click outside listener for suggestions dropdown
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

  // Re-apply filters when filter states change
  const applyFilters = () => {
    // Trigger search query with updated filters
    if (searchQuery.trim() !== "") {
      searchMovies(searchQuery, {
        genre: selectedGenre,
        minRating: minRating !== "0" ? minRating : null,
        yearStart,
        yearEnd
      });
    } else {
      // If no query, apply filters to the standard list
      getMovieList("popular").then(() => {
        // Wait, hook update is asynchronous, so we handle it inside hook or local filter.
      });
    }
  };

  useEffect(() => {
    // If not searching, just apply local filters or re-fetch
    if (searchQuery.trim() === "") {
      // Refresh list
      getMovieList("popular");
    } else {
      handleSearchSubmit();
    }
  }, [selectedGenre, minRating, yearStart, yearEnd]);

  return (
    <div className="container section-padding" style={{ minHeight: "80vh" }}>
      <header style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔍 Find Movies & TV Shows</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto" }}>
          Search for content to review ratings, cast details, and instantly add them to your polls.
        </p>
      </header>

      {/* Advanced Search Bar & Autocomplete */}
      <div 
        ref={searchRef} 
        style={{ position: "relative", maxWidth: "680px", margin: "0 auto 40px auto" }}
      >
        <form onSubmit={handleSearchSubmit} className="align_center" style={{ gap: "10px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Search by title (e.g., Inception, Breaking Bad)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--text-color)",
                fontSize: "1rem"
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="glass-panel" 
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-lg)"
                }}
              >
                {suggestions.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => handleSuggestionClick(movie)}
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    className="suggestion-item"
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{movie.title}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "10px" }}>
                        ({(movie.release_date || "").substring(0, 4)})
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--primary-color)" }}>⭐ {movie.vote_average.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "14px 24px" }}>
            Search
          </button>
        </form>
      </div>

      {/* Advanced Filter Panel */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "24px", 
          marginBottom: "40px", 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
          gap: "20px" 
        }}
      >
        {/* Genre selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>GENRE</label>
          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--input-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)"
            }}
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Min Rating selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>MIN IMDB RATING</label>
          <select 
            value={minRating} 
            onChange={(e) => setMinRating(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--input-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)"
            }}
          >
            <option value="0">All Ratings</option>
            <option value="6">6.0+ IMDb</option>
            <option value="7">7.0+ IMDb</option>
            <option value="8">8.0+ IMDb</option>
          </select>
        </div>

        {/* Release Year start selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>RELEASE YEAR FROM</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear().toString()}
            value={yearStart}
            onChange={(e) => setYearStart(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--input-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)"
            }}
          />
        </div>

        {/* Release Year end selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>RELEASE YEAR TO</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear().toString()}
            value={yearEnd}
            onChange={(e) => setYearEnd(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--input-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)"
            }}
          />
        </div>
      </div>

      {/* Movie Grid */}
      {error && (
        <div style={{ color: "var(--danger-color)", padding: "20px", textAlign: "center" }}>
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid-responsive">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="glass-panel" style={{ padding: "18px" }}>
              <Skeleton type="poster" />
              <Skeleton type="title" />
              <Skeleton type="text" />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {movies.length > 0 ? (
            <div className="grid-responsive">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>🎬 No movies found</p>
              <p>Try searching for a different title or resetting the advanced filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Browse;
