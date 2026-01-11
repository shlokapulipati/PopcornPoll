import React from "react";

const FilterGroup = ({ minRating, onRatingClick, ratings }) => {
  return (
    <ul className="movie-filter">
      {ratings.map((rate) => (
        <li
          key={rate}
          className={minRating === rate ? "active" : ""}
          onClick={() => onRatingClick(rate)}
        >
          {rate === 0 ? "All" : `${rate}+ star`}
        </li>
      ))}
    </ul>
  );
};

export default FilterGroup;
