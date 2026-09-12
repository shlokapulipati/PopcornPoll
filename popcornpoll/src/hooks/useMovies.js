import { useState, useEffect } from "react";
import { 
  fetchTMDBMovies, 
  searchTMDBMovies, 
  discoverTMDBMovies,
  fetchTMDBGenres, 
  enrichMoviesWithOMDB 
} from "../utils/api";

export const useMovies = (initialType = "popular") => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [type, setType] = useState(initialType);
  const [genres, setGenres] = useState([]);

  // Fetch all genres on mount
  useEffect(() => {
    const getGenres = async () => {
      try {
        const fetchedGenres = await fetchTMDBGenres();
        setGenres(fetchedGenres);
      } catch (err) {
        console.error("Failed to load genres", err);
      }
    };
    getGenres();
  }, []);

  // Fetch movie lists natively via Discover if filters active, otherwise basic popular endpoint
  const getMovieList = async (listType, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const hasAdvancedFilters = filters.country || filters.genre || (filters.minRating && filters.minRating !== "0") || filters.yearStart !== "1990" || filters.yearEnd !== new Date().getFullYear().toString();
      
      let basicMovies = [];

      if (hasAdvancedFilters) {
         let genreId = null;
         if (filters.genre && genres.length > 0) {
           const match = genres.find(g => g.name.toLowerCase() === filters.genre.toLowerCase());
           if (match) genreId = match.id;
         }

         basicMovies = await discoverTMDBMovies(1, {
           country: filters.country,
           genreId,
           minRating: filters.minRating,
           yearStart: filters.yearStart,
           yearEnd: filters.yearEnd
         });
      } else {
         basicMovies = await fetchTMDBMovies(listType, 1);
      }

      // Enrich with detailed OMDB data (directors, true IMDb ratings)
      const detailedMovies = await enrichMoviesWithOMDB(basicMovies);

      setMovies(detailedMovies);
      setType(listType);
    } catch (err) {
      setError(err.message || "Failed to load movie list");
    } finally {
      setLoading(false);
    }
  };

  // Search movies with OMDB enrichment
  const searchMovies = async (query, filters = {}) => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchTMDBMovies(query, 1, filters.country || "");
      const detailedResults = await enrichMoviesWithOMDB(results);
      
      // Apply filters on the enriched list
      let filtered = [...detailedResults];
      
      if (filters.genre) {
        filtered = filtered.filter(m => 
          m.genres && m.genres.some(g => g.toLowerCase() === filters.genre.toLowerCase())
        );
      }
      
      if (filters.minRating) {
        filtered = filtered.filter(m => 
          parseFloat(m.imdbRating || 0) >= parseFloat(filters.minRating)
        );
      }

      if (filters.yearStart && filters.yearEnd) {
        filtered = filtered.filter(m => {
          const year = parseInt((m.release_date || "").substring(0, 4));
          return year >= parseInt(filters.yearStart) && year <= parseInt(filters.yearEnd);
        });
      }

      setMovies(filtered);
    } catch (err) {
      setError(err.message || "Failed to complete search query");
    } finally {
      setLoading(false);
    }
  };

  return {
    movies,
    genres,
    loading,
    error,
    type,
    getMovieList,
    searchMovies,
    setMovies
  };
};
export default useMovies;
