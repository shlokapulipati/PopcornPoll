const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const OMDB_BASE_URL = "https://www.omdbapi.com";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;

// Delay helper for rate limiting / throttling
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple cache wrapper using sessionStorage (for fast search lists)
const withSessionCache = async (cacheKey, fetchFn) => {
  try {
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.warn("Session storage cache reading failed", e);
  }

  const freshData = await fetchFn();
  
  if (freshData) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(freshData));
    } catch (e) {
      console.warn("Session storage caching failed", e);
    }
  }
  return freshData;
};

// Persistent cache wrapper using localStorage (perfect for saving OMDB limits)
const withLocalCache = async (cacheKey, fetchFn) => {
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.warn("Local storage cache reading failed", e);
  }

  const freshData = await fetchFn();
  
  if (freshData) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(freshData));
    } catch (e) {
      console.warn("Local storage caching failed", e);
    }
  }
  return freshData;
};

/**
 * Fetch movie list from TMDB (popular, top_rated, upcoming, trending)
 */
export const fetchTMDBMovies = async (type, page = 1) => {
  const cacheKey = `tmdb_list_${type}_${page}`;
  return withSessionCache(cacheKey, async () => {
    let url = `${TMDB_BASE_URL}/movie/${type}?api_key=${TMDB_API_KEY}&page=${page}`;
    if (type === "trending") {
      url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB error: ${response.statusText}`);
    const data = await response.json();
    return data.results || [];
  });
};

/**
 * Search movies via TMDB (perfect for autocomplete search)
 */
export const searchTMDBMovies = async (query, page = 1) => {
  if (!query) return [];
  const cacheKey = `tmdb_search_${query.toLowerCase()}_${page}`;
  return withSessionCache(cacheKey, async () => {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Search API failure");
    const data = await response.json();
    return data.results || [];
  });
};

/**
 * Fetch all available genres from TMDB
 */
export const fetchTMDBGenres = async () => {
  const cacheKey = "tmdb_genres";
  return withSessionCache(cacheKey, async () => {
    const url = `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch genres");
    const data = await response.json();
    return data.genres || [];
  });
};

/**
 * Fetch detailed movie data from OMDB with persistent Local Cache to respect rate limits
 */
export const fetchOMDBDetails = async (imdbId, title = "", year = "") => {
  if (!imdbId && !title) return null;
  const cacheKey = `omdb_details_${imdbId || title.replace(/\s+/g, "_").toLowerCase()}_${year}`;
  
  return withLocalCache(cacheKey, async () => {
    let url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}`;
    if (imdbId) {
      url += `&i=${imdbId}`;
    } else {
      url += `&t=${encodeURIComponent(title)}`;
      if (year) url += `&y=${year}`;
    }
    
    url += "&plot=full";
    
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.Response === "False") return null;
    return data;
  });
};

/**
 * Helper to fetch detailed data for a list of TMDB movies.
 * Series requests sequentially with a 100ms throttle/delay to respect API rate limits.
 * Caps enrichment at 6 movies to preserve key quota; remaining movies resolve immediately with basic TMDB data.
 */
export const enrichMoviesWithOMDB = async (tmdbMovies) => {
  const moviesToEnrich = tmdbMovies.slice(0, 6);
  const enriched = [];

  for (const movie of moviesToEnrich) {
    try {
      // 100ms throttle delay to prevent burst rate limit errors
      await delay(100);

      // Fetch TMDB movie details to get the imdb_id
      const detailUrl = `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`;
      const detailResp = await fetch(detailUrl);
      if (!detailResp.ok) {
        enriched.push({
          ...movie,
          imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : "0.0",
          genres: [],
          plot: movie.overview
        });
        continue;
      }
      const detailData = await detailResp.json();
      
      const imdbId = detailData.imdb_id;
      const omdbData = await fetchOMDBDetails(imdbId, movie.title, (movie.release_date || "").substring(0, 4));
      
      if (omdbData) {
        enriched.push({
          ...movie,
          imdbRating: omdbData.imdbRating !== "N/A" ? omdbData.imdbRating : movie.vote_average.toFixed(1),
          genres: omdbData.Genre ? omdbData.Genre.split(", ") : [],
          actors: omdbData.Actors !== "N/A" ? omdbData.Actors : "",
          director: omdbData.Director !== "N/A" ? omdbData.Director : "",
          plot: omdbData.Plot !== "N/A" ? omdbData.Plot : movie.overview,
          rated: omdbData.Rated !== "N/A" ? omdbData.Rated : "",
          runtime: omdbData.Runtime !== "N/A" ? omdbData.Runtime : ""
        });
      } else {
        enriched.push({
          ...movie,
          imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : "0.0",
          genres: [],
          plot: movie.overview
        });
      }
    } catch (e) {
      console.warn("Failed to enrich movie details", movie.title, e);
      enriched.push({
        ...movie,
        imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : "0.0",
        genres: [],
        plot: movie.overview
      });
    }
  }

  // Return basic TMDB parameters for the remaining cards
  const remaining = tmdbMovies.slice(6).map((movie) => ({
    ...movie,
    imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : "0.0",
    genres: [],
    plot: movie.overview
  }));

  return [...enriched, ...remaining];
};
