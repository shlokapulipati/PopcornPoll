import React, { useState, useEffect } from "react";
import _ from "lodash";
import useMovies from "../../hooks/useMovies";
import MovieCard from "./MovieCard";
import FilterGroup from "./FilterGroup";
import { Skeleton } from "../UI/UIComponents";
import "./MovieList.css";

const MovieList = ({ type, title }) => {
  const { movies, loading, error, getMovieList } = useMovies(type);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState({
    by: "default",
    order: "asc"
  });

  useEffect(() => {
    getMovieList(type);
  }, [type]);

  const handleFilter = (rate) => {
    setMinRating(rate);
  };

  const handleSort = (e) => {
    const { name, value } = e.target;
    setSort((prev) => ({ ...prev, [name]: value }));
  };

  // Local filtering and sorting to keep UI super fast
  let displayedMovies = [...movies];
  if (minRating > 0) {
    displayedMovies = displayedMovies.filter(
      (movie) => parseFloat(movie.imdbRating || 0) >= minRating
    );
  }
  if (sort.by !== "default") {
    displayedMovies = _.orderBy(displayedMovies, [sort.by], [sort.order]);
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "40px 0", color: "var(--danger-color)" }}>
        <p>⚠️ Error: {error}</p>
      </div>
    );
  }

  return (
    <section className="movie-list container" id={type}>
      <header className="movie-list-header">
        <h2 className="movie-list-heading">{title} 🔥</h2>

        <div className="movie-list-fs">
          <FilterGroup 
            minRating={minRating} 
            onRatingClick={handleFilter}
            ratings={[8, 7, 6, 0]} 
          />

          <select 
            name="by" 
            className="movie-sorting" 
            onChange={handleSort} 
            value={sort.by}
          >
            <option value="default">Sort By</option>
            <option value="release_date">Date</option>
            <option value="imdbRating">Rating</option>
          </select>
          
          <select 
            name="order" 
            value={sort.order} 
            onChange={handleSort} 
            className="movie-sorting"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="grid-responsive" style={{ marginTop: "24px" }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-panel" style={{ padding: "18px" }}>
              <Skeleton type="poster" />
              <Skeleton type="title" />
              <Skeleton type="text" />
              <Skeleton type="text" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-responsive" style={{ marginTop: "24px" }}>
          {displayedMovies.length > 0 ? (
            displayedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
              No movies match the selected filters.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default MovieList;
