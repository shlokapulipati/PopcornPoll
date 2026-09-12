import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchMovieDetails } from "../utils/api";
import { addMovieReview, fetchMovieReviews } from "../utils/firebase";
import { safeJSONParse, safeJSONSet } from "../utils/safeStorage";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Star from "../assets/star.png";

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
      const freshReviews = await fetchMovieReviews(id);
      setReviews(freshReviews);
    } else {
      showToast("Failed to submit review.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-[#a6f3ff]">
        <h2 className="text-3xl font-bold font-heading animate-pulse text-slate-800">Loading movie details...</h2>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-[#a6f3ff]">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Movie not found.</h2>
      </div>
    );
  }

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";
  const trailer = movie.videos?.results?.find(vid => vid.site === "YouTube" && vid.type === "Trailer");
  const providers = movie["watch/providers"]?.results?.US?.flatrate || [];
  const actualRating = movie.vote_average ? movie.vote_average.toFixed(1) : "0.0";
  const similarMovies = movie.similar?.results?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-[#a6f3ff] text-slate-900 pb-20">
      <div className="container mx-auto px-6 md:px-12 pt-16">
        
        {/* Header Section: Poster + Title + Actions */}
        <div className="flex flex-col md:flex-row gap-12 items-start bg-white/90 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl border border-white">
          <div className="w-full md:w-1/3 max-w-[320px] mx-auto md:mx-0 shrink-0">
            {/* The strict aspect-ratio prevents the image from becoming gigantic! */}
            <img 
              src={posterUrl} 
              alt={movie.title} 
              className="w-full aspect-[2/3] object-cover rounded-2xl shadow-lg border border-slate-200"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80"; }} 
            />
          </div>
          
          <div className="flex flex-col items-start gap-6 w-full pt-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-slate-900">
              {movie.title || movie.original_title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xl font-bold text-slate-600">
              <span className="bg-slate-100 px-4 py-1.5 rounded-full">{releaseYear}</span>
              <span className="bg-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span>👁️</span> {Math.floor(Math.random() * 5000) + 100} Views
              </span>
              
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex gap-2">
                  {movie.genres.map(g => (
                    <span key={g.id} className="bg-[#b268f7]/20 text-[#b268f7] px-4 py-1.5 rounded-full">{g.name}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-8 mt-4 w-full">
              <div className="flex items-center gap-4">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className={`h-16 w-16 rounded-full border-2 text-2xl shadow-sm ${isLiked ? "border-red-500 text-red-500 bg-red-50" : "border-slate-200 text-slate-400"}`}
                  onClick={handleLike}
                >
                  {isLiked ? "❤️" : "🤍"}
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-16 w-16 rounded-full border-2 text-2xl shadow-sm border-slate-200" 
                  onClick={handleShare} 
                  title="Share"
                >
                  ↗️
                </Button>
              </div>
              
              <div className="flex items-center gap-6 ml-auto">
                <div className="flex items-center gap-2 text-3xl font-black">
                  <img src={Star} alt="Star" className="w-10 h-10" />
                  <span>{actualRating}</span>
                </div>
                <Button 
                   size="lg"
                   className="bg-black text-white hover:bg-slate-800 h-16 px-8 rounded-full text-lg font-bold shadow-xl"
                   onClick={() => {
                    if (!user || user.isAnonymous) showToast("Please log in to review.", "warning");
                    else setIsReviewModalOpen(true);
                  }}>
                  ✎ Rate / Review
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          {/* Main Info (Overview & Trailer) */}
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-white">
              <h3 className="text-3xl font-black mb-6">Overview</h3>
              <p className="text-xl font-medium text-slate-700 leading-relaxed">
                {movie.overview || "No overview available for this title."}
              </p>
            </div>

            {trailer && (
              <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-white">
                <h3 className="text-3xl font-black mb-6">Trailer</h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${trailer.key}`} 
                    title="YouTube video player" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-10">
            {providers.length > 0 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white">
                <h3 className="text-2xl font-black mb-6">Stream On</h3>
                <div className="flex flex-wrap gap-4">
                  {providers.map(provider => (
                    <img 
                      key={provider.provider_id}
                      src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`} 
                      alt={provider.provider_name} 
                      className="w-16 h-16 rounded-2xl shadow-sm border border-slate-100" 
                      title={provider.provider_name}
                    />
                  ))}
                </div>
              </div>
            )}

            {similarMovies.length > 0 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white">
                <h3 className="text-2xl font-black mb-6">Similar Movies</h3>
                <div className="grid grid-cols-2 gap-4">
                  {similarMovies.map(similar => (
                    <Link to={`/movie/${similar.id}`} key={similar.id} className="group flex flex-col gap-2">
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
                        <img 
                          src={similar.poster_path ? `https://image.tmdb.org/t/p/w200${similar.poster_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80"} 
                          alt={similar.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80"; }}
                        />
                      </div>
                      <div className="text-sm font-bold text-slate-800 truncate">{similar.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white">
              <h3 className="text-2xl font-black mb-6">User Reviews</h3>
              <div className="flex flex-col gap-6">
                {reviews.length === 0 ? (
                  <p className="text-lg font-medium text-slate-500 italic">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-lg">{review.userName}</span>
                        <span className="font-black text-[#ffea2a] text-lg bg-black px-3 py-1 rounded-full">⭐ {review.rating}</span>
                      </div>
                      <p className="text-slate-700 font-medium">{review.reviewText}</p>
                      <div className="text-sm text-slate-400 font-bold mt-4">
                        {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-8 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Rate & Review</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-center gap-2 justify-center text-4xl">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                <span 
                  key={star} 
                  className={`cursor-pointer transition-colors ${star <= rating ? "text-[#ffea2a] drop-shadow-md" : "text-slate-200"}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea 
              className="min-h-[150px] p-4 text-lg font-medium rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 resize-none bg-slate-50" 
              placeholder="What did you think of the movie? Be honest!"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
            />
            <div className="flex gap-4 justify-end">
              <Button size="lg" variant="outline" className="font-bold border-2" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
              <Button size="lg" className="font-bold bg-black text-white hover:bg-slate-800" onClick={handleSubmitReview}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovieView;
