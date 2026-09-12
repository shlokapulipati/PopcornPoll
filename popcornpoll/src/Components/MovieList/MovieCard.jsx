import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { safeJSONParse, safeJSONSet } from "../../utils/safeStorage";
import { useToast } from "../../context/ToastContext";
import { Button } from "@/components/ui/button";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleCreateInstantPoll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    sessionStorage.setItem("draft_poll_movies", JSON.stringify([movie]));
    navigate("/poll/create");
    showToast(`Started a poll draft with "${movie.title || movie.original_title}"`, "success");
  };

  const handleAddToDraftPoll = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const draft = safeJSONParse("draft_poll_movies", [], sessionStorage);
      
      if (draft.some((m) => m.id === movie.id)) {
        showToast(`"${movie.title || movie.original_title}" is already in your poll draft!`, "warning");
        return;
      }
      
      if (draft.length >= 8) {
        showToast("You can only add up to 8 movies to a poll.", "error");
        return;
      }

      const updatedDraft = [...draft, movie];
      safeJSONSet("draft_poll_movies", updatedDraft, sessionStorage);
      
      window.dispatchEvent(new Event("draftPollUpdated"));
      showToast(`Added "${movie.title || movie.original_title}" to poll draft (${updatedDraft.length}/8)`, "success");
    } catch (err) {
      console.error(err);
      showToast("Could not add movie to draft.", "error");
    }
  };

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

  const releaseYear = movie.release_date 
    ? movie.release_date.substring(0, 4) 
    : "N/A";

  const rating = movie.imdbRating 
    ? parseFloat(movie.imdbRating).toFixed(1) 
    : (movie.vote_average ? movie.vote_average.toFixed(1) : "0.0");

  return (
    <div className="group relative flex flex-col transition-all duration-300">
      <Link 
        to={`/movie/${movie.id}`}
        className="flex flex-col flex-grow focus:outline-none"
      >
        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:shadow-[0_8px_30px_rgba(0,201,234,0.3)] transition-all">
          <img 
            src={posterUrl} 
            alt={movie.title || movie.original_title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy"
            onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80"; }}
          />

          {/* Top Right Rating Badge - Ratetastic Style */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10 border border-white/10 shadow-lg">
            <span className="text-white text-xs font-black">★ {rating}</span>
          </div>

          {/* Action overlay */}
          <div className="absolute inset-0 bg-black/60 flex-col justify-end p-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-20 flex">
            <div className="flex gap-2">
              <Button 
                onClick={handleAddToDraftPoll}
                size="sm"
                variant="secondary"
                className="w-full font-bold shadow-sm text-black"
              >
                + Add
              </Button>
            </div>
            <div>
              <Button 
                onClick={handleCreateInstantPoll}
                size="sm"
                className="w-full font-bold shadow-md bg-[#00c9ea] text-slate-900 hover:bg-slate-900 hover:text-white"
              >
                Create Poll
              </Button>
            </div>
          </div>
        </div>
        
        {/* Title and Date Below the Card */}
        <div className="flex flex-col gap-0.5 w-full px-1 flex-grow">
          <h4 className="font-bold text-base text-slate-900 group-hover:text-[#00c9ea] line-clamp-1 truncate transition-colors" title={movie.title || movie.original_title}>
            {movie.title || movie.original_title}
          </h4>
          <span className="text-slate-500 font-semibold text-sm">{releaseYear}</span>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;
