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
      <div className="container mx-auto px-4 md:px-6 py-10 text-destructive font-medium">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 md:px-6 mb-16" id={type}>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h2>

        <div className="flex flex-wrap items-center gap-4">
          <FilterGroup 
            minRating={minRating} 
            onRatingClick={handleFilter}
            ratings={[8, 7, 6, 0]} 
          />

          <select 
            name="by" 
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring" 
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
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex flex-col gap-2">
              <Skeleton type="movie-poster" className="rounded-2xl" />
              <Skeleton type="text" className="w-3/4 mt-2" />
              <Skeleton type="text" className="w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
          {displayedMovies.length > 0 ? (
            displayedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground p-10">
              No movies match the selected filters.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default MovieList;
