import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchMovieDetails } from "../utils/api";
import { addMovieReview, fetchMovieReviews } from "../utils/firebase";
import { safeJSONParse, safeJSONSet } from "../utils/safeStorage";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Star from "../assets/star.png";
import "./MovieView.css";

const MovieView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Check if liked in local storage
    if (id) {
      const likedMovies = safeJSONParse("liked_movies", {});
      setIsLiked(!!likedMovies[id]);
    }
  }, [id]);

  const handleLike = () => {
    const likedMovies = safeJSONParse("liked_movies", {});
    if (isLiked) {
      delete likedMovies[id];
      showToast("Removed from favorites", "info");
    } else {
      likedMovies[id] = true;
      showToast("Added to favorites ❤️", "success");
    }
    safeJSONSet("liked_movies", likedMovies);
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard! 📋", "success");
  };

  useEffect(() => {
    let isMounted = true;
    const loadMovieAndReviews = async () => {
      setLoading(true);
      try {
        const movieData = await fetchMovieDetails(id);
        const reviewData = await fetchMovieReviews(id);
        
        if (isMounted) {
          setMovie(movieData);
          setReviews(reviewData);
        }
      } catch (err) {
        console.error("Failed to load movie details", err);
        if (isMounted) showToast("Failed to load movie details.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    if (id) {
      loadMovieAndReviews();
    }
    return () => { isMounted = false; };
  }, [id, showToast]);

  const handleSubmitReview = async () => {
    if (!user || user.isAnonymous) {
      showToast("Please log in to submit a review.", "warning");
      return;
    }
    if (rating === 0) {
      showToast("Please select a star rating.", "warning");
      return;
    }
    
    const reviewData = {
      userId: user.uid,
      userName: user.displayName || "Anonymous User",
      rating,
      reviewText
    };
    
    const success = await addMovieReview(id, reviewData);
    if (success) {
      showToast("Review submitted successfully!", "success");
      setIsReviewModalOpen(false);
      // Refresh reviews
      const freshReviews = await fetchMovieReviews(id);
      setReviews(freshReviews);
    } else {
      showToast("Failed to submit review.", "error");
    }
  };

  if (loading) {
    return (
      <div className="movie-view-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <h2>Loading movie details...</h2>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-view-page">
        <h2>Movie not found.</h2>
      </div>
    );
  }

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";
  
  // Find a YouTube trailer
  const trailer = movie.videos?.results?.find(vid => vid.site === "YouTube" && vid.type === "Trailer");
  
  // Find US watch providers (Stream)
  const providers = movie["watch/providers"]?.results?.US?.flatrate || [];
  
  // Use actual TMDB rating
  const actualRating = movie.vote_average ? movie.vote_average.toFixed(1) : "0.0";

  const similarMovies = movie.similar?.results?.slice(0, 4) || [];

  return (
    <div className="movie-view-page">
      <div className="movie-view-header">
        <div className="movie-view-poster-container">
          <img src={posterUrl} alt={movie.title} className="movie-view-poster" onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80"; }} />
        </div>
        <div className="movie-view-info">
          <h1 className="movie-view-title">{movie.title || movie.original_title}</h1>
          <div className="movie-view-meta">
            <span className="movie-view-year">{releaseYear}</span>
            <div className="movie-view-stats">
              <span>👁️</span>
              <span>{Math.floor(Math.random() * 5000) + 100} Views</span>
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div className="movie-view-genres">
                {movie.genres.map(g => (
                  <span key={g.id} className="movie-view-genre-tag">{g.name}</span>
                ))}
              </div>
            )}
          </div>
          
          <div className="movie-view-actions-bar">
            <div className="movie-view-action-group">
              <button 
                className="btn-icon" 
                onClick={handleLike}
                style={{ color: isLiked ? "#ef4444" : "inherit" }}
              >
                {isLiked ? "❤️" : "🤍"}
              </button>
              <button className="btn-icon" onClick={handleShare} title="Share">↗️</button>
            </div>
            
            <div className="movie-view-rating-section">
              <div className="movie-view-rating-display">
                <span className="rating-value">
                  <img src={Star} alt="Star" style={{ width: '24px', height: '24px' }} />
                  {actualRating}
                </span>
              </div>
              <button className="btn-rate-review" onClick={() => {
                if (!user || user.isAnonymous) {
                  showToast("Please log in to review.", "warning");
                  // Trigger global auth modal if you have one, or just warn
                } else {
                  setIsReviewModalOpen(true);
                }
              }}>
                ✎ Rate / Review
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="movie-view-body">
        <div className="movie-view-main">
          <h3 className="section-title">Overview</h3>
          <p className="movie-view-overview">
            {movie.overview || "No overview available for this title."}
          </p>

          {trailer && (
            <div className="movie-view-trailer">
              <h3 className="section-title">Trailer</h3>
              <iframe 
                className="trailer-iframe"
                src={`https://www.youtube.com/embed/${trailer.key}`} 
                title="YouTube video player" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          )}
        </div>

        <div className="movie-view-sidebar">
          {providers.length > 0 && (
            <div className="movie-view-providers">
              <h3 className="section-title">Stream On</h3>
              <div className="providers-list">
                {providers.map(provider => (
                  <img 
                    key={provider.provider_id}
                    src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`} 
                    alt={provider.provider_name} 
                    className="provider-logo" 
                    title={provider.provider_name}
                  />
                ))}
              </div>
            </div>
          )}

          {similarMovies.length > 0 && (
            <div className="movie-view-similar">
              <h3 className="section-title">Similar</h3>
              <div className="similar-movies-grid">
                {similarMovies.map(similar => (
                  <Link to={`/movie/${similar.id}`} key={similar.id} className="similar-movie-item">
                    <img 
                      src={similar.poster_path ? `https://image.tmdb.org/t/p/w200${similar.poster_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80"} 
                      alt={similar.title} 
                      className="similar-movie-poster" 
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80"; }}
                    />
                    <div className="similar-movie-title">{similar.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="movie-view-reviews">
            <h3 className="section-title">User Reviews</h3>
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <span className="review-author">{review.userName}</span>
                      <span className="review-rating">⭐ {review.rating}</span>
                    </div>
                    <p className="review-text">{review.reviewText}</p>
                    <div className="review-date">
                      {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isReviewModalOpen && (
        <div className="review-modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <h3>Rate & Review</h3>
            <div className="review-modal-content">
              <div className="star-rating-input">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                  <span 
                    key={star} 
                    className={star <= rating ? "active" : ""}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea 
                className="review-textarea" 
                placeholder="What did you think of the movie?"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
              />
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmitReview}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieView;
