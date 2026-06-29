import React from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import Star from "../../assets/star.png";
import "./MovieCard.css";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleCreateInstantPoll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save as draft and redirect to create page
    sessionStorage.setItem("draft_poll_movies", JSON.stringify([movie]));
    navigate("/poll/create");
    showToast(`Started a poll draft with "${movie.title || movie.original_title}"`, "success");
  };

  const handleAddToDraftPoll = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const draft = JSON.parse(sessionStorage.getItem("draft_poll_movies") || "[]");
      
      if (draft.some((m) => m.id === movie.id)) {
        showToast(`"${movie.title || movie.original_title}" is already in your poll draft!`, "warning");
        return;
      }
      
      if (draft.length >= 8) {
        showToast("You can only add up to 8 movies to a poll.", "error");
        return;
      }

      const updatedDraft = [...draft, movie];
      sessionStorage.setItem("draft_poll_movies", JSON.stringify(updatedDraft));
      
      // Dispatch custom event to let Navbar know
      window.dispatchEvent(new Event("draftPollUpdated"));
      showToast(`Added "${movie.title || movie.original_title}" to poll draft (${updatedDraft.length}/8)`, "success");
    } catch (err) {
      console.error(err);
      showToast("Could not add movie to draft.", "error");
    }
  };

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80";

  const releaseYear = movie.release_date 
    ? movie.release_date.substring(0, 4) 
    : "N/A";

  const rating = movie.imdbRating 
    ? parseFloat(movie.imdbRating).toFixed(1) 
    : (movie.vote_average ? movie.vote_average.toFixed(1) : "0.0");

  const imdbUrl = movie.imdbID 
    ? `https://www.imdb.com/title/${movie.imdbID}/`
    : `https://www.imdb.com/find?q=${encodeURIComponent(movie.title || movie.original_title)}`;

  return (
    <div className="movie-card glass-panel">
      <a 
        href={imdbUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="movie-card-link-wrapper"
        style={{ display: "flex", flexDirection: "column", flexGrow: 1, textDecoration: "none", color: "inherit" }}
      >
        <div className="movie-poster-container">
          <img 
            src={posterUrl} 
            alt={movie.title || movie.original_title} 
            className="movie-poster" 
            loading="lazy"
          />
          <div className="movie-rating-badge">
            <span>{rating}</span>
            <img src={Star} alt="Star" className="card-emoji" />
          </div>
        </div>
        
        <div className="movie-details">
          <h4 className="movie-title">{movie.title || movie.original_title}</h4>
          <div className="movie-meta">
            <span className="movie-year">📅 {releaseYear}</span>
            {movie.runtime && <span className="movie-runtime">⏱️ {movie.runtime}</span>}
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="movie-genres">
              {movie.genres.slice(0, 2).map((g, i) => (
                <span key={i} className="genre-tag">{g}</span>
              ))}
            </div>
          )}

          <p className="movie-plot">
            {movie.plot || movie.overview 
              ? ((movie.plot || movie.overview).slice(0, 80) + "...") 
              : "No description available."}
          </p>
        </div>
      </a>
      
      <div style={{ padding: "0 18px 18px 18px" }}>
        <div className="movie-card-actions">
          <button 
            onClick={handleAddToDraftPoll}
            className="btn btn-secondary btn-card-action"
            title="Add to poll draft"
          >
            ➕ Add
          </button>
          <button 
            onClick={handleCreateInstantPoll}
            className="btn btn-primary btn-card-action"
            title="Create instant poll with this movie"
          >
            ⚡ Poll
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
